import { SetupScreenProps } from '@shared/types'
import { FolderX, Music2 } from 'lucide-react'
import { JSX } from 'react'
import { Button } from './ui/button'

export function SetupScreen({
  libraryRootIsNull,
  onSelectLibraryRoot
}: SetupScreenProps): JSX.Element {
  return (
    <div className="h-screen w-full justify-center items-center flex flex-col transition-all duration-100 gap-4 bg-primary-foreground">
      <div className="flex flex-col items-center justify-center gap-3">
        {libraryRootIsNull ? (
          <>
            <Music2 size={48} className="text-purple-600 dark:text-purple-300" />
            <p className="text-purple-600 dark:text-purple-300">Choose where to store your music</p>
          </>
        ) : (
          <>
            <FolderX size={48} className="text-purple-600 dark:text-purple-300" />
            <p className="text-purple-600 dark:text-purple-300">Music folder could not be found</p>
          </>
        )}
        <Button variant="default" onClick={onSelectLibraryRoot}>
          {libraryRootIsNull ? 'Choose music folder' : 'Select a different folder'}{' '}
        </Button>
      </div>
    </div>
  )
}
