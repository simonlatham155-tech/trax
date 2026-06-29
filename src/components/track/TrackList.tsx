import { Plus, Music2, Waves } from 'lucide-react';
import { useDAWStore } from '@/store/daw-store';
import { TrackHeader } from './TrackHeader';

export function TrackList() {
  const tracks = useDAWStore((s) => s.tracks);
  const selectedTrackId = useDAWStore((s) => s.ui.selectedTrackId);
  const scrollY = useDAWStore((s) => s.ui.scrollY);
  const addTrack = useDAWStore((s) => s.addTrack);

  return (
    <div className="w-56 shrink-0 flex flex-col bg-[#0f0f18] border-r border-[#1e1e2a] overflow-hidden">
      {/* Header row matching timeline ruler height */}
      <div className="h-7 flex items-center justify-between px-3 border-b border-[#1e1e2a] bg-[#0a0a12] shrink-0">
        <span className="text-[9px] font-bold text-[#55557a] uppercase tracking-widest">
          Track
        </span>
        <button
          onClick={() => addTrack('audio')}
          title="Add track"
          className="w-5 h-5 flex items-center justify-center rounded text-[#55557a] hover:text-[#e8e8f0] hover:bg-[#22222e] transition-colors"
        >
          <Plus size={11} />
        </button>
      </div>

      {/* Track list */}
      <div
        className="flex-1 overflow-hidden"
        style={{ transform: `translateY(-${scrollY % 1}px)` }}
      >
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <Music2 size={24} className="text-[#2a2a38]" />
            <span className="text-[11px] text-[#55557a]">No tracks</span>
            <button
              onClick={() => addTrack('audio')}
              className="text-[11px] text-[#6c63ff] hover:text-[#8888ff] transition-colors"
            >
              + Add track
            </button>
          </div>
        ) : (
          tracks.map((track) => (
            <TrackHeader
              key={track.id}
              track={track}
              isSelected={track.id === selectedTrackId}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#1e1e2a] p-1.5 flex gap-1">
        <button
          onClick={() => addTrack('audio')}
          className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-[#1a1a24] hover:bg-[#22222e] text-[#8888aa] hover:text-[#e8e8f0] transition-colors text-[10px]"
        >
          <Waves size={10} />
          Audio
        </button>
        <button
          onClick={() => addTrack('midi')}
          className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-[#1a1a24] hover:bg-[#22222e] text-[#8888aa] hover:text-[#e8e8f0] transition-colors text-[10px]"
        >
          <Music2 size={10} />
          MIDI
        </button>
        <button
          onClick={() => addTrack('bus')}
          className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-[#1a1a24] hover:bg-[#22222e] text-[#8888aa] hover:text-[#e8e8f0] transition-colors text-[10px]"
        >
          <span className="text-[9px] font-bold">B</span>
          Bus
        </button>
      </div>
    </div>
  );
}
