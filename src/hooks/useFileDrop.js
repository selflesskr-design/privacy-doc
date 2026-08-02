import { useEffect } from 'react'
import { registerFileDropHandler } from '../lib/fileDropBus.js'

/** Receives files dropped anywhere outside the dropzone, as an array. */
export function useFileDrop(onFiles) {
  useEffect(() => registerFileDropHandler(onFiles), [onFiles])
}
