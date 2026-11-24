import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import withValue from '../ui/withValue'
import { getPartnerLogo } from '../../utils/partnerPhotos'
import { comparePartners } from '../../utils/partnerFilters'
import { tiltHandler, settleTilt } from '../../utils/tilt'
import { fadeUp } from '../../utils/motionPresets'
import { CONSTELLATION_MIN } from '../../config/partners'
import snapshot from '../../data/sheets/partners.json'

// "In good company": the homepage's proof by association, placed just before the invitation to
// get involved — the moment a visitor decides whether to trust TIDE. It shows the logos of the
// highest-priority partners (same order as the Partners page: priority, then A→Z; real logos only)
// as small 3D tiles that tilt with the mouse, the number of partners (shown as it is), and one link to
// the full list. Built from the Partners Sheet snapshot; hidden while it has fewer than
// CONSTELLATION_MIN logos (e.g. before the first sync). Logos are decorative (alt=""): the link
// leads to the named list.
// `text` = home YAML `partners`.

const MAX_LOGOS = 10
const tilt = tiltHandler(10, 8)

export default function HomePartners({ text }) {
  const rows = snapshot.resources ?? []
  const logos = [...rows].filter(r => r?.name && getPartnerLogo(r.id)).sort(comparePartners).slice(0, MAX_LOGOS)
  if (logos.length < CONSTELLATION_MIN) return null
  const total = rows.filter(r => r?.name && r?.type).length

  return (
    <section className="section-padding relative overflow-hidden bg-white">
      <div className="container-wide mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <motion.div {...fadeUp()}>
          <span className="badge-primary mb-4 block w-fit">{text.sectionBadge}</span>
          <h2 className="display-md text-tide-text text-balance">{text.title}</h2>
          <p className="mt-4 font-body text-lg text-tide-muted">
            {withValue(total === 1 ? text.countOne : text.count, 'n', total, 'font-display text-2xl text-primary-dark')}
          </p>
          <Link
            to={text.linkHref}
            className="group/link mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary-faint px-5 font-body text-sm font-semibold text-primary-dark ring-1 ring-primary/15 transition-colors hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {text.linkLabel}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" aria-hidden="true" />
          </Link>
        </motion.div>

        {/* The logos arrive as one group (one fade), not one by one. */}
        <motion.ul {...fadeUp(0.1)} aria-hidden="true" className="grid grid-cols-3 gap-3 sm:grid-cols-5 sm:gap-4">
          {logos.map((p, i) => {
            const logo = getPartnerLogo(p.id)
            return (
              <li
                key={p.id}
                onPointerMove={tilt}
                onPointerLeave={settleTilt}
                className={`group ${i >= 6 ? 'max-sm:hidden' : ''}`}
              >
                <div className="tilt-3d partner-3d relative aspect-square rounded-2xl bg-gradient-to-b from-tide-border/70 to-tide-border p-px">
                  <div className="partner-3d-face relative h-full w-full rounded-[15px]">
                    <img src={logo.src} width={logo.width} height={logo.height} alt="" loading="lazy" decoding="async" data-no-placeholder className="partner-3d-float absolute inset-[16%] h-[68%] w-[68%] object-contain" />
                    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[15px]"><span className="tilt-3d-glare absolute inset-0" /></span>
                  </div>
                </div>
              </li>
            )
          })}
        </motion.ul>
      </div>
    </section>
  )
}
