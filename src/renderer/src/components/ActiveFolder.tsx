import { useAlbumStore } from '@shared/store'
import { TrackEntry } from '@shared/types'
import { Plus } from 'lucide-react'
import { JSX, useEffect, useRef, useState } from 'react'
import { TrackTable } from './TrackTable'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

import { localFileUrl } from '@/lib/utils'

const artworkSrc = (folderPath: string, artwork: string): string =>
  localFileUrl(folderPath, artwork || 'artwork.jpg')

const BAR_COUNT = 12
const IDLE_HEIGHTS = [0.25, 0.4, 0.3, 0.45, 0.2, 0.35, 0.5, 0.3, 0.4, 0.25, 0.45, 0.3]

type EqualizerBarsProps = {
  getAnalyser: () => AnalyserNode | null
  isPlaying: boolean
}

function EqualizerBars({ getAnalyser, isPlaying }: EqualizerBarsProps): JSX.Element {
  const barRefs = useRef<(HTMLSpanElement | null)[]>([])
  const animationFrameIdRef = useRef<number | null>(null)

  useEffect(() => {
    const setHeights = (heights: number[]): void => {
      barRefs.current.forEach((bar, index) => {
        if (bar) bar.style.height = `${Math.max(heights[index], 0.08) * 100}%`
      })
    }

    if (!isPlaying) {
      setHeights(IDLE_HEIGHTS)
      return undefined
    }

    const analyser = getAnalyser()
    if (!analyser) return undefined

    const frequencyData = new Uint8Array(analyser.frequencyBinCount)
    // Sample low-to-mid bins where most musical energy lives
    const bandSize = Math.floor(analyser.frequencyBinCount / 2 / BAR_COUNT)

    const tick = (): void => {
      analyser.getByteFrequencyData(frequencyData)
      const heights = Array.from({ length: BAR_COUNT }, (_, band) => {
        let peak = 0
        for (let bin = band * bandSize; bin < (band + 1) * bandSize; bin++) {
          if (frequencyData[bin] > peak) peak = frequencyData[bin]
        }
        return peak / 255
      })
      setHeights(heights)
      animationFrameIdRef.current = requestAnimationFrame(tick)
    }
    animationFrameIdRef.current = requestAnimationFrame(tick)

    return (): void => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current)
      animationFrameIdRef.current = null
    }
  }, [isPlaying, getAnalyser])

  return (
    <div className="flex items-end gap-[2px] h-4">
      {IDLE_HEIGHTS.map((height, index) => (
        <span
          key={index}
          ref={(el) => {
            barRefs.current[index] = el
          }}
          className="w-[3px] rounded-sm bg-primary transition-[height] duration-75"
          style={{ height: `${height * 100}%` }}
        />
      ))}
    </div>
  )
}

type ActiveFolderProps = {
  onPlayTrack: (track: TrackEntry) => void
  getAnalyser: () => AnalyserNode | null
  isPlaying: boolean
}

export default function ActiveFolder({
  onPlayTrack,
  getAnalyser,
  isPlaying
}: ActiveFolderProps): JSX.Element {
  const activeFolder = useAlbumStore((state) => state.activeFolder)
  const applyManifest = useAlbumStore((state) => state.applyManifest)
  const [isAddingTracks, setIsAddingTracks] = useState(false)

  if (!activeFolder) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        Select an album below to get started
      </div>
    )
  }

  const { artist, artwork, folderPath, name, type } = activeFolder

  const handleAddTracks = async (): Promise<void> => {
    setIsAddingTracks(true)
    try {
      const updated = await window.musicPlayer.addTracks(activeFolder.folderPath)
      if (updated) applyManifest(updated)
    } finally {
      setIsAddingTracks(false)
    }
  }

  return (
    <div className="w-full max-w-3xl flex-1 min-h-0 flex flex-col">
      {/* Album header + track toolbar are fixed; only the list below scrolls */}
      <div className="shrink-0 flex flex-col gap-3 pt-4 pb-2">
        <div className="relative w-full overflow-hidden rounded-xl border border-border shadow-md">
          {/* blurred artwork backdrop */}
          {artwork && (
            <img
              src={artworkSrc(folderPath, artwork)}
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-30 pointer-events-none select-none"
            />
          )}
          <div className="absolute inset-0 bg-card/80 backdrop-blur-sm" />

          <div className="relative flex items-center gap-4 px-5 py-4">
            {/* artwork thumbnail */}
            <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden shadow-lg ring-1 ring-black/10 dark:ring-white/10 bg-muted">
              {artwork ? (
                <img src={artworkSrc(folderPath, artwork)} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  —
                </div>
              )}
            </div>

            {/* text info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight truncate text-foreground">{name}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{artist}</p>
            </div>

            {/* right side: badge + equalizer */}
            <div className="shrink-0 flex flex-col items-end gap-2">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {type}
              </Badge>
              <EqualizerBars getAnalyser={getAnalyser} isPlaying={isPlaying} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {activeFolder.totalTracks} {activeFolder.totalTracks === 1 ? 'track' : 'tracks'}
          </p>
          <Button size="sm" variant="outline" onClick={handleAddTracks} disabled={isAddingTracks}>
            <Plus size={14} />
            {isAddingTracks ? 'Adding…' : 'Add Tracks'}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-2">
        <TrackTable folder={activeFolder} onPlayTrack={onPlayTrack} />
      </div>
    </div>
  )
}
