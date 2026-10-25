import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react'
import { FacebookIcon, InstagramIcon, LinkedinIcon } from '../components/ui/SocialIcons'
import SeoHead from '../components/ui/SeoHead'
import PageHero from '../components/ui/PageHero'
import Button from '../components/ui/Button'
import data from '../data/contact.json'
import site from '../data/site.json'

const SOCIAL_ICONS = {
  facebook:  <FacebookIcon className="w-4 h-4" />,
  instagram: <InstagramIcon className="w-4 h-4" />,
  linkedin:  <LinkedinIcon className="w-4 h-4" />,
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

      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
            {/* Contact info */}
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <h2 className="font-display text-2xl font-semibold text-tide-text mb-8">{data.labels.getInTouch}</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-tide-text text-sm mb-1">{data.labels.address}</p>
                    <p className="font-body text-tide-muted text-sm leading-relaxed">{data.info.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-tide-text text-sm mb-1">{data.labels.phone}</p>
                    {data.info.phones.map(phone => (
                      <a key={phone} href={`tel:${phone.replace(/\s/g, '')}`} className="font-body text-tide-muted text-sm hover:text-primary transition-colors block py-1 -my-1">{phone}</a>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-tide-text text-sm mb-1">{data.labels.email}</p>
                    <a href={`mailto:${data.info.email}`} className="font-body text-tide-muted text-sm hover:text-primary transition-colors">{data.info.email}</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-tide-text text-sm mb-1">{data.labels.officeHours}</p>
                    <p className="font-body text-tide-muted text-sm">{data.info.officeHours}</p>
                  </div>
                </div>
              </div>

              {/* Social */}
              <div className="mt-10 pt-8 border-t border-tide-border">
                <p className="font-body font-semibold text-tide-text text-sm mb-4">{data.labels.followUs}</p>
                <div className="flex gap-3">
                  {data.social.map(s => (
                    <a key={s.platform} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={data.labels.visitSocial.replace('{platform}', s.platform.charAt(0).toUpperCase() + s.platform.slice(1))} className="w-10 h-10 rounded-full bg-tide-subtle border border-tide-border text-tide-muted hover:bg-primary hover:text-white hover:border-primary flex items-center justify-center transition-all duration-200">
                      {SOCIAL_ICONS[s.platform]}
                    </a>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <Button href={data.cta.whatsappHref} external size="md" variant="secondary">
                  <MessageCircle className="w-4 h-4" /> {data.cta.whatsappLabel}
                </Button>
                <Button href={data.cta.emailHref} size="md">
                  <Mail className="w-4 h-4" /> {data.cta.emailLabel}
                </Button>
              </div>
            </motion.div>

            {/* Contact form */}
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}>
              <div className="bg-white rounded-3xl p-5 sm:p-8 border border-tide-border shadow-card">
                <h3 className="font-display text-xl font-semibold text-tide-text mb-6">{data.form.title}</h3>
                <form
                  aria-label={data.form.ariaLabel}
                  onSubmit={e => {
                    e.preventDefault()
                    const fd = new FormData(e.target)
                    const body = `${data.form.mailName} ${fd.get('name')}%0A${data.form.mailEmail} ${fd.get('email')}%0A${data.form.mailMessage} ${fd.get('message')}`
                    window.location.href = `mailto:${data.info.email}?subject=${data.form.mailSubject}&body=${body}`
                  }}
                  className="space-y-5"
                >
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-body font-semibold text-tide-muted uppercase tracking-wide mb-2">{data.form.namePlaceholder}</label>
                    <input id="contact-name" name="name" required type="text" placeholder={data.form.namePlaceholder} className="w-full px-4 py-3 rounded-xl border border-tide-border bg-tide-bg font-body text-sm text-tide-text placeholder-tide-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-body font-semibold text-tide-muted uppercase tracking-wide mb-2">{data.form.emailPlaceholder}</label>
                    <input id="contact-email" name="email" required type="email" placeholder={data.form.emailPlaceholder} className="w-full px-4 py-3 rounded-xl border border-tide-border bg-tide-bg font-body text-sm text-tide-text placeholder-tide-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-body font-semibold text-tide-muted uppercase tracking-wide mb-2">{data.form.messagePlaceholder}</label>
                    <textarea id="contact-message" name="message" required rows={5} placeholder={data.form.messagePlaceholder} className="w-full px-4 py-3 rounded-xl border border-tide-border bg-tide-bg font-body text-sm text-tide-text placeholder-tide-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition resize-none" />
                  </div>
                  <Button type="submit" size="lg" className="w-full justify-center">
                    {data.form.submitLabel}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map placeholder */}
      <section className="h-72 bg-tide-subtle border-t border-tide-border relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="font-body text-tide-muted text-sm">{data.map.label}</p>
            <a href={data.map.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-body font-semibold text-primary hover:underline">
              {data.map.mapsLabel}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
