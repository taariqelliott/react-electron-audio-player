import { useAlbumStore } from '@shared/store'
import { JSX } from 'react'
import { Badge } from './ui/badge'

const artworkSrc = (folderPath: string): string => `localfile://${folderPath}/artwork.jpg`

function EqualizerBars(): JSX.Element {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {[0.6, 1, 0.75, 0.9, 0.5].map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-sm bg-primary animate-pulse"
          style={{
            height: `${h * 100}%`,
            animationDelay: `${i * 200}ms`,
            animationDuration: `${1400 + i * 150}ms`
          }}
        />
      ))}
    </div>
  )
}

export default function ActiveFolder(): JSX.Element {
  const activeFolder = useAlbumStore((state) => state.activeFolder)

  if (!activeFolder) return <div />

  const { artist, artwork, folderPath, name, type } = activeFolder

  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-border shadow-md">
      {/* blurred artwork backdrop */}
      {artwork && (
        <img
          src={artworkSrc(folderPath)}
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-30 pointer-events-none select-none"
        />
      )}
      <div className="absolute inset-0 bg-card/80 backdrop-blur-sm" />

      <div className="relative flex items-center gap-4 px-5 py-4">
        {/* artwork thumbnail */}
        <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden shadow-lg ring-1 ring-black/10 dark:ring-white/10 bg-muted">
          {artwork ? (
            <img src={artworkSrc(folderPath)} className="w-full h-full object-cover" />
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
          <EqualizerBars />
        </div>
      </div>
    </div>
  )
}
