// Reads what a photo carries besides the picture: where it was taken, when, and
// on what. A phone writes all of it by default and none of it is visible until
// something reads it out — which is the whole reason 사진 정보 삭제 exists, and
// why a photo is worth checking before it is sent anywhere.
//
// Only the fields we can act on or show. Everything is parsed from the bytes;
// no library, no network.

const TAG = {
  ORIENTATION: 0x0112,
  MAKE: 0x010f,
  MODEL: 0x0110,
  SOFTWARE: 0x0131,
  EXIF_IFD: 0x8769,
  GPS_IFD: 0x8825,
  DATE_ORIGINAL: 0x9003,
}

const GPS = {
  LAT_REF: 1,
  LAT: 2,
  LON_REF: 3,
  LON: 4,
}

/** Locate the TIFF header inside the APP1 segment of a JPEG. */
function findTiff(view) {
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null
  let offset = 2
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset)
    if ((marker & 0xff00) !== 0xff00) return null
    const size = view.getUint16(offset + 2)
    if (marker === 0xffda) return null // image data; no EXIF before it
    if (marker === 0xffe1) {
      const start = offset + 4
      if (start + 6 > view.byteLength || view.getUint32(start) !== 0x45786966) return null
      const tiff = start + 6
      if (tiff + 8 > view.byteLength) return null
      const endian = view.getUint16(tiff)
      if (endian !== 0x4949 && endian !== 0x4d4d) return null
      return { tiff, little: endian === 0x4949 }
    }
    offset += 2 + size
  }
  return null
}

/** Read one IFD into a map of tag -> { type, count, valueOffset }. */
function readIfd(view, tiff, little, offset) {
  const ifd = tiff + offset
  if (ifd + 2 > view.byteLength) return {}
  const count = view.getUint16(ifd, little)
  const out = {}
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12
    if (entry + 12 > view.byteLength) break
    out[view.getUint16(entry, little)] = {
      type: view.getUint16(entry + 2, little),
      count: view.getUint32(entry + 4, little),
      entry,
    }
  }
  return out
}

const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 }

function valueStart(view, tiff, little, field) {
  const bytes = (TYPE_SIZE[field.type] || 1) * field.count
  return bytes <= 4 ? field.entry + 8 : tiff + view.getUint32(field.entry + 8, little)
}

function readString(view, tiff, little, field) {
  if (!field || field.type !== 2) return null
  const start = valueStart(view, tiff, little, field)
  let s = ''
  for (let i = 0; i < field.count && start + i < view.byteLength; i++) {
    const c = view.getUint8(start + i)
    if (!c) break
    s += String.fromCharCode(c)
  }
  return s.trim() || null
}

/** RATIONAL triplet — degrees, minutes, seconds — as decimal degrees. */
function readDegrees(view, tiff, little, field) {
  if (!field || field.type !== 5 || field.count < 3) return null
  const start = valueStart(view, tiff, little, field)
  let deg = 0
  for (let i = 0; i < 3; i++) {
    const num = view.getUint32(start + i * 8, little)
    const den = view.getUint32(start + i * 8 + 4, little)
    if (!den) return null
    deg += num / den / 60 ** i
  }
  return deg
}

/**
 * @param {ArrayBuffer} buffer
 * @returns {{orientation:number, gps:{lat:number, lon:number}|null,
 *            taken:string|null, camera:string|null, software:string|null}}
 */
export function readExif(buffer) {
  const empty = { orientation: 1, gps: null, taken: null, camera: null, software: null }
  const view = new DataView(buffer)
  const head = findTiff(view)
  if (!head) return empty
  const { tiff, little } = head

  const ifd0 = readIfd(view, tiff, little, view.getUint32(tiff + 4, little))
  const result = { ...empty }

  const orientation = ifd0[TAG.ORIENTATION]
  if (orientation) {
    const v = view.getUint16(orientation.entry + 8, little)
    if (v >= 1 && v <= 8) result.orientation = v
  }

  const make = readString(view, tiff, little, ifd0[TAG.MAKE])
  const model = readString(view, tiff, little, ifd0[TAG.MODEL])
  result.camera = [make, model].filter(Boolean).join(' ') || null
  result.software = readString(view, tiff, little, ifd0[TAG.SOFTWARE])

  const exifPointer = ifd0[TAG.EXIF_IFD]
  if (exifPointer) {
    const exif = readIfd(view, tiff, little, view.getUint32(exifPointer.entry + 8, little))
    result.taken = readString(view, tiff, little, exif[TAG.DATE_ORIGINAL])
  }

  const gpsPointer = ifd0[TAG.GPS_IFD]
  if (gpsPointer) {
    const gps = readIfd(view, tiff, little, view.getUint32(gpsPointer.entry + 8, little))
    const lat = readDegrees(view, tiff, little, gps[GPS.LAT])
    const lon = readDegrees(view, tiff, little, gps[GPS.LON])
    const latRef = readString(view, tiff, little, gps[GPS.LAT_REF])
    const lonRef = readString(view, tiff, little, gps[GPS.LON_REF])
    if (lat != null && lon != null) {
      result.gps = {
        lat: latRef === 'S' ? -lat : lat,
        lon: lonRef === 'W' ? -lon : lon,
      }
    }
  }

  return result
}

/** Kept for the export paths, which only need to know how to turn the pixels. */
export function readJpegOrientation(buffer) {
  return readExif(buffer).orientation
}
