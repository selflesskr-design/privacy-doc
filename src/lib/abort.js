export function abortError() {
  const error = new Error('작업이 취소되었습니다.')
  error.name = 'AbortError'
  return error
}

export function throwIfAborted(signal) {
  if (signal?.aborted) throw abortError()
}

export function isAbortError(error) {
  return error?.name === 'AbortError'
}
