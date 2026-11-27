import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { getPartnerLogo } from '../../utils/partnerPhotos'
import { partnerInitials, websiteLabel } from '../../utils/partnerFilters'
import { safeHttpUrl } from '../../utils/safeUrl'
import { tiltHandler, settleTilt } from '../../utils/tilt'

// One partner: the whole logo on a white tile (fixed 3:2), then the name and — when the Sheet has a
// website — its address, e.g. "cam.ac.uk ↗".
//
// Depth: a thin physical tile (lit face, layered shadows, ground shadow); with a mouse it tilts
// towards the pointer, a glare follows it and the logo floats above the face (styles: .partner-3d*
// and .tilt-3d* in src/index.css; tilt: src/utils/tilt.js). Touch and "reduce motion": no tilt.
// Weight without labels (`tier`, from the priority — partnerTier):
//   'feature' → a hairline blue gradient halo, a soft blue glow, a slightly larger logo, and a light that
//               sweeps across the tile once when it first comes into view;
//   'high'    → a faint blue ring;
//   ''        → a plain border.
// Text: the name always has room for two lines (clamped, full name in the tooltip), so captions in a
// row line up whatever the name's length; the address line is always reserved for the same reason.
// With a website the WHOLE card is the link (the link is stretched over the card with ::after; the
// parent <li> is `relative`) and only then does it react to hover — hover means "you can open this".
// Without a usable logo (none, failed to load, or a `placeholder` shared by many rows) the tile shows
// the name's initials. Logo / initials are hidden from screen readers: the name says it all.
// `text` = the page YAML's `directory` block. `caption` (optional) = an extra small line (the section
// name, in search results). `order` = position in its row (staggers the sweep).

// The 1px frame per tier (its shadows live in src/index.css .partner-3d, so hover can deepen them).
const FRAME = {
  feature: 'bg-gradient-to-br from-primary/70 via-primary-light to-primary-mid/50',
  high: 'bg-gradient-to-b from-primary/25 to-primary/15',
  '': 'bg-gradient-to-b from-tide-border/70 to-tide-border',
}
// Tilt towards the pointer (src/utils/tilt.js): at most 9° sideways, 7° up/down.
const tiltTowards = tiltHandler(9, 7)

export default function PartnerCard({ partner, text, caption, tier = '', order = 0, showLogo = true }) {
  const [failed, setFailed] = useState(false)
  const logo = failed ? null : getPartnerLogo(partner.id)
  const website = safeHttpUrl(partner.website) // the Sheet's link, re-checked at render (http/https only)
  const linked = !!website
  const domain = linked ? websiteLabel(website) : ''
  const inset = tier === 'feature' ? 'inset-[10%] h-[80%] w-[80%]' : 'inset-[13%] h-[74%] w-[74%]'

  return (
    <figure className="group flex h-full flex-col" onPointerMove={tiltTowards} onPointerLeave={settleTilt}>
      <div className="relative">
        {/* Ground shadow: an ellipse under the card that widens and fades as the card rises. */}
        <span aria-hidden="true" className={`partner-3d-ground pointer-events-none absolute inset-x-3 -bottom-2 h-5 rounded-[50%] bg-tide-text/25 blur-md ${linked ? 'is-linked' : ''}`} />
        <div
          data-tier={tier || undefined}
          data-linked={linked || undefined}
          className={`tilt-3d partner-3d relative rounded-2xl p-px ${FRAME[tier] ?? FRAME['']}`}
        >
          <div className="partner-3d-face relative aspect-[3/2] w-full rounded-[15px]">
            {logo ? (showLogo && (
              <img
                src={logo.src}
                width={logo.width}
                height={logo.height}
                alt=""
                loading="lazy"
                decoding="async"
                // A logo that fails to load falls back to the initials (not the site-wide placeholder picture).
                data-no-placeholder
                onError={() => setFailed(true)}
                className={`partner-3d-float absolute ${inset} object-contain`}
              />
            )) : (
              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center rounded-[15px] bg-[radial-gradient(120%_90%_at_30%_20%,theme(colors.primary.faint),theme(colors.primary.light))]">
                <span className="partner-3d-float font-display text-[2rem] font-semibold tracking-wide text-primary-dark/80">{partnerInitials(partner.name)}</span>
              </span>
            )}
            {/* Light layers, clipped to the face: the pointer glare, and (top tier) the one-time sweep. */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[15px]">
              <span className="tilt-3d-glare absolute inset-0" />
              {tier === 'feature' && (
                <motion.span
                  className="absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                  initial={{ x: '-150%' }}
                  whileInView={{ x: '300%' }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.9, delay: 0.3 + Math.min(order, 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
            </span>
          </div>
        </div>
      </div>

      <figcaption className="mt-3 px-0.5 font-body">
        {linked ? (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            title={partner.name}
            className="block after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus:outline-none focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:ring-offset-4 focus-visible:after:ring-offset-tide-bg"
          >
            <span className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-tide-text transition-colors group-hover:text-primary-dark">{partner.name}</span>
            <span className="mt-0.5 flex h-4 items-center gap-0.5 text-xs text-tide-muted transition-colors group-hover:text-primary-dark">
              <span className="truncate">{domain}</span>
              <ArrowUpRight className="h-3.5 w-3.5 flex-none transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px" aria-hidden="true" />
            </span>
            <span className="sr-only">{` ${text.opensInNewTab}`}</span>
          </a>
        ) : (
          <>
            <span title={partner.name} className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-tide-text">{partner.name}</span>
            <span aria-hidden="true" className="mt-0.5 block h-4" />
          </>
        )}
        {caption && <span className="mt-1.5 inline-block rounded-full bg-primary-faint px-2 py-0.5 text-[11px] font-semibold text-primary-dark">{caption}</span>}
      </figcaption>
    </figure>
  )
}
