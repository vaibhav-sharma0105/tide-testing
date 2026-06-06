/**
 * Applies all active filters to a flat array of ABL resources.
 * Pure function — no side effects.
 *
 * @param {ResourceObject[]} resources - flat array from useABLData().allResources
 * @param {FilterState} filters - { search, type, grades[], language, ownership }
 * @returns {ResourceObject[]} filtered subset
 */
export function applyResourceFilters(resources, filters) {
  let result = resources

  if (filters.type) {
    result = result.filter(r => r.tab === filters.type || r.type === filters.type)
  }

  if (filters.grades?.length) {
    result = result.filter(r => filters.grades.some(g => r.grades?.includes(g)))
  }

  if (filters.language) {
    const lang = filters.language.toLowerCase()
    result = result.filter(r => r.language?.toLowerCase().includes(lang))
  }

  if (filters.ownership === 'TIDE') {
    result = result.filter(r => r.ownership === 'TIDE')
  } else if (filters.ownership === 'external') {
    result = result.filter(r => r.ownership !== 'TIDE')
  }

  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(r => r.name?.toLowerCase().includes(q))
  }

  return result
}
