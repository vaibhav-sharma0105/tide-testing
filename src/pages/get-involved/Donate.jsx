import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import SeoHead from '../../components/ui/SeoHead'
import { CheckCircle2, Mail, MessageCircle } from 'lucide-react'
import PageHero from '../../components/ui/PageHero'
import data from '../../data/get-involved-donate.json'

const B = import.meta.env.BASE_URL

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] },
})

function BankRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-tide-border last:border-0">
      <span className="font-body text-xs text-tide-muted uppercase tracking-wider shrink-0">{label}</span>
      <span className="font-mono text-sm text-tide-text font-semibold text-right break-all">{value}</span>
    </div>
  )
}

export default function Donate() {
  const { t } = useTranslation()

  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/get-involved/donate"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Get Involved' },
          { name: 'Donate', path: '/get-involved/donate' },
        ]}
      />
      <PageHero
        badge={data.meta.badge}
        title={t('donate.title', data.meta.title)}
        subtitle={t('donate.tagline', data.meta.tagline)}
        gradient
      />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">

            {/* Left — hero content */}
            <motion.div {...fadeUp()}>
              <h2 className="font-display text-2xl font-semibold text-tide-text mb-4">
                {t('donate.hero.heading', data.hero.heading)}
              </h2>
              <p className="font-body text-tide-muted leading-relaxed mb-6">
                {t('donate.hero.body', data.hero.body)}
              </p>

              <ul className="space-y-3 mb-8">
                {data.hero.highlights.map((pt, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent-deeper shrink-0 mt-0.5" />
                    <span className="font-body text-sm text-tide-text">{pt}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`mailto:${data.hero.email}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-body font-semibold text-sm hover:bg-primary/90 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {t('donate.hero.emailCta', data.hero.emailCta)}
                </a>
                <a
                  href={data.hero.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-primary text-primary font-body font-semibold text-sm hover:bg-primary-light transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('donate.hero.whatsappCta', data.hero.whatsappCta)}
                </a>
              </div>
            </motion.div>

            {/* Right — image + bank details */}
            <motion.div {...fadeUp(0.15)} className="flex flex-col gap-6">
              <div className="rounded-2xl overflow-hidden border border-tide-border shadow-card">
                <img
                  src={`${B}${data.image.src}`}
                  alt={data.image.alt}
                  className="w-full h-56 object-cover"
                />
              </div>

              <div className="bg-white rounded-2xl border border-tide-border p-6">
                <h3 className="font-display text-lg font-semibold text-tide-text mb-4">
                  {t('donate.bank.transferTitle', data.bank.transferTitle)}
                </h3>
                <div className="space-y-0">
                  <BankRow label={t('donate.bank.accountNameLabel', 'Account name')} value={data.bank.accountName} />
                  <BankRow label={t('donate.bank.accountNumberLabel', 'Account number')} value={data.bank.accountNumber} />
                  <BankRow label={t('donate.bank.bankNameLabel', 'Bank')} value={data.bank.bankName} />
                  <BankRow label={t('donate.bank.ifscLabel', 'IFSC')} value={data.bank.ifsc} />
                  <BankRow label={t('donate.bank.branchLabel', 'Branch')} value={data.bank.branch} />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </>
  )
}
