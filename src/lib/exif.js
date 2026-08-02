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

function ascii(view, start, length) {
  if (start < 0 || start + length > view.byteLength) return ''
  let out = ''
  for (let i = 0; i < length; i++) out += String.fromCharCode(view.getUint8(start + i))
  return out
}

function tiffAt(view, tiff) {
  if (tiff < 0 || tiff + 8 > view.byteLength) return null
  const endian = view.getUint16(tiff)
  if (endian !== 0x4949 && endian !== 0x4d4d) return null
  return { tiff, little: endian === 0x4949 }
}

/** Locate metadata and, when present, a TIFF/EXIF header in JPEG, PNG or WebP. */
function findMetadata(view) {
  if (view.byteLength < 4) return { metadataDetected: false }

  // JPEG can contain more than one APP1 segment. XMP commonly comes before
  // EXIF, so a non-EXIF APP1 must be skipped rather than ending the search.
  if (view.getUint16(0) === 0xffd8) {
    let metadataDetected = false
    let offset = 2
    while (offset + 4 <= view.byteLength) {
      const marker = view.getUint16(offset)
      if ((marker & 0xff00) !== 0xff00) break
      if (marker === 0xffda || marker === 0xffd9) break
      const size = view.getUint16(offset + 2)
      if (size < 2 || offset + 2 + size > view.byteLength) break
      if (marker === 0xffe1) {
        metadataDetected = true
        const start = offset + 4
        if (ascii(view, start, 6) === 'Exif\0\0') {
          const head = tiffAt(view, start + 6)
          if (head) return { ...head, metadataDetected: true }
        }
      }
      offset += 2 + size
    }
    return { metadataDetected }
  }

  // PNG stores EXIF in an eXIf chunk. Text and ICC chunks are also metadata
  // worth removing even though this small inspector does not display them.
  if (
    view.byteLength >= 8 &&
    view.getUint32(0) === 0x89504e47 &&
    view.getUint32(4) === 0x0d0a1a0a
  ) {
    let metadataDetected = false
    let offset = 8
    while (offset + 12 <= view.byteLength) {
      const size = view.getUint32(offset)
      const type = ascii(view, offset + 4, 4)
      const data = offset + 8
      if (data + size + 4 > view.byteLength) break
      if (['eXIf', 'iTXt', 'tEXt', 'zTXt', 'iCCP'].includes(type)) metadataDetected = true
      if (type === 'eXIf') {
        const head = tiffAt(view, data)
        if (head) return { ...head, metadataDetected: true }
      }
      offset = data + size + 4
    }
    return { metadataDetected }
  }

  // WebP uses RIFF chunks. EXIF payloads may start with either the TIFF header
  // itself or the six-byte Exif marker used by JPEG.
  if (ascii(view, 0, 4) === 'RIFF' && ascii(view, 8, 4) === 'WEBP') {
    let metadataDetected = false
    let offset = 12
    while (offset + 8 <= view.byteLength) {
      const type = ascii(view, offset, 4)
      const size = view.getUint32(offset + 4, true)
      const data = offset + 8
      if (data + size > view.byteLength) break
      if (type === 'EXIF' || type === 'XMP ' || type === 'ICCP') metadataDetected = true
      if (type === 'EXIF') {
        const start = ascii(view, data, 6) === 'Exif\0\0' ? data + 6 : data
        const head = tiffAt(view, start)
        if (head) return { ...head, metadataDetected: true }
      }
      offset = data + size + (size % 2)
    }
    return { metadataDetected }
  }

  return { metadataDetected: false }
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
 *            taken:string|null, camera:string|null, software:string|null,
 *            metadataDetected:boolean}}
 */
export function readExif(buffer) {
  const empty = {
    orientation: 1,
    gps: null,
    taken: null,
    camera: null,
    software: null,
    metadataDetected: false,
  }
  const view = new DataView(buffer)
  const located = findMetadata(view)
  const head = located.tiff == null ? null : located
  empty.metadataDetected = located.metadataDetected
  if (!head) return empty
  const { tiff, little } = head

  try {
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
  } catch {
    // A malformed offset must not turn a local inspection into an unhandled
    // error. We can still offer to rewrite the pixels and remove the metadata.
    return empty
  }
}

/** Kept for the export paths, which only need to know how to turn the pixels. */
export function readJpegOrientation(buffer) {
  return readExif(buffer).orientation
}
