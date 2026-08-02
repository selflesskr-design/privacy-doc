// A phone photo taken in portrait is stored as landscape pixels plus an EXIF
// tag saying how to turn it. Viewers obey the tag; pdf-lib's embedJpg reads the
// pixel dimensions and does not. Without this, an upright photo lands sideways
// in the PDF.
//
// Returns 1..8 as defined by EXIF, or 1 when there is no tag to read — 1 means
// "already upright", so callers can treat it as "nothing to do".

const ORIENTATION_TAG = 0x0112

/**
 * Read the EXIF orientation of a JPEG.
 * @param {ArrayBuffer} buffer
 * @returns {number} 1..8
 */
export function readJpegOrientation(buffer) {
  const view = new DataView(buffer)
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return 1 // not a JPEG

  let offset = 2
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset)
    if ((marker & 0xff00) !== 0xff00) return 1 // out of step with the segments
    const size = view.getUint16(offset + 2)
    if (marker === 0xffe1) return readApp1(view, offset + 4, size - 2)
    if (marker === 0xffda) return 1 // image data starts; no EXIF before it
    offset += 2 + size
  }
  return 1
}

function readApp1(view, start, length) {
  // "Exif\0\0"
  if (start + 6 > view.byteLength || view.getUint32(start) !== 0x45786966) return 1

  const tiff = start + 6
  if (tiff + 8 > view.byteLength) return 1
  const endian = view.getUint16(tiff)
  const little = endian === 0x4949
  if (!little && endian !== 0x4d4d) return 1

  const ifdOffset = view.getUint32(tiff + 4, little)
  const ifd = tiff + ifdOffset
  if (ifd + 2 > view.byteLength) return 1

  const count = view.getUint16(ifd, little)
  const end = Math.min(ifd + 2 + count * 12, start + length, view.byteLength)
  for (let entry = ifd + 2; entry + 12 <= end; entry += 12) {
    if (view.getUint16(entry, little) === ORIENTATION_TAG) {
      const value = view.getUint16(entry + 8, little)
      return value >= 1 && value <= 8 ? value : 1
    }
  }
  return 1
}
