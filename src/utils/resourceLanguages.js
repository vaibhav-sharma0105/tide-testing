// The languages of a resource, from the Sheet's comma-separated Language cell. A cell that says
// "No Language" (a resource with no text to translate) means there is nothing to show, so it is
// dropped here and no badge is drawn for it.
export function parseLanguages(value) {
  return (value?.split(',') ?? [])
    .map(l => l.trim())
    .filter(l => l && !/^no language$/i.test(l))
}
