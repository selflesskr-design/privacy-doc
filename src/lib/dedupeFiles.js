// Shared file-batch de-duplication for the "add files" flows.

/** Identity of a file for duplicate detection: same name AND same size. */
const keyOf = (file) => `${file.name}:${file.size}`

/**
 * Split an incoming batch into the files worth adding and a count of the ones
 * skipped as duplicates. A file is a duplicate if it matches (name + size) one
 * already in `existing` OR one earlier in the same batch, so a selection that
 * repeats a file adds it only once. Order of the kept files is preserved.
 *
 * @param {File[]} existing - files already in the list
 * @param {File[]} incoming - the newly selected batch
 * @returns {{ unique: File[], skipped: string[] }} skipped holds their names
 */
export function dedupeFiles(existing, incoming) {
  const seen = new Set(existing.map(keyOf))
  const unique = []
  const skipped = []
  for (const file of incoming) {
    const key = keyOf(file)
    if (seen.has(key)) {
      skipped.push(file.name)
      continue
    }
    seen.add(key)
    unique.push(file)
  }
  return { unique, skipped }
}

/**
 * Names what was left out and why. Nothing went wrong and there is nothing to
 * do about it, so it says what happened rather than warning.
 */
export function skippedNotice(skipped) {
  if (!skipped?.length) return ''
  // Names go last so the sentence needs no particle after them.
  return `같은 파일은 한 번만 넣습니다: ${skipped.join(', ')}`
}
