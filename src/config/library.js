import { TAB_STYLE_MAP, getTypeColors } from './abl'

export const LIBRARY_PAGE_SIZE = 9

// The library's "type of material" is typed by contributors ("Worksheet", "worksheets", "Game"…).
// Map it to the Pramaan type of the same name, ignoring case and a trailing "s", so a Worksheet is
// the same colour and icon on both pages; anything else is neutral grey with a generic icon.
const KNOWN = Object.keys(TAB_STYLE_MAP).filter(k => k !== '_default')
const singular = (s) => s.trim().toLowerCase().replace(/s$/, '')

export function libraryTypeKey(type) {
  if (typeof type !== 'string' || !type.trim()) return null
  return KNOWN.find(k => singular(k) === singular(type)) ?? null
}

export const libraryTypeColors = (type) => getTypeColors(libraryTypeKey(type) ?? '_default')
