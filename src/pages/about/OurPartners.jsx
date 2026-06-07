import { motion } from 'framer-motion'
import PageHero from '../../components/ui/PageHero'
import SectionHeader from '../../components/ui/SectionHeader'
import data from '../../data/about-our-partners.json'
import { useTranslation } from 'react-i18next'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45, delay, ease: [0.4, 0, 0.2, 1] },
})

const BASE = `${import.meta.env.BASE_URL}assets/images/about-our-partners/`

const CATEGORY_KEYS = {
  'Beneficiaries (Schools & Institutions)': 'beneficiaries',
  'Volunteer Partners': 'volunteerPartners',
  'Collaborating NGOs & Organisations': 'collaboratingNGOs',
  'Knowledge, Research & Funding Partners': 'researchFunding',
  'Other Supporters': 'otherSupporters',
}

export default function OurPartners() {
  const { t } = useTranslation()
  return (
    <>
      <PageHero badge={data.meta.badge} title={t('about.partners.title', data.meta.title)} subtitle={t('about.partners.subtitle', data.meta.subtitle)} />

      {/* Partner logo showcase */}
      <section className="section-padding bg-white border-b border-tide-border">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            badge={data.logoGallery.sectionBadge}
            title={data.logoGallery.sectionTitle}
            subtitle={data.logoGallery.sectionSubtitle}
          />
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-3">
            {data.logoGallery.images.map((filename, i) => (
              <motion.div
                key={filename}
                {...fadeUp(i * 0.02)}
                className="bg-tide-subtle rounded-xl p-2 flex items-center justify-center aspect-square hover:bg-primary-light hover:shadow-sm transition-all duration-200"
              >
                <img
                  src={`${BASE}${filename}`}
                  alt={`Partner ${i + 1}`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner categories */}
      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto space-y-16">
          {data.categories.map((section, si) => (
            <div key={section.title}>
              <motion.h3
                {...fadeUp(si * 0.06)}
                className="font-display text-xl font-semibold text-tide-text mb-6 pb-3 border-b border-tide-border"
              >
                {CATEGORY_KEYS[section.title] ? t(`about.partners.${CATEGORY_KEYS[section.title]}`, section.title) : section.title}
              </motion.h3>
              <div className="flex flex-wrap gap-2.5">
                {section.partners.map((p, pi) => (
                  <motion.span
                    key={p}
                    {...fadeUp(pi * 0.025)}
                    className="inline-block px-4 py-2 text-sm font-body text-tide-text bg-white rounded-full border border-tide-border hover:border-primary hover:text-primary hover:bg-primary-light transition-colors duration-200 cursor-default"
                  >
                    {p}
                  </motion.span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
