import { describe, it, expect } from 'vitest'
import { libraryResourceJsonLd, resourceLanguages } from '../../utils/libraryJsonLd'
import snapshot from '../../data/sheets/pramaan-library.json'

const opts = { url: 'https://x.org/pramaan/resource-centre/F1', collectionUrl: 'https://x.org/pramaan/resource-centre', collectionName: 'Resource Centre' }

describe('libraryResourceJsonLd (audit P3)', () => {
  it('maps the Sheet language words to codes and drops values it cannot name', () => {
    expect(resourceLanguages('Gujarati, English, Hindi')).toEqual(['gu', 'en', 'hi'])
    expect(resourceLanguages('NA')).toEqual([])
    expect(resourceLanguages('null')).toEqual([])
    expect(resourceLanguages(null)).toEqual([])
  })

  it('builds a LearningResource from snapshot fields only', () => {
    const r = { id: 'F1', name: 'N', description: 'D', type: 'Flashcard', subject: 'Mathematics', language: 'Gujarati', ownership: 'Anusandhan', grades: ['GRADE 1'] }
    const ld = libraryResourceJsonLd(r, opts)
    expect(ld['@type']).toBe('LearningResource')
    expect(ld).toMatchObject({ name: 'N', url: opts.url, description: 'D', learningResourceType: 'Flashcard', about: 'Mathematics', inLanguage: 'gu' })
    expect(ld.creator).toEqual({ '@type': 'Organization', name: 'Anusandhan' })
    expect(ld.educationalLevel).toHaveLength(1)
    expect(ld.isPartOf).toEqual({ '@type': 'CollectionPage', name: 'Resource Centre', url: opts.collectionUrl })
  })

  it('leaves out empty fields instead of inventing them, for every snapshot row', () => {
    for (const r of snapshot.resources) {
      const ld = libraryResourceJsonLd(r, opts)
      expect(ld.name, r.id).toBeTruthy()
      for (const v of Object.values(ld)) expect(v, r.id).not.toBeNull()
      expect(JSON.stringify(ld)).not.toContain('undefined')
    }
  })
})
