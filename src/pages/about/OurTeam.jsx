import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import SeoHead from '../../components/ui/SeoHead'
import PageHero from '../../components/ui/PageHero'
import SectionHeader from '../../components/ui/SectionHeader'
import data from '../../data/about-our-team.json'
import site from '../../data/site.json'
import common from '../../data/common.json'
import Button from '../../components/ui/Button'
import { imgSrc } from '../../utils/imgSrc'

const getInitials = name => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

const EASE = [0.4, 0, 0.2, 1]

/* Frame colours cycle so neighbouring founders never match. */
const FRAME_TONES = [
  'bg-accent-light rotate-3',
  'bg-primary-light -rotate-3',
  'bg-accent-light -rotate-2',
  'bg-primary-light rotate-2',
]

/* Wrapper: a LinkedIn link when the person has one, otherwise a plain block. */
function Tile({ name, linkedin, delay = 0, className = '', children }) {
  const motionProps = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' },
    transition: { duration: 0.55, delay, ease: EASE },
  }
  if (!linkedin) {
    return <motion.div {...motionProps} className={className}>{children}</motion.div>
  }
  return (
    <motion.a
      {...motionProps}
      href={linkedin}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={common.viewLinkedIn.replace('{name}', name)}
      className={className}
    >
      {children}
    </motion.a>
  )
}

/* Small "opens LinkedIn" badge. Always visible on touch; on hover-capable
   devices it fades in when the tile is hovered or focused. */
function LinkBadge({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute z-10 flex items-center justify-center rounded-full bg-primary text-white shadow-float transition duration-300 [@media(hover:hover)]:scale-75 [@media(hover:hover)]:opacity-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 ${className}`}
    >
      <ArrowUpRight size={18} strokeWidth={2.25} />
    </span>
  )
}

function Photo({ photo, name, className, initialsClass = 'text-4xl' }) {
  return (
    <div className={`relative overflow-hidden bg-primary-light ${className}`}>
      {photo ? (
        <img
          src={imgSrc(photo)}
          alt={name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-top transition-transform duration-700 motion-safe:group-hover:scale-[1.05]"
        />
      ) : (
        <div className="gradient-primary flex h-full w-full items-center justify-center">
          <span className={`font-display font-bold text-white/60 select-none ${initialsClass}`}>{getInitials(name)}</span>
        </div>
      )}
    </div>
  )
}

/* One card style for everyone: big arched portrait on a tilted colour frame.
   Bio is optional (advisors have none). */
function PersonCard({ name, role, bio, photo, suffix, linkedin, index }) {
  return (
    <Tile
      name={name}
      linkedin={linkedin}
      delay={(index % 3) * 0.08}
      className="group relative block rounded-3xl even:mt-8 md:even:mt-0 md:[&:nth-child(3n+2)]:mt-12"
    >
      <div className="relative">
        <div
          aria-hidden="true"
          className={`absolute inset-0 translate-x-2 translate-y-2 rounded-b-[4rem] rounded-t-[999px] transition-transform duration-500 motion-safe:group-hover:rotate-0 ${FRAME_TONES[index % FRAME_TONES.length]}`}
        />
        <Photo
          photo={photo}
          name={name}
          initialsClass="text-6xl"
          className="relative aspect-square rounded-b-[4rem] rounded-t-[999px] shadow-card transition-shadow duration-500 group-hover:shadow-card-hover"
        />
        {linkedin && <LinkBadge className="bottom-3 right-3 h-9 w-9" />}
      </div>
      <div className="px-1 pt-5">
        <h3 className="font-display text-xl font-semibold leading-snug text-tide-text">{name}</h3>
        {suffix && <p className="mt-0.5 font-body text-xs font-medium text-tide-muted">{suffix}</p>}
        <p className="mt-1 font-body text-sm font-bold text-primary-dark">{role}</p>
        {bio && <p className="mt-2 font-body text-sm leading-relaxed text-tide-muted">{bio}</p>}
      </div>
    </Tile>
  )
}

/* Advisors: centred round portraits on a dark panel, deliberately a different
   register from the arched team cards (a "wall of honour" feel). */
function AdvisorCard({ name, role, photo, linkedin, index }) {
  return (
    <Tile
      name={name}
      linkedin={linkedin}
      delay={(index % 3) * 0.08}
      className="group relative block text-center"
    >
      <div className="relative mx-auto h-36 w-36 sm:h-44 sm:w-44 md:h-52 md:w-52">
        <div
          aria-hidden="true"
          className="absolute -inset-2 rounded-full border-2 border-dashed border-accent/60 transition-transform duration-700 motion-safe:group-hover:rotate-45"
        />
        <Photo
          photo={photo}
          name={name}
          initialsClass="text-4xl"
          className="relative h-full w-full rounded-full ring-4 ring-white/90 shadow-float"
        />
        {linkedin && <LinkBadge className="bottom-1 right-1 h-9 w-9" />}
      </div>
      <h3 className="mt-6 font-display text-lg font-semibold leading-snug text-white md:text-xl">{name}</h3>
      <p className="mx-auto mt-1.5 max-w-[16rem] font-body text-sm leading-snug text-white/75">{role}</p>
    </Tile>
  )
}

export default function OurTeam() {
  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/about/our-team"
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: site.breadcrumbs.aboutUs },
          { name: data.meta.breadcrumbName, path: '/about/our-team' },
        ]}
      />
      <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.subtitle} />

      <section className="relative overflow-hidden bg-tide-bg px-4 py-16 md:px-8 md:py-20 lg:px-16">
        {/* Soft organic backdrop shapes */}
        <svg aria-hidden="true" viewBox="0 0 200 200" className="pointer-events-none absolute -right-24 -top-16 h-80 w-80 text-primary-faint md:h-[28rem] md:w-[28rem]">
          <path fill="currentColor" d="M44.6,-57.5C58.2,-47.9,69.7,-34.4,74.5,-18.7C79.2,-3,77.2,14.9,69,29.2C60.8,43.5,46.4,54.2,30.7,61.2C15,68.2,-2.1,71.5,-18.6,67.9C-35.1,64.3,-51,53.9,-61.2,39.5C-71.4,25.1,-75.9,6.7,-72.1,-9.5C-68.3,-25.7,-56.2,-39.7,-42.5,-49.3C-28.8,-58.9,-14.4,-64.1,0.6,-64.9C15.6,-65.7,31.1,-67.1,44.6,-57.5Z" transform="translate(100 100)" />
        </svg>
        <svg aria-hidden="true" viewBox="0 0 200 200" className="pointer-events-none absolute -bottom-20 -left-24 h-72 w-72 text-accent-faint">
          <path fill="currentColor" d="M39.9,-51.5C51.4,-41.3,60.2,-28.5,64.1,-13.8C68,0.9,67,17.4,59.3,29.7C51.6,42,37.2,50.1,22,56.1C6.8,62.1,-9.2,66,-24.1,62C-39,58,-52.8,46.1,-60.4,31.1C-68,16.1,-69.4,-2.1,-63.5,-17.1C-57.6,-32.1,-44.4,-43.9,-30.7,-53.8C-17,-63.7,-2.7,-71.7,10.2,-69.9C23.1,-68.1,28.4,-61.7,39.9,-51.5Z" transform="translate(100 100)" />
        </svg>

        <div className="relative mx-auto max-w-4xl">
          <SectionHeader
            badge={data.coreTeam.sectionBadge}
            title={data.coreTeam.sectionTitle}
            subtitle={data.coreTeam.sectionSubtitle}
            className="!mb-10 md:!mb-12"
          />

          <div className="grid grid-cols-2 gap-x-4 gap-y-8 pb-6 md:grid-cols-3 md:gap-x-8">
            {data.coreTeam.members.map((m, i) => <PersonCard key={m.name} {...m} index={i} />)}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-navy px-4 py-16 md:px-8 md:py-20 lg:px-16">
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <SectionHeader
            light
            center
            badge={data.advisoryBoard.sectionBadge}
            title={data.advisoryBoard.sectionTitle}
            subtitle={data.advisoryBoard.sectionSubtitle}
            className="!mb-12 md:!mb-14"
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-8">
            {data.advisoryBoard.members.map((m, i) => <AdvisorCard key={m.name} {...m} index={i} />)}
          </div>
          <div className="mt-12 text-center">
            <Button href={data.advisoryBoard.moreDetails.href} external variant="white">
              {data.advisoryBoard.moreDetails.label}
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
