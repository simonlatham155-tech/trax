/// <reference types="vite/client" />

// Web MIDI API types (not in lib.dom.d.ts by default in all TS versions)
interface MIDIMessageEvent extends Event {
  readonly data: Uint8Array;
}
interface MIDIPort extends EventTarget {
  id: string;
  name?: string;
  type: 'input' | 'output';
  state: 'connected' | 'disconnected' | 'pending';
  onmidimessage: ((e: MIDIMessageEvent) => void) | null;
}
interface MIDIInput extends MIDIPort { type: 'input'; }
interface MIDIOutput extends MIDIPort { type: 'output'; }
interface MIDIAccess extends EventTarget {
  inputs: Map<string, MIDIInput>;
  outputs: Map<string, MIDIOutput>;
  onstatechange: ((e: Event) => void) | null;
}
interface Navigator {
  requestMIDIAccess(options?: { sysex?: boolean }): Promise<MIDIAccess>;
}
