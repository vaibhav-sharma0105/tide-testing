import { motion } from 'framer-motion'
import { ClipboardList, CheckCircle2, BookOpen } from 'lucide-react'
import PageHero from '../../components/ui/PageHero'
import AblNavBar from '../../components/abl/AblNavBar'
import Button from '../../components/ui/Button'
import { CONTRIBUTE_FORM_URL } from '../../config/abl'

const STEPS = [
  { step: 1, icon: ClipboardList, title: 'Fill the Form',  desc: 'Share details about your resource, including photos, concept, grades, and language.' },
  { step: 2, icon: CheckCircle2,  title: 'TIDE Reviews',   desc: 'Our team reviews and verifies the resource for quality and accuracy before publishing.' },
  { step: 3, icon: BookOpen,      title: 'Gets Published', desc: 'Approved resources are added to the library and become available to all educators.' },
]

const formReady = CONTRIBUTE_FORM_URL && CONTRIBUTE_FORM_URL !== 'REPLACE_WITH_GOOGLE_FORM_URL'

export default function AblContribute() {
  return (
    <>
      <PageHero
        badge="Resources · ABL"
        title="Contribute a Resource"
        subtitle="Help grow the ABL library. Share a resource you've used in your classroom and it will be reviewed by the TIDE team."
        gradient
      />
      <AblNavBar />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-3xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl font-semibold text-tide-text mb-4">Share What Works</h2>
            <p className="font-body text-tide-muted leading-relaxed">
              TIDE's ABL resource library grows through the collective wisdom of educators. If you have
              a worksheet, game, kit, or flashcard set that has worked well in your classroom, share it
              with the community and help other teachers discover what works.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            {STEPS.map(({ step, icon: Icon, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-tide-border text-center"
              >
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-display font-bold text-lg mx-auto mb-4">
                  {step}
                </div>
                <Icon className="w-6 h-6 text-primary mx-auto mb-3" />
                <h3 className="font-display text-base font-semibold text-tide-text mb-2">{title}</h3>
                <p className="text-sm font-body text-tide-muted leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center"
          >
            {formReady ? (
              <Button href={CONTRIBUTE_FORM_URL} external size="lg">
                Open Contribution Form ↗
              </Button>
            ) : (
              <div className="inline-flex flex-col items-center gap-2">
                <span className="px-5 py-3 rounded-full bg-tide-subtle text-tide-muted text-sm font-body font-semibold border border-tide-border cursor-not-allowed">
                  Open Contribution Form ↗
                </span>
                <span className="text-xs font-body text-accent font-semibold">Form link coming soon.</span>
              </div>
            )}
            <p className="text-xs font-body text-tide-muted mt-3">Opens in a new tab. Form data is handled by Google Forms.</p>
          </motion.div>

        </div>
      </section>
    </>
  )
}
