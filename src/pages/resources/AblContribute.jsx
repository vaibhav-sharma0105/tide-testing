import { motion } from 'framer-motion'
import { ArrowUpRight, BookOpen, CheckCircle2, ClipboardList } from 'lucide-react'
import SeoHead from '../../components/ui/SeoHead'
import PageHero from '../../components/ui/PageHero'
import AblNavBar from '../../components/abl/AblNavBar'
import Button from '../../components/ui/Button'
import { CONTRIBUTE_FORM_URL } from '../../config/abl'
import ablContributeData from '../../data/abl-contribute.json'
import site from '../../data/site.json'
import { fadeUp } from '../../utils/motionPresets'

const formReady = CONTRIBUTE_FORM_URL && CONTRIBUTE_FORM_URL !== 'REPLACE_WITH_GOOGLE_FORM_URL'

// Icons cannot live in YAML: one per step, in YAML order.
const STEP_ICONS = [ClipboardList, CheckCircle2, BookOpen]

export default function AblContribute() {
  const { steps } = ablContributeData

  return (
    <>
      <SeoHead
        title={ablContributeData.meta.seoTitle}
        description={ablContributeData.meta.seoDescription}
        path="/pramaan/contribute"
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: site.breadcrumbs.pramaan, path: '/pramaan' },
          { name: ablContributeData.meta.breadcrumbName, path: '/pramaan/contribute' },
        ]}
      />
      <PageHero
        badge={ablContributeData.meta.badge}
        title={ablContributeData.meta.title}
        subtitle={ablContributeData.meta.subtitle}
      />
      <AblNavBar />

      {/* The invitation, then the three steps as one short journey */}
      <section className="section-padding bg-tide-bg">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp()} className="mx-auto mb-14 max-w-2xl text-center md:mb-16">
            <span className="mx-auto mb-5 block h-0.5 w-10 bg-accent" aria-hidden="true" />
            <h2 className="mb-4 font-display text-3xl font-semibold leading-tight text-tide-text text-balance md:text-4xl">{ablContributeData.shareSection.title}</h2>
            <p className="font-body text-base leading-relaxed text-tide-muted md:text-lg">{ablContributeData.shareSection.body}</p>
          </motion.div>

          <ol className="relative grid gap-6 sm:grid-cols-3 sm:gap-8">
            {/* the thread the steps hang from, running through the number badges (wide screens) */}
            <span className="pointer-events-none absolute left-[16.7%] right-[16.7%] top-[2.1rem] hidden border-t-2 border-dashed border-primary/30 sm:block" aria-hidden="true" />
            {steps.map((step, i) => {
              const Icon = STEP_ICONS[i] || BookOpen
              return (
                <motion.li key={step.title} {...fadeUp(i * 0.12)} className="group relative">
                  <div className="relative mx-auto mb-5 flex h-[4.2rem] w-[4.2rem] items-center justify-center rounded-full border-4 border-tide-bg bg-primary font-display text-2xl font-bold text-white shadow-card transition-transform duration-300 group-hover:scale-105">
                    <span aria-hidden="true">{i + 1}</span>
                  </div>
                  <div className="h-[calc(100%-5.7rem)] rounded-3xl border border-tide-border bg-white p-6 text-center shadow-card transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-primary/40 group-hover:shadow-card-hover sm:min-h-[11rem]">
                    <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white" aria-hidden="true">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mb-2 font-display text-lg font-semibold text-tide-text">{step.title}</h3>
                    <p className="font-body text-sm leading-relaxed text-tide-muted">{step.desc}</p>
                  </div>
                </motion.li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* The call to action, on its own dark panel so it is the one thing left to do */}
      <section className="border-t border-tide-border bg-white px-4 pb-20 pt-4 md:px-8 md:pb-28 lg:px-16">
        <motion.div {...fadeUp()} className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-[#1c314d] px-6 py-12 text-center shadow-float md:px-12 md:py-14">
          {/* the council circles, the site's motif, quiet behind the text */}
          <svg viewBox="0 0 400 200" fill="none" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <circle cx="40" cy="30" r="80" fill="rgba(255,255,255,0.03)" stroke="#fff" strokeOpacity="0.1" strokeWidth="1.5" />
            <circle cx="100" cy="30" r="80" fill="rgba(255,255,255,0.03)" stroke="#fff" strokeOpacity="0.1" strokeWidth="1.5" />
            <circle cx="360" cy="190" r="90" fill="rgba(30,107,170,0.18)" stroke="#fff" strokeOpacity="0.1" strokeWidth="1.5" />
          </svg>

          <div className="relative">
            <span className="mx-auto mb-5 block h-0.5 w-10 bg-accent" aria-hidden="true" />
            <h2 className="mb-8 font-display text-3xl font-semibold leading-tight text-white text-balance md:text-4xl">{ablContributeData.formTitle}</h2>

            {formReady ? (
              <Button href={CONTRIBUTE_FORM_URL} external variant="accent" size="lg">
                {ablContributeData.cta}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <div className="inline-flex flex-col items-center gap-2">
                <span className="cursor-not-allowed rounded-full border border-white/20 bg-white/10 px-6 py-3.5 font-body text-sm font-semibold text-white/70">
                  {ablContributeData.cta}
                </span>
                <span className="font-body text-xs font-semibold text-accent">{ablContributeData.ctaPending}</span>
              </div>
            )}
          </div>
        </motion.div>
      </section>
    </>
  )
}
