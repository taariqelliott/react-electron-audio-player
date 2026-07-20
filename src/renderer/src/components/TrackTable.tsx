import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAlbumStore } from '@shared/store'
import { Manifest, TrackEntry } from '@shared/types'
import { GripVertical, Music2, Play, Trash2 } from 'lucide-react'
import { JSX, KeyboardEvent, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from './ui/alert-dialog'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

type EditableCellProps = {
  value: string
  placeholder: string
  onCommit: (value: string) => void
}

function EditableCell({ value, placeholder, onCommit }: EditableCellProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const commit = (): void => {
    setIsEditing(false)
    if (draft.trim() !== value) onCommit(draft.trim())
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') commit()
    if (event.key === 'Escape') {
      setDraft(value)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <Input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="h-7 text-sm"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value)
        setIsEditing(true)
      }}
      className={`w-full text-left truncate rounded px-1 -mx-1 py-0.5 hover:bg-accent/60 transition-colors cursor-text ${value ? '' : 'text-muted-foreground italic'}`}
    >
      {value || placeholder}
    </button>
  )
}

type TrackRowProps = {
  track: TrackEntry
  isActive: boolean
  onPlay: (track: TrackEntry) => void
  onUpdate: (track: TrackEntry, fields: { title: string; artist: string }) => void
  onRequestDelete: (track: TrackEntry) => void
}

function TrackRow({
  track,
  isActive,
  onPlay,
  onUpdate,
  onRequestDelete
}: TrackRowProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.filename
  })

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-state={isActive ? 'selected' : undefined}
      className={isDragging ? 'relative z-10 bg-accent' : ''}
    >
      <TableCell className="w-8 pr-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex items-center justify-center text-muted-foreground/60 hover:text-foreground cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
      </TableCell>
      <TableCell className="w-10 text-muted-foreground tabular-nums">{track.trackOrder}</TableCell>
      <TableCell className="max-w-0 w-[40%]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <EditableCell
              value={track.title}
              placeholder="Untitled"
              onCommit={(title) => onUpdate(track, { title, artist: track.artist })}
            />
          </div>
          {track.missing && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">
              missing
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="max-w-0 w-[30%]">
        <EditableCell
          value={track.artist}
          placeholder="Unknown artist"
          onCommit={(artist) => onUpdate(track, { title: track.title, artist })}
        />
      </TableCell>
      <TableCell className="w-16 text-right text-muted-foreground tabular-nums">
        {formatDuration(track.duration)}
      </TableCell>
      <TableCell className="w-20">
        <div className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={track.missing}
                  onClick={() => onPlay(track)}
                />
              }
            >
              <Play size={13} />
            </TooltipTrigger>
            <TooltipContent>Play track</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onRequestDelete(track)}
                />
              }
            >
              <Trash2 size={13} />
            </TooltipTrigger>
            <TooltipContent>Delete track</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  )
}

type TrackTableProps = {
  folder: Manifest
  onPlayTrack: (track: TrackEntry) => void
}

export function TrackTable({ folder, onPlayTrack }: TrackTableProps): JSX.Element {
  const activeTrackFilename = useAlbumStore((state) => state.activeTrackFilename)
  const applyManifest = useAlbumStore((state) => state.applyManifest)
  const [trackToDelete, setTrackToDelete] = useState<TrackEntry | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const tracks = [...folder.tracks].sort((a, b) => a.trackOrder - b.trackOrder)

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = tracks.findIndex((track) => track.filename === active.id)
    const newIndex = tracks.findIndex((track) => track.filename === over.id)
    const reordered = arrayMove(tracks, oldIndex, newIndex).map((track, index) => ({
      ...track,
      trackOrder: index + 1
    }))

    applyManifest({ ...folder, tracks: reordered })
    const updated = await window.musicPlayer.reorderTracks({
      folderPath: folder.folderPath,
      filenames: reordered.map((track) => track.filename)
    })
    applyManifest(updated)
  }

  const handleUpdate = async (
    track: TrackEntry,
    fields: { title: string; artist: string }
  ): Promise<void> => {
    const updated = await window.musicPlayer.updateTrack({
      folderPath: folder.folderPath,
      filename: track.filename,
      title: fields.title,
      artist: fields.artist
    })
    applyManifest(updated)
  }

  const handleDelete = async (): Promise<void> => {
    if (!trackToDelete) return
    const updated = await window.musicPlayer.deleteTrack({
      folderPath: folder.folderPath,
      filename: trackToDelete.filename
    })
    setTrackToDelete(null)
    applyManifest(updated)
  }

  return (
    <div className="w-full">
      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground border border-dashed border-border rounded-lg">
          <Music2 size={24} className="opacity-40" />
          <p className="text-sm">No tracks yet — add some audio files</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead className="w-10">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={tracks.map((track) => track.filename)}
                strategy={verticalListSortingStrategy}
              >
                {tracks.map((track) => (
                  <TrackRow
                    key={track.filename}
                    track={track}
                    isActive={activeTrackFilename === track.filename}
                    onPlay={onPlayTrack}
                    onUpdate={handleUpdate}
                    onRequestDelete={setTrackToDelete}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      )}

      <AlertDialog
        open={trackToDelete !== null}
        onOpenChange={(open) => !open && setTrackToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete track?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes “{trackToDelete?.title}” from disk. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
