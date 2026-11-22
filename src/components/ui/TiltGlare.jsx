// The soft light that follows the mouse across a tilting tile or button (.tilt-3d-glare in
// src/index.css; the tilt itself: src/utils/tilt.js). Put it inside the element with .tilt-3d;
// that element needs `relative`. Decorative only.
export default function TiltGlare() {
  return <span aria-hidden="true" className="tilt-3d-glare pointer-events-none absolute inset-0 z-[1] rounded-[inherit]" />
}
