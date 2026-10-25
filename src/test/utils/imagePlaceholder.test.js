import { describe, it, expect, afterEach } from 'vitest'
import site from '../../data/site.json'
import { imgSrc } from '../../utils/imgSrc'
import { installImagePlaceholder } from '../../utils/imagePlaceholder'

const fallback = new URL(imgSrc(site.placeholderImage), document.baseURI).href

let uninstall
let img

function addImg(attrs = {}) {
  img = document.createElement('img')
  img.setAttribute('src', '/missing.png')
  for (const [k, v] of Object.entries(attrs)) img.setAttribute(k, v)
  document.body.appendChild(img)
  return img
}

const fail = (el) => el.dispatchEvent(new Event('error'))

afterEach(() => {
  uninstall?.()
  img?.remove()
})

describe('installImagePlaceholder', () => {
  it('swaps a failed image for the placeholder and drops srcset', () => {
    uninstall = installImagePlaceholder()
    addImg({ srcset: '/a.png 1x, /b.png 2x' })
    fail(img)
    expect(img.src).toBe(fallback)
    expect(img.hasAttribute('srcset')).toBe(false)
  })

  it('does not loop when the placeholder itself fails', () => {
    uninstall = installImagePlaceholder()
    addImg()
    fail(img)
    fail(img)
    expect(img.src).toBe(fallback)
  })

  it('leaves images that opt out untouched', () => {
    uninstall = installImagePlaceholder()
    addImg({ 'data-no-placeholder': '' })
    fail(img)
    expect(img.getAttribute('src')).toBe('/missing.png')
  })

  it('stops listening after uninstall', () => {
    installImagePlaceholder()()
    addImg()
    fail(img)
    expect(img.getAttribute('src')).toBe('/missing.png')
  })
})
