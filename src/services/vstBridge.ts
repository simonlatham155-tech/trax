/**
 * TRAX VST Bridge Client
 *
 * WebSocket client that connects to the local bridge server (bridge/server.py).
 * Handles reconnection, request/response matching, and exposes a typed API.
 */

export interface BridgePlugin {
  name: string
  vendor: string
  category: string
  uid: string
  path: string
  format: 'VST3' | 'VST2' | 'AU'
}

export interface BridgeRenderResult {
  audio_b64: string
  sample_rate: number
  channels: number
  num_samples: number
  format: 'wav'
}

export type BridgeStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

type MessageHandler = (msg: Record<string, unknown>) => void

const BRIDGE_URL = 'ws://127.0.0.1:7899'
const RECONNECT_DELAY_MS = 3000

class VSTBridgeClient {
  private ws: WebSocket | null = null
  private status: BridgeStatus = 'disconnected'
  private statusListeners = new Set<(s: BridgeStatus) => void>()
  private messageListeners = new Set<MessageHandler>()
  private pendingReplies = new Map<string, (msg: Record<string, unknown>) => void>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private stopped = false

  // ── Connection ─────────────────────────────────────────────────────────────

  connect(): void {
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) return
    this.stopped = false
    this._setStatus('connecting')

    try {
      this.ws = new WebSocket(BRIDGE_URL)
    } catch {
      this._setStatus('error')
      this._scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      this._setStatus('connected')
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
    }

    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as Record<string, unknown>
        this._dispatch(msg)
      } catch { /* ignore malformed */ }
    }

    this.ws.onclose = () => {
      if (!this.stopped) {
        this._setStatus('disconnected')
        this._scheduleReconnect()
      }
    }

    this.ws.onerror = () => {
      this._setStatus('error')
    }
  }

  disconnect(): void {
    this.stopped = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
    this._setStatus('disconnected')
  }

  get currentStatus(): BridgeStatus {
    return this.status
  }

  onStatusChange(cb: (s: BridgeStatus) => void): () => void {
    this.statusListeners.add(cb)
    return () => this.statusListeners.delete(cb)
  }

  onMessage(cb: MessageHandler): () => void {
    this.messageListeners.add(cb)
    return () => this.messageListeners.delete(cb)
  }

  // ── API ───────────────────────────────────────────────────────────────────

  async ping(): Promise<boolean> {
    try {
      await this._send({ type: 'ping' }, 'pong', 3000)
      return true
    } catch {
      return false
    }
  }

  async scanPlugins(extraPaths: string[] = []): Promise<BridgePlugin[]> {
    const res = await this._send(
      { type: 'scan', extra_paths: extraPaths },
      'scan_result',
    ) as { plugins?: BridgePlugin[] }
    return res.plugins ?? []
  }

  async loadPlugin(trackId: string, pluginPath: string): Promise<{ success: boolean; name: string; error?: string }> {
    const res = await this._send(
      { type: 'load', track_id: trackId, path: pluginPath },
      'loaded',
      30_000, // loading can take a few seconds
      trackId,
    ) as { success?: boolean; name?: string; error?: string }
    return {
      success: res.success ?? false,
      name: res.name ?? '',
      error: res.error,
    }
  }

  async unloadPlugin(trackId: string): Promise<void> {
    await this._send({ type: 'unload', track_id: trackId }, 'unloaded', 5000, trackId)
  }

  async renderMidi(
    trackId: string,
    notes: Array<{ pitch: number; startBeat: number; durationBeats: number; velocity: number }>,
    bpm: number,
    durationBeats: number,
    volume = 1.0,
  ): Promise<AudioBuffer> {
    const res = await this._send(
      { type: 'render', track_id: trackId, notes, bpm, duration_beats: durationBeats, volume },
      'rendered',
      60_000, // rendering can take time for long clips
      trackId,
    ) as unknown as BridgeRenderResult & { error?: string }

    if ('error' in res && res.error) {
      throw new Error(res.error)
    }

    return await _wavB64ToAudioBuffer(res.audio_b64)
  }

  async getParameters(trackId: string): Promise<Array<{ name: string; value: number }>> {
    const res = await this._send(
      { type: 'get_params', track_id: trackId },
      'params',
      5000,
      trackId,
    ) as { params?: Array<{ name: string; value: number }> }
    return res.params ?? []
  }

  async setParameter(trackId: string, name: string, value: number): Promise<boolean> {
    const res = await this._send(
      { type: 'set_param', track_id: trackId, name, value },
      'param_set',
      5000,
      trackId,
    ) as { success?: boolean }
    return res.success ?? false
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private _setStatus(s: BridgeStatus) {
    this.status = s
    this.statusListeners.forEach((cb) => cb(s))
  }

  private _dispatch(msg: Record<string, unknown>) {
    // Route to pending promise if a matching reply key exists
    const trackId = msg.track_id as string | undefined
    const type = msg.type as string

    // Try track_id-scoped key first, then type-only key
    const keys = trackId ? [`${type}:${trackId}`, type] : [type]
    for (const key of keys) {
      const resolve = this.pendingReplies.get(key)
      if (resolve) {
        this.pendingReplies.delete(key)
        resolve(msg)
        return
      }
    }

    // Broadcast to raw listeners
    this.messageListeners.forEach((cb) => cb(msg))
  }

  private _send(
    payload: Record<string, unknown>,
    expectType: string,
    timeoutMs = 15_000,
    trackId?: string,
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Bridge not connected'))
        return
      }

      const key = trackId ? `${expectType}:${trackId}` : expectType
      const timer = setTimeout(() => {
        this.pendingReplies.delete(key)
        reject(new Error(`Bridge timeout waiting for '${expectType}'`))
      }, timeoutMs)

      this.pendingReplies.set(key, (msg) => {
        clearTimeout(timer)
        if (msg.type === 'error') {
          reject(new Error((msg.message as string) ?? 'Bridge error'))
        } else {
          resolve(msg)
        }
      })

      this.ws!.send(JSON.stringify(payload))
    })
  }

  private _scheduleReconnect() {
    if (this.stopped || this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (!this.stopped) this.connect()
    }, RECONNECT_DELAY_MS)
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

export const vstBridge = new VSTBridgeClient()

// Auto-connect when module loads
vstBridge.connect()

// ── Helpers ───────────────────────────────────────────────────────────────────

async function _wavB64ToAudioBuffer(b64: string): Promise<AudioBuffer> {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const ctx = new AudioContext()
  return ctx.decodeAudioData(bytes.buffer)
}
