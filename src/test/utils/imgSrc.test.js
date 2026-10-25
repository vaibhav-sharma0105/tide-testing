import { describe, it, expect, vi, afterEach } from 'vitest'

// imgSrc captures import.meta.env.BASE_URL once at module load, so each base
// path needs a fresh module instance.
async function loadImgSrc(base) {
  vi.resetModules()
  vi.stubEnv('BASE_URL', base)
  const mod = await import('../../utils/imgSrc')
  return mod.imgSrc
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('imgSrc with BASE_URL "/"', () => {
  it('returns "" for null, undefined and empty string', async () => {
    const imgSrc = await loadImgSrc('/')
    expect(imgSrc(null)).toBe('')
    expect(imgSrc(undefined)).toBe('')
    expect(imgSrc('')).toBe('')
  })

  it('strips exactly one leading slash', async () => {
    const imgSrc = await loadImgSrc('/')
    expect(imgSrc('/assets/images/a.jpg')).toBe('/assets/images/a.jpg')
    // Only the first slash goes: a protocol-relative-looking path keeps the rest.
    expect(imgSrc('//assets/a.jpg')).toBe('/' + '/assets/a.jpg')
  })

  it('prepends the base to a path with no leading slash', async () => {
    const imgSrc = await loadImgSrc('/')
    expect(imgSrc('assets/images/a.jpg')).toBe('/assets/images/a.jpg')
  })

  it('passes http:, https: and data: URLs through unchanged', async () => {
    const imgSrc = await loadImgSrc('/')
    expect(imgSrc('http://example.com/a.png')).toBe('http://example.com/a.png')
    expect(imgSrc('https://example.com/a.png')).toBe('https://example.com/a.png')
    expect(imgSrc('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA')
  })

  it('does not treat other schemes or protocol-relative URLs as absolute', async () => {
    const imgSrc = await loadImgSrc('/')
    // Documented actual behavior: only http://, https:// and data: are passthrough.
    expect(imgSrc('HTTPS://example.com/a.png')).toBe('/HTTPS://example.com/a.png')
    expect(imgSrc('blob:abc')).toBe('/blob:abc')
  })
})

describe('imgSrc with a sub-path BASE_URL', () => {
  const BASE = '/tide-testing/'

  it('prefixes both slash and no-slash paths with the base', async () => {
    const imgSrc = await loadImgSrc(BASE)
    expect(imgSrc('/assets/images/a.jpg')).toBe('/tide-testing/assets/images/a.jpg')
    expect(imgSrc('assets/images/a.jpg')).toBe('/tide-testing/assets/images/a.jpg')
  })

  it('leaves absolute and data: URLs alone', async () => {
    const imgSrc = await loadImgSrc(BASE)
    expect(imgSrc('https://example.com/a.png')).toBe('https://example.com/a.png')
    expect(imgSrc('data:image/svg+xml,<svg/>')).toBe('data:image/svg+xml,<svg/>')
  })

  it('is NOT idempotent: applying it twice doubles the base', async () => {
    const imgSrc = await loadImgSrc(BASE)
    const once = imgSrc('assets/images/a.jpg')
    expect(imgSrc(once)).toBe('/tide-testing/tide-testing/assets/images/a.jpg')
  })
})
