import { describe, it, expect } from 'vitest'
import {
  extractDriveFileId,
  getDrivePreviewUrl,
  getDriveDownloadUrl,
} from '../../utils/driveUtils'

// A realistic Google Drive share URL
const SHARE_URL  = 'https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ12345/view?usp=sharing'
const FILE_ID    = '1aBcDeFgHiJkLmNoPqRsTuVwXyZ12345'

describe('extractDriveFileId', () => {
  it('extracts the file ID from a standard Drive share link', () => {
    expect(extractDriveFileId(SHARE_URL)).toBe(FILE_ID)
  })

  it('extracts the file ID from a /d/-style URL without trailing path', () => {
    expect(extractDriveFileId(`https://drive.google.com/file/d/${FILE_ID}`)).toBe(FILE_ID)
  })

  it('extracts ID when URL contains hyphens and underscores in the ID', () => {
    const url = 'https://drive.google.com/file/d/abc-123_XYZ/view'
    expect(extractDriveFileId(url)).toBe('abc-123_XYZ')
  })

  it('returns null for a non-Drive URL', () => {
    expect(extractDriveFileId('https://example.com/image.png')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(extractDriveFileId('')).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(extractDriveFileId(undefined)).toBeNull()
  })

  it('returns null for null', () => {
    expect(extractDriveFileId(null)).toBeNull()
  })

  it('returns null for a URL with no /d/ segment', () => {
    expect(extractDriveFileId('https://drive.google.com/open?id=someId')).toBeNull()
  })
})

describe('getDrivePreviewUrl', () => {
  it('returns a drive.google.com /preview URL', () => {
    const url = getDrivePreviewUrl(SHARE_URL)
    expect(url).toBe(`https://drive.google.com/file/d/${FILE_ID}/preview`)
  })

  it('returns null for a non-Drive URL', () => {
    expect(getDrivePreviewUrl('https://example.com/file.pdf')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(getDrivePreviewUrl('')).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(getDrivePreviewUrl(undefined)).toBeNull()
  })

  it('returns null for null', () => {
    expect(getDrivePreviewUrl(null)).toBeNull()
  })
})

describe('getDriveDownloadUrl', () => {
  it('returns a uc?export=download URL with correct ID', () => {
    const url = getDriveDownloadUrl(SHARE_URL)
    expect(url).toBe(`https://drive.google.com/uc?export=download&id=${FILE_ID}`)
  })

  it('returns null for a non-Drive URL', () => {
    expect(getDriveDownloadUrl('https://example.com/doc.pdf')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(getDriveDownloadUrl('')).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(getDriveDownloadUrl(undefined)).toBeNull()
  })

  it('returns null for null', () => {
    expect(getDriveDownloadUrl(null)).toBeNull()
  })
})
