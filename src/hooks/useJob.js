import { useState, useCallback, useEffect, useRef } from 'react'

// Standardizes the run/progress/error/result lifecycle every operation shares.
// The worker/async function receives a progress callback and an AbortSignal.
const SLOW_THRESHOLD = 500 // ms before cancel button appears

export function useJob() {
  const [running, setRunning] = useState(false)
  const [slow, setSlow] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const runId = useRef(0)
  const controllerRef = useRef(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const run = useCallback(async (fn) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const id = ++runId.current
    setRunning(true)
    setSlow(false)
    setError(null)
    setResult(null)
    setProgress({ value: null, message: '준비하고 있습니다…' })

    const slowTimer = setTimeout(() => {
      if (runId.current === id) setSlow(true)
    }, SLOW_THRESHOLD)

    const onProgress = (value, message) => {
      if (runId.current === id) setProgress({ value, message })
    }
    try {
      const out = await fn(onProgress, controller.signal)
      if (runId.current === id) setResult(out)
      return out
    } catch (err) {
      if (runId.current === id && err?.name !== 'AbortError') {
        console.error(err)
        setError(err?.message || String(err) || '파일을 처리하는 중 문제가 발생했습니다.')
      }
      return null
    } finally {
      clearTimeout(slowTimer)
      if (runId.current === id) {
        controllerRef.current = null
        setRunning(false)
        setSlow(false)
        setProgress(null)
      }
    }
  }, [])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    runId.current++
    setRunning(false)
    setSlow(false)
    setProgress(null)
    setError(null)
    setResult(null)
  }, [])

  const cancel = reset

  return { running, slow, progress, error, result, run, reset, cancel, setError }
}
