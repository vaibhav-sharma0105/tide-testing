import { motion } from 'framer-motion'
import PageHero from '../../components/ui/PageHero'
import SectionHeader from '../../components/ui/SectionHeader'
import data from '../../data/about-our-team.json'
import { useTranslation } from 'react-i18next'
import { imgSrc } from '../../utils/imgSrc'

const getInitials = name => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

/* ── Portrait card ────────────────────────────��────────────────────── */
function PortraitCard({ name, role, bio, photo, suffix, delay = 0, size = 'md' }) {
  const initials  = getInitials(name)
  const ratioClass = size === 'lg' ? 'aspect-[4/5]' : 'aspect-[3/4]'

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay, ease: [0.4, 0, 0.2, 1] }}
      className="group relative rounded-2xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-shadow duration-400"
    >
      <div className={`relative ${ratioClass} overflow-hidden`}>
        {photo ? (
          <img src={imgSrc(photo)} alt={name} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.06]" />
        ) : (
          <div className="w-full h-full gradient-primary flex items-center justify-center">
            <span className="font-display text-white font-bold text-5xl opacity-40 select-none">{initials}</span>
          </div>
        )}
        <div
          className="absolute inset-0 flex items-end translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ background: 'linear-gradient(0deg, rgba(10,22,44,0.97) 0%, rgba(10,22,44,0.82) 55%, rgba(10,22,44,0.12) 100%)' }}
        >
          <div className="p-4 pb-5">
            <p className="font-body text-white/85 text-sm leading-relaxed">{bio}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-5">
        <h3 className="font-display font-semibold text-tide-text text-base leading-snug">{name}</h3>
        {suffix && (
          <p className="text-[10px] font-body font-bold text-primary uppercase tracking-[0.12em] mt-1">{suffix}</p>
        )}
        <p className="font-body text-xs text-tide-muted leading-snug mt-1">{role}</p>
      </div>
    </motion.div>
  )
}

/* ── Advisor card ────────────────────────────────────────────────── */
function AdvisorCard({ name, role, photo, delay = 0 }) {
  const initials = getInitials(name)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay, ease: [0.4, 0, 0.2, 1] }}
      className="group flex items-stretch bg-white rounded-2xl overflow-hidden border border-tide-border hover:border-primary/30 hover:shadow-card-hover transition-all duration-300"
    >
      <div className="w-24 flex-shrink-0 overflow-hidden relative">
        {photo ? (
          <img src={photo} alt={name} className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.06]" />
        ) : (
          <div className="w-full h-full gradient-primary flex items-center justify-center">
            <span className="font-display text-white font-bold text-xl opacity-50">{initials}</span>
          </div>
        )}
        <div className="absolute left-0 inset-y-0 w-[3px] bg-gradient-to-b from-primary/40 via-primary to-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="px-5 py-4 flex flex-col justify-center">
        <h3 className="font-display font-semibold text-tide-text text-base leading-tight">{name}</h3>
        <p className="font-body text-xs text-tide-muted mt-1.5 leading-relaxed">{role}</p>
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════���═══════════════════════ */
export default function OurTeam() {
  const { t } = useTranslation()
  return (
    <>
      <PageHero badge={data.meta.badge} title={t('about.team.title', data.meta.title)} subtitle={t('about.team.subtitle', data.meta.subtitle)} />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <SectionHeader
            badge={data.coreTeam.sectionBadge}
            title={t('about.team.coreTeam', data.coreTeam.sectionTitle)}
            subtitle={data.coreTeam.sectionSubtitle}
          />
          <p className="text-xs font-body text-tide-muted mb-8 -mt-6 italic">{t('common.hoverForBio', 'Hover over a photo to read about each person.')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-5 md:gap-6">
            {data.coreTeam.members.map((m, i) => (
              <PortraitCard key={m.name} {...m} delay={i * 0.06} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-tide-subtle">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <SectionHeader
            badge={data.advisoryBoard.sectionBadge}
            title={t('about.team.advisors', data.advisoryBoard.sectionTitle)}
            subtitle={data.advisoryBoard.sectionSubtitle}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            {data.advisoryBoard.members.map((a, i) => (
              <AdvisorCard key={a.name} {...a} delay={i * 0.07} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
