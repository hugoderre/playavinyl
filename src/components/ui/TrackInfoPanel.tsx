import type { ReactElement } from 'react'
import { useCallback, useEffect } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { useSceneStore } from '../../stores/sceneStore'
import { getAlbumTracks } from '../../hooks/useDeezer'
import { formatDuration, formatProgress } from '../../utils/formatters'
import type { DeezerTrack } from '../../types'

interface TrackInfoPanelProps {
  stopPlayback: () => void
}

export function TrackInfoPanel({ stopPlayback }: TrackInfoPanelProps): ReactElement | null {
  const sceneState = useSceneStore((s) => s.state)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const progress = usePlayerStore((s) => s.progress)
  const albumTracks = useSceneStore((s) => s.albumTracks)
  const setAlbumTracks = useSceneStore((s) => s.setAlbumTracks)
  const selectVinyl = useSceneStore((s) => s.selectVinyl)
  const clearSelection = useSceneStore((s) => s.clearSelection)

  // Load album tracks when a track is playing
  // Intentionally omit `currentTrack` from deps — we only re-fetch when the album ID changes
  useEffect(
    () => {
      if (!currentTrack) return
      getAlbumTracks(currentTrack.album.id).then(setAlbumTracks)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentTrack?.album.id, setAlbumTracks],
  )

  const handleTrackClick = useCallback((track: DeezerTrack) => {
    selectVinyl(track.id)
  }, [selectVinyl])

  if (sceneState !== 'playing' || !currentTrack) return null

  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 z-50 w-80">
      <div className="bg-black/60 backdrop-blur-lg rounded-2xl border border-[var(--color-border)] p-6">
        {/* Cover art */}
        <img
          src={currentTrack.album.cover_big}
          alt={currentTrack.album.title}
          className="w-full aspect-square rounded-lg mb-4 object-cover"
          crossOrigin="anonymous"
        />

        {/* Track info */}
        <h2 className="text-[var(--color-text)] text-lg font-semibold leading-tight">
          {currentTrack.title_short}
        </h2>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">
          {currentTrack.artist.name}
        </p>
        <p className="text-[var(--color-text-muted)] text-xs mt-0.5 opacity-60">
          {currentTrack.album.title}
          {currentTrack.album.release_date && ` · ${currentTrack.album.release_date.slice(0, 4)}`}
        </p>

        {/* Duration */}
        <p className="text-[var(--color-text-muted)] text-xs mt-2">
          {formatDuration(currentTrack.duration)}
        </p>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-200"
              style={{ width: `${(progress / 30) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[var(--color-text-muted)] text-[10px]">
              {formatProgress(progress)}
            </span>
            <span className="text-[var(--color-text-muted)] text-[10px]">
              0:30
            </span>
          </div>
        </div>

        {/* Status */}
        <p className="text-[var(--color-accent)] text-xs mt-2">
          {isPlaying ? '● Playing' : '○ Stopped'}
        </p>

        {/* Deezer link */}
        <a
          href={currentTrack.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline underline-offset-2 transition-colors"
        >
          Écouter sur Deezer ↗
        </a>

        {/* Back to shelf */}
        <button
          onClick={() => {
            clearSelection()
            stopPlayback()
          }}
          className="mt-4 w-full py-2 rounded-lg bg-white/5 text-[var(--color-text-muted)] text-xs hover:bg-white/10 hover:text-[var(--color-text)] transition-colors cursor-pointer"
        >
          ← Retour au bac
        </button>

        {/* Album tracklist */}
        {albumTracks.length > 0 && (
          <div className="mt-5 border-t border-[var(--color-border)] pt-4">
            <h3 className="text-[var(--color-text-muted)] text-[10px] uppercase tracking-widest mb-2">
              Album
            </h3>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {albumTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleTrackClick(track)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                    track.id === currentTrack.id
                      ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                      : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
                  }`}
                >
                  {track.title_short}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
