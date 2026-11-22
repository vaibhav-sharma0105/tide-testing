import { useState } from 'react'
import { motion } from 'framer-motion'
import SeoHead from '../../components/ui/SeoHead'
import { BadgeCheck, Handshake, Mail, MessageCircle, Copy, Check, Heart, ChevronDown, Landmark } from 'lucide-react'
import PageHero from '../../components/ui/PageHero'
import WaveDivider from '../../components/ui/WaveDivider'
import data from '../../data/get-involved-donate.json'
import site from '../../data/site.json'
import { fadeUp } from '../../utils/motionPresets'
import TiltGlare from '../../components/ui/TiltGlare'
import { tiltProps } from '../../utils/tilt'
const TILT = tiltProps()

const HIGHLIGHT_ICONS = [BadgeCheck, Handshake]

function BankRow({ label, value, large = false }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard unavailable: the value stays selectable */ }
  }
  return (
    <li className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <span className="block font-body text-xs text-tide-muted uppercase tracking-wider mb-0.5">{label}</span>
        <span className={`block font-mono text-tide-text font-semibold break-words select-all ${large ? 'text-lg tracking-wide' : 'text-sm'}`}>{value}</span>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={data.bank.copyAria.replace('{label}', label)}
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${copied ? 'text-primary bg-primary-light' : 'text-tide-muted hover:text-primary hover:bg-primary-light'}`}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        <span className="sr-only" aria-live="polite">{copied ? data.bank.copiedLabel : ''}</span>
      </button>
    </li>
  )
}

export default function Donate() {
  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/get-involved/donate"
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: site.breadcrumbs.getInvolved },
          { name: data.meta.breadcrumbName, path: '/get-involved/donate' },
        ]}
      />
      <PageHero
        badge={data.meta.badge}
        title={data.meta.title}
        subtitle={data.meta.tagline}
      />

      <section className="bg-tide-bg py-10 md:py-14 px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">

            <motion.div {...fadeUp()}>
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-tide-text mb-4">
                {data.hero.heading}
              </h2>
              <div className="w-12 h-1 rounded-full bg-accent mb-5" aria-hidden="true" />
              <p className="font-body text-tide-muted leading-relaxed">
                {data.hero.body}
              </p>

              <div className="mt-10 flex items-end gap-4">
                <span className="font-display text-5xl md:text-6xl font-semibold leading-none text-primary">{data.hero.impactValue}</span>
                <span className="font-body text-sm text-tide-muted pb-1">{data.hero.impactLabel}</span>
              </div>

              <ul className="mt-8 divide-y divide-tide-border border-y border-tide-border">
                {data.hero.highlights.map((pt, i) => {
                  const Icon = HIGHLIGHT_ICONS[i]
                  return (
                    <li key={pt} className="flex items-center gap-3 py-3.5">
                      {Icon && <Icon className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />}
                      <span className="font-body text-sm text-tide-text">{pt}</span>
                    </li>
                  )
                })}
              </ul>
            </motion.div>

            <motion.div {...fadeUp(0.15)} className="rounded-3xl border border-tide-border bg-tide-bg p-3 sm:p-4">
              <div className="flex items-center gap-3 px-2 pt-1 pb-3">
                <span className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-primary" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-xl font-semibold leading-snug text-tide-text">{data.bank.transferTitle}</h3>
                  <p className="font-body text-sm text-tide-muted">{data.bank.transferIntro}</p>
                </div>
              </div>
              <ul className="divide-y divide-tide-border rounded-2xl border border-tide-border bg-white px-4">
                <BankRow label={data.bank.accountNameLabel} value={data.bank.accountName} />
                <BankRow label={data.bank.accountNumberLabel} value={data.bank.accountNumber} large />
                <BankRow label={data.bank.bankNameLabel} value={data.bank.bankName} />
                <BankRow label={data.bank.ifscLabel} value={data.bank.ifsc} />
                <BankRow label={data.bank.branchLabel} value={data.bank.branch} />
              </ul>
            </motion.div>

          </div>

          <div className="mt-10 flex justify-center">
            <a href="#give" className="flex flex-col items-center font-body text-sm font-medium text-primary hover:text-primary-dark transition-colors">
              <span>{data.cue.label}</span>
              <ChevronDown className="w-5 h-5 mt-0.5 motion-safe:animate-bounce" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section id="give" className="relative scroll-mt-20 bg-gradient-to-br from-primary to-primary-dark text-white px-4 md:px-8 lg:px-16 pt-24 pb-20 md:pt-28 md:pb-24">
        <WaveDivider className="text-tide-bg" />
        <div className="max-w-3xl mx-auto text-center">
          <Heart className="w-8 h-8 text-accent mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">{data.closing.heading}</h2>
          <div className="w-12 h-1 rounded-full bg-accent mx-auto mb-5" aria-hidden="true" />
          <p className="font-body text-white/80 leading-relaxed mb-8">{data.closing.body}</p>
          <div className="max-w-xl mx-auto grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 text-left">
            <a
              href={`mailto:${data.hero.email}`}
              {...TILT}
              className="tilt-3d tilt-lift relative overflow-hidden flex flex-col items-center justify-center text-center gap-1.5 px-3 py-5 rounded-2xl font-body bg-accent text-navy hover:bg-accent-dark shadow-float"
            >
              <TiltGlare />
              <Mail className="w-6 h-6" />
              <span className="font-semibold text-sm">{data.hero.emailCta}</span>
              <span className="text-xs text-navy/80 break-all">{data.hero.email}</span>
            </a>
            <a
              href={data.hero.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              {...TILT}
              className="tilt-3d tilt-lift relative overflow-hidden flex flex-col items-center justify-center text-center gap-1.5 px-3 py-5 rounded-2xl font-body border-2 border-white/50 text-white hover:bg-white/10"
            >
              <TiltGlare />
              <MessageCircle className="w-6 h-6" />
              <span className="font-semibold text-sm">{data.hero.whatsappCta}</span>
              <span className="text-xs text-white/80 break-all">{data.hero.whatsappText}</span>
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
