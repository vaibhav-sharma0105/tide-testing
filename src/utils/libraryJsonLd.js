import { gradeLabel } from './libraryFilters'

// schema.org LearningResource for one Resource Centre row (/pramaan/resource-centre/:id), added to the
// page like the BreadcrumbList (audit P3). Facts only, all from the Sheet snapshot: name, description,
// type, subject, grades (labels from pramaan-library.yaml), owner, languages. No image (its absolute
// address depends on where the build is served) and no VideoObject (the Sheet has no upload date).

// The Sheet's "Language" column names languages in words ("Gujarati, English"); values it can't
// name ("NA", "null") are left out.
const LANGUAGE_CODES = { english: 'en', gujarati: 'gu', hindi: 'hi' }

export function resourceLanguages(language) {
  if (typeof language !== 'string') return []
  const codes = language.split(',').map((s) => LANGUAGE_CODES[s.trim().toLowerCase()]).filter(Boolean)
  return [...new Set(codes)]
}

export function libraryResourceJsonLd(resource, { url, collectionUrl, collectionName }) {
  const languages = resourceLanguages(resource.language)
  const grades = Array.isArray(resource.grades) ? resource.grades.map(gradeLabel) : []
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: resource.name,
    url,
    ...(resource.description ? { description: resource.description } : {}),
    ...(resource.type ? { learningResourceType: resource.type } : {}),
    ...(resource.subject ? { about: resource.subject } : {}),
    ...(grades.length ? { educationalLevel: grades } : {}),
    ...(languages.length ? { inLanguage: languages.length === 1 ? languages[0] : languages } : {}),
    ...(resource.ownership ? { creator: { '@type': 'Organization', name: resource.ownership } } : {}),
    isPartOf: { '@type': 'CollectionPage', name: collectionName, url: collectionUrl },
  }
}
