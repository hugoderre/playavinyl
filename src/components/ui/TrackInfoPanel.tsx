import type { ReactElement } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { useSceneStore } from '../../stores/sceneStore'
import { getAlbumTracks } from '../../hooks/useDeezer'
import { useAudio } from '../../hooks/useAudio'
import { useDominantColor, rgbToHex } from '../../hooks/useDominantColor'
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
  const { resumePlayback } = useAudio()
  const [albumOpen, setAlbumOpen] = useState(false)
  const dominantRgb = useDominantColor(currentTrack?.album.cover_big)
  const accentColor = dominantRgb ? rgbToHex(dominantRgb) : '#ffb066'

  useEffect(
    () => {
      if (!currentTrack) return
      getAlbumTracks(currentTrack.album.id).then(setAlbumTracks)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentTrack?.album.id, setAlbumTracks],
  )

  useEffect(() => {
    setAlbumOpen(false)
  }, [currentTrack?.id])

  const handleTrackClick = useCallback(
    (track: DeezerTrack) => {
      selectVinyl(track.id)
    },
    [selectVinyl],
  )

  if (sceneState !== 'playing' || !currentTrack) return null

  const progressPct = Math.min(100, (progress / PREVIEW_DURATION) * 100)
  const releaseYear = currentTrack.album.release_date?.slice(0, 4)
  const albumLine = releaseYear
    ? `${currentTrack.album.title} · ${releaseYear}`
    : currentTrack.album.title

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 animate-fade-in-soft sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-1/2 sm:-translate-y-1/2 sm:w-[clamp(300px,28vw,380px)]">
      <div className="relative rounded-t-3xl sm:rounded-3xl bg-black/55 backdrop-blur-2xl border border-white/[0.08] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] flex flex-col max-h-[55vh] sm:max-h-[80vh]">
        <div className="px-7 pt-7 pb-10 sm:pb-7 overflow-y-auto">
          {/* Status pill — pulses with audio flow, tinted by the cover */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`size-1.5 rounded-full transition-colors ${isPlaying ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: isPlaying ? accentColor : 'rgba(255,255,255,0.25)' }}
            />
            <span className="text-[10px] uppercase tracking-[0.22em] text-white/40">
              {autoplayBlocked ? 'En pause' : isPlaying ? 'En lecture' : 'Terminé'}
            </span>
          </div>

          {/* Title — the hero. line-clamp-2 so very long titles never overflow */}
          <h2 className="text-white text-[22px] font-semibold leading-[1.18] tracking-tight line-clamp-2 break-words">
            {currentTrack.title_short}
          </h2>
          <p className="text-white/75 text-sm mt-1.5 truncate">
            {currentTrack.artist.name}
          </p>
          <p className="text-white/40 text-[11px] mt-1 truncate" title={albumLine}>
            {albumLine}
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

          {/* Progress — fill tinted by the cover so the panel feels like part of the record */}
          <div className="mt-6">
            <div className="h-[3px] bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-200 ease-linear"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: accentColor,
                  boxShadow: `0 0 12px ${accentColor}88`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-white/50 text-[11px] tabular-nums">
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
                <span className="text-[10px] uppercase tracking-[0.22em] text-white/45 group-hover:text-white/80 transition-colors truncate">
                  Album · {albumTracks.length} titres
                </span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  className={`shrink-0 ml-2 text-white/45 group-hover:text-white/80 transition-all ${albumOpen ? 'rotate-180' : ''}`}
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

              {/* Smooth height animation via the grid 0fr ↔ 1fr trick — no JS, no measuring */}
              <div
                className={`grid transition-[grid-template-rows] duration-[280ms] ease-out ${
                  albumOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
                aria-hidden={!albumOpen}
              >
                <div className="overflow-hidden">
                  <div className="mt-3 space-y-px max-h-56 overflow-y-auto -mr-2 pr-2">
                    {albumTracks.map((track, idx) => {
                      const isCurrent = track.id === currentTrack.id
                      return (
                        <button
                          key={track.id}
                          onClick={() => handleTrackClick(track)}
                          tabIndex={albumOpen ? 0 : -1}
                          className={`flex items-center gap-3 w-full text-left px-2.5 py-2 rounded-md text-[13px] cursor-pointer transition-colors ${
                            isCurrent
                              ? 'bg-white/[0.06] text-white'
                              : 'text-white/55 hover:bg-white/[0.04] hover:text-white/90'
                          }`}
                        >
                          <span
                            className="text-[10px] tabular-nums w-4 text-right shrink-0"
                            style={{
                              color: isCurrent ? accentColor : 'rgba(255,255,255,0.3)',
                            }}
                          >
                            {idx + 1}
                          </span>
                          <span className="flex-1 truncate">{track.title_short}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deezer link */}
          <a
            href={currentTrack.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-6 text-white/35 text-[11px] hover:text-white/80 transition-colors"
          >
            Écouter en intégralité sur Deezer
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" className="shrink-0">
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
