import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Clock, MessageCircle, ArrowUpRight } from 'lucide-react'
import { FacebookIcon, InstagramIcon, LinkedinIcon } from '../components/ui/SocialIcons'
import SeoHead from '../components/ui/SeoHead'
import PageHero from '../components/ui/PageHero'
import Highlight from '../components/ui/Highlight'
import Button from '../components/ui/Button'
import data from '../data/contact.json'
import site from '../data/site.json'
import { fadeUp } from '../utils/motionPresets'

const SOCIAL_ICONS = {
  facebook:  <FacebookIcon className="w-4 h-4" />,
  instagram: <InstagramIcon className="w-4 h-4" />,
  linkedin:  <LinkedinIcon className="w-4 h-4" />,
}

const LINK = 'block py-1 -my-0.5 font-body text-sm text-tide-text hover:text-primary-dark transition-colors'

function InfoRow({ icon: Icon, label, children }) {
  return (
    <li className="flex gap-4 py-3">
      <Icon className="w-5 h-5 text-primary-dark shrink-0 mt-0.5" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-body text-xs uppercase tracking-wider text-tide-muted mb-1">{label}</p>
        {children}
      </div>
    </li>
  )
}

export default function Contact() {
  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/contact"
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: data.meta.breadcrumbName, path: '/contact' },
        ]}
      />
      <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.tagline} />

      <section className="bg-tide-bg py-10 md:py-12 px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 lg:gap-14 items-stretch">

          <motion.div {...fadeUp()}>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-tide-text mb-3">{data.labels.getInTouch}</h2>
            <div className="w-12 h-1 rounded-full bg-accent mb-4" aria-hidden="true" />

            <ul className="divide-y divide-tide-border border-y border-tide-border">
              <InfoRow icon={MapPin} label={data.labels.address}>
                <a href={data.map.mapsUrl} target="_blank" rel="noopener noreferrer" className={`${LINK} leading-relaxed`}>
                  {data.info.addressHighlights?.length
                    ? <Highlight text={data.info.address} words={data.info.addressHighlights} />
                    : data.info.address}
                </a>
              </InfoRow>
              <InfoRow icon={Phone} label={data.labels.phone}>
                {data.info.phones.map(phone => (
                  <a key={phone} href={`tel:${phone.replace(/\s/g, '')}`} className={LINK}>{phone}</a>
                ))}
              </InfoRow>
              <InfoRow icon={Mail} label={data.labels.email}>
                <a href={`mailto:${data.info.email}`} className={`${LINK} break-all`}>{data.info.email}</a>
              </InfoRow>
              <InfoRow icon={Clock} label={data.labels.officeHours}>
                <p className="font-body text-sm text-tide-text">{data.info.officeHours}</p>
                <p className="font-body text-sm text-tide-muted">{data.info.officeTimes}</p>
              </InfoRow>
            </ul>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button href={data.cta.emailHref} size="md">
                <Mail className="w-4 h-4" /> {data.cta.emailLabel}
              </Button>
              <Button href={data.cta.whatsappHref} external size="md" variant="secondary">
                <MessageCircle className="w-4 h-4" /> {data.cta.whatsappLabel}
              </Button>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <p className="font-body text-sm font-semibold text-tide-text">{data.labels.followUs}</p>
              <div className="flex gap-2.5">
                {data.social.map(s => (
                  <a key={s.platform} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={data.labels.visitSocial.replace('{platform}', s.platform.charAt(0).toUpperCase() + s.platform.slice(1))} className="w-10 h-10 rounded-full border border-tide-border text-tide-muted hover:bg-primary-dark hover:text-white hover:border-primary flex items-center justify-center transition-colors duration-200">
                    {SOCIAL_ICONS[s.platform]}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.15)} className="flex flex-col rounded-3xl border border-tide-border bg-tide-bg p-3 sm:p-4">
            <div className="flex items-center gap-3 px-2 pt-1 pb-3">
              <span className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-dark" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-body text-xs uppercase tracking-wider text-tide-muted">{data.map.eyebrow}</p>
                <h3 className="font-display text-xl font-semibold leading-snug text-tide-text">{data.map.title}</h3>
              </div>
            </div>
            <div className="flex-1 min-h-[280px] rounded-2xl overflow-hidden border border-tide-border bg-white">
              <iframe
                title={data.map.embedTitle}
                src={`https://www.google.com/maps?q=${encodeURIComponent(data.map.embedQuery)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full min-h-[280px] block saturate-[.8] sepia-[.12] hue-rotate-[-8deg]"
              />
            </div>
            <a
              href={data.map.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-3 mb-1 mx-2 inline-flex items-center gap-1.5 self-start min-h-[44px] font-body font-semibold text-sm text-primary-dark hover:text-primary-dark underline-offset-4 hover:underline transition-colors"
            >
              {data.map.mapsLabel}
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" aria-hidden="true" />
            </a>
          </motion.div>

        </div>
      </section>
    </>
  )
}
