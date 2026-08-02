// Routes a drop that landed anywhere outside the dropzone to whichever tool is
// mounted. Carries the whole batch: dropping five files past the box has to add
// five, the same as dropping them on it.
let handler = null

export function registerFileDropHandler(fn) {
  handler = fn
  return () => {
    if (handler === fn) handler = null
  }
}

export function emitFileDrop(files) {
  if (!handler || !files?.length) return false
  handler(files)
  return true
}
