// Client-side download helpers. Everything happens via object URLs created from
// in-memory Blobs — no server round-trip, nothing leaves the browser.

/** Trigger a browser download for a Blob or Uint8Array/ArrayBuffer. */
export function downloadBlob(data, filename, mime = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Download plain text. */
export function downloadText(text, filename, mime = 'text/plain') {
  downloadBlob(new Blob([text], { type: `${mime};charset=utf-8` }), filename)
}

/** Read a File/Blob as an ArrayBuffer. */
export function readAsArrayBuffer(file) {
  return file.arrayBuffer()
}

/** Read a File/Blob as a data URL. */
export function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** Load an HTMLImageElement from a File/Blob (revokes its object URL on load). */
export function loadImage(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob)
    const img = new Image()
    img.onload = () => {
      resolve(img)
      // keep url alive until caller draws; revoke slightly later
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('이미지를 읽을 수 없습니다. 파일이 손상되었거나 지원하지 않는 형식일 수 있습니다.'))
    }
    img.src = url
  })
}
