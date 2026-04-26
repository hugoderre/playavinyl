import type { ReactElement } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { useSceneStore } from '../../stores/sceneStore'
import { getAlbumTracks } from '../../hooks/useDeezer'
import { useAudio } from '../../hooks/useAudio'
import { formatProgress } from '../../utils/formatters'
import type { DeezerTrack } from '../../types'

const PREVIEW_DURATION = 30

export function TrackInfoPanel(): ReactElement | null {
  const sceneState = useSceneStore((s) => s.state)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const progress = usePlayerStore((s) => s.progress)
  const autoplayBlocked = usePlayerStore((s) => s.autoplayBlocked)
  const albumTracks = useSceneStore((s) => s.albumTracks)
  const setAlbumTracks = useSceneStore((s) => s.setAlbumTracks)
  const selectVinyl = useSceneStore((s) => s.selectVinyl)
  const clearSelection = useSceneStore((s) => s.clearSelection)
  const { resumePlayback, stopPlayback } = useAudio()
  const [albumOpen, setAlbumOpen] = useState(false)

  useEffect(
    () => {
      if (!currentTrack) return
      getAlbumTracks(currentTrack.album.id).then(setAlbumTracks)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentTrack?.album.id, setAlbumTracks],
  )

  // Reset album drawer state when the track changes
  useEffect(() => {
    setAlbumOpen(false)
  }, [currentTrack?.id])

  const handleTrackClick = useCallback(
    (track: DeezerTrack) => {
      selectVinyl(track.id)
    },
    [selectVinyl],
  )

  const handleBack = useCallback(() => {
    clearSelection()
    stopPlayback()
  }, [clearSelection, stopPlayback])

  if (sceneState !== 'playing' || !currentTrack) return null

  const progressPct = Math.min(100, (progress / PREVIEW_DURATION) * 100)
  const releaseYear = currentTrack.album.release_date?.slice(0, 4)

  return (
    <div className="absolute right-8 top-1/2 -translate-y-1/2 z-50 w-[340px] max-h-[80vh]">
      <div className="relative rounded-3xl bg-black/45 backdrop-blur-2xl border border-white/[0.08] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[80vh]">
        {/* Top — back button */}
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 z-10 text-white/40 hover:text-white/90 transition-colors p-1.5 cursor-pointer"
          aria-label="Retour au bac"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="px-7 pt-12 pb-7 overflow-y-auto">
          {/* Now playing dot — pulses when audio is actually flowing */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`size-1.5 rounded-full transition-colors ${
                isPlaying
                  ? 'bg-[var(--color-accent)] animate-pulse'
                  : 'bg-white/25'
              }`}
            />
            <span className="text-[10px] uppercase tracking-[0.22em] text-white/35">
              {autoplayBlocked ? 'En pause' : isPlaying ? 'En lecture' : 'Terminé'}
            </span>
          </div>

          {/* Title — the hero */}
          <h2 className="text-white text-[22px] font-semibold leading-[1.15] tracking-tight">
            {currentTrack.title_short}
          </h2>
          <p className="text-white/70 text-sm mt-1.5">
            {currentTrack.artist.name}
          </p>
          <p className="text-white/35 text-[11px] mt-1">
            {currentTrack.album.title}
            {releaseYear && ` · ${releaseYear}`}
          </p>

          {/* Tap to play — only when autoplay was blocked */}
          {autoplayBlocked && (
            <button
              onClick={resumePlayback}
              className="mt-5 w-full h-10 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
                <path d="M3 2L10 6L3 10V2Z" />
              </svg>
              Lancer la lecture
            </button>
          )}

          {/* Progress — slim, elegant, tabular-nums for stable timecode */}
          <div className="mt-6">
            <div className="h-[3px] bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full bg-white/85 rounded-full transition-[width] duration-200 ease-linear"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-white/45 text-[11px] tabular-nums">
                {formatProgress(progress)}
              </span>
              <span className="text-white/30 text-[11px] tabular-nums">
                0:30
              </span>
            </div>
          </div>

          {/* Album drawer */}
          {albumTracks.length > 1 && (
            <div className="mt-6 pt-5 border-t border-white/[0.06]">
              <button
                onClick={() => setAlbumOpen((v) => !v)}
                className="flex items-center justify-between w-full text-left cursor-pointer group"
              >
                <span className="text-[10px] uppercase tracking-[0.22em] text-white/40 group-hover:text-white/70 transition-colors">
                  Album · {albumTracks.length} titres
                </span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  className={`text-white/40 group-hover:text-white/70 transition-all ${albumOpen ? 'rotate-180' : ''}`}
                >
                  <path
                    d="M2 4L5 7L8 4"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {albumOpen && (
                <div className="mt-3 space-y-px max-h-56 overflow-y-auto -mr-2 pr-2">
                  {albumTracks.map((track, idx) => {
                    const isCurrent = track.id === currentTrack.id
                    return (
                      <button
                        key={track.id}
                        onClick={() => handleTrackClick(track)}
                        className={`flex items-center gap-3 w-full text-left px-2.5 py-2 rounded-md text-[13px] cursor-pointer transition-colors ${
                          isCurrent
                            ? 'bg-white/[0.06] text-white'
                            : 'text-white/55 hover:bg-white/[0.04] hover:text-white/90'
                        }`}
                      >
                        <span
                          className={`text-[10px] tabular-nums w-4 text-right ${
                            isCurrent ? 'text-[var(--color-accent)]' : 'text-white/30'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="flex-1 truncate">{track.title_short}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Deezer link — discreet */}
          <a
            href={currentTrack.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-6 text-white/30 text-[11px] hover:text-white/70 transition-colors"
          >
            Écouter en intégralité sur Deezer
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <path
                d="M3 3H7V7M7 3L3 7"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
