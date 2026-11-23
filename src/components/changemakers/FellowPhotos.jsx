import { personInitials, posterIndex } from '../../utils/changemakers'

// The 4:5 photo frame of one Past SCF fellow on a listing card — a still picture, no switching
// (switching between the fellow and the field work happens in the profile, FellowProfile):
//   - the fellow's photo (H), aligned to its upper part where faces usually are;
//   - else the field-work photo (I);
//   - else the fellow's initials on one of four fixed brand gradients (chosen from the id, so a
//     fellow keeps theirs) — the Sheet's state on 2026-11-23.
// `photos` = getFellowPhotos(id); `text` = the page YAML's `profiles` block.

// Fixed class strings (Tailwind can't see class names built at runtime).
const POSTERS = [
  'from-navy to-primary',
  'from-primary to-primary-mid',
  'from-navy to-teal-600',
  'from-primary-dark to-navy',
]
const fill = (t, vars) => Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, () => v ?? ''), t)

export default function FellowPhotos({ fellow, photos, text, frameClass = 'rounded-2xl' }) {
  const photo = photos.fellow ?? photos.field
  return (
    <div className={`relative aspect-[4/5] w-full overflow-hidden bg-primary-light ${frameClass}`}>
      {photo ? (
        <img
          src={photo.src}
          width={photo.width}
          height={photo.height}
          alt={photos.fellow ? fill(text.photoAlt, { name: fellow.name }) : fill(text.fieldAlt, { project: fellow.project ?? fellow.name })}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] ${photos.fellow ? 'object-[center_25%]' : 'object-center'}`}
        />
      ) : (
        <div aria-hidden="true" className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${POSTERS[posterIndex(fellow.id)]}`}>
          <span className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
          <span className="absolute -bottom-10 -left-8 h-36 w-36 rounded-full bg-white/5" />
          <span className="relative font-display text-5xl font-semibold tracking-wide text-white sm:text-6xl">{personInitials(fellow.name)}</span>
        </div>
      )}
    </div>
  )
}
