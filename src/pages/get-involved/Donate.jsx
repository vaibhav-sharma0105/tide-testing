import { motion } from 'framer-motion'
import { Heart, Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import PageHero from '../../components/ui/PageHero'
import Button from '../../components/ui/Button'
import data from '../../data/get-involved-donate.json'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] },
})

export default function Donate() {
  return (
    <>
      <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.tagline} gradient />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp()}>
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-sm">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-3xl font-semibold text-tide-text mb-4">{data.support.title}</h2>
              <p className="text-tide-muted font-body leading-relaxed mb-6 text-base">{data.support.body}</p>

              <ul className="space-y-3 mb-8">
                {data.support.impactPoints.map((pt, i) => (
                  <motion.li key={i} {...fadeUp(0.1 + i * 0.06)} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm font-body text-tide-text">{pt}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button href={data.support.contactHref} size="lg">
                  <Mail className="w-4 h-4" /> {data.support.contactLabel}
                </Button>
                <Button href={data.support.whatsappHref} external variant="secondary" size="lg">
                  {data.support.whatsappLabel} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>

            <motion.div {...fadeUp(0.2)} className="flex flex-col items-center gap-4">
              <div className="rounded-2xl overflow-hidden shadow-float border border-tide-border max-w-sm w-full">
                <img src={data.support.donorPoster} alt="Scan to donate to TIDE Foundation" className="w-full h-auto" />
              </div>
              <p className="text-xs font-body text-tide-muted text-center max-w-xs">{data.support.posterCaption}</p>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}
