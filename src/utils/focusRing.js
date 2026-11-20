// Keyboard focus keeps each control's own shape (the global :focus-visible rule in src/index.css
// sets a 4px radius; see FOCUS_PILL in components/library/LibraryDropdown.jsx).
export const focusRing = (radius) => `focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${radius}`

