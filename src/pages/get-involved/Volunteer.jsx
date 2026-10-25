import { motion } from 'framer-motion'
import { BookOpen, FileEdit, Users, Building2, Briefcase, ArrowRight } from 'lucide-react'
import SeoHead from '../../components/ui/SeoHead'
import PageHero from '../../components/ui/PageHero'
import SectionHeader from '../../components/ui/SectionHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import LightboxGallery from '../../components/ui/LightboxGallery'
import data from '../../data/get-involved-volunteer.json'
import site from '../../data/site.json'
import common from '../../data/common.json'
import { imgSrc } from '../../utils/imgSrc'
import { makeFadeUp } from '../../utils/motionPresets'

const ICONS = {
  BookOpen:  <BookOpen className="w-6 h-6" />,
  FileEdit:  <FileEdit className="w-6 h-6" />,
  Users:     <Users className="w-6 h-6" />,
  Building2: <Building2 className="w-6 h-6" />,
  Briefcase: <Briefcase className="w-6 h-6" />,
}

const fadeUp = makeFadeUp({ y: 20, duration: 0.55 })

export default function Volunteer() {

  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/get-involved/volunteer"
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: site.breadcrumbs.getInvolved },
          { name: data.meta.breadcrumbName, path: '/get-involved/volunteer' },
        ]}
      />
      <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.tagline} />

      {/* Hero section */}
      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <motion.div {...fadeUp()}>
              <p className="text-tide-muted font-body leading-relaxed text-lg mb-6">{data.intro.body}</p>
              <blockquote className="pl-5 border-l-4 border-accent mb-8">
                <p className="font-display text-xl italic text-tide-text">"{data.intro.quote}"</p>
              </blockquote>
              <Button href={data.intro.ctaHref} external size="lg">
                {data.intro.ctaLabel} <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
            <motion.div {...fadeUp(0.15)}>
              <div className="grid grid-cols-2 gap-3">
                {data.gallery.images.slice(0, 4).map((item, i) => (
                  <div key={item.src} className={`rounded-xl overflow-hidden ${i === 0 ? 'aspect-video col-span-2' : 'aspect-square'}`}>
                    <img src={imgSrc(item.src)} alt={item.label} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Opportunities */}
          <SectionHeader badge={data.opportunities.sectionBadge} title={data.opportunities.sectionTitle} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {data.opportunities.items.map((o, i) => (
              <Card key={o.title} delay={i * 0.08} className="p-6">
                <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-4">
                  {ICONS[o.iconKey] || <Users className="w-6 h-6" />}
                </div>
                <h3 className="font-display font-semibold text-tide-text mb-2">{o.title}</h3>
                <p className="text-sm font-body text-tide-muted leading-relaxed">{o.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Full gallery */}
      <LightboxGallery
        images={data.gallery.images}
        gridClassName="grid grid-cols-2 sm:grid-cols-4 gap-3"
        itemClassName="rounded-xl overflow-hidden"
        ringClassName="focus-visible:ring-white/50"
        spanClassName={(i) => (i === 0 || i === 4 ? 'sm:col-span-2 aspect-video' : 'aspect-square')}
        itemMotion={(i) => fadeUp(i * 0.05)}
      >
        {(grid) => (
          <section className="section-padding bg-navy">
            <div className="max-w-5xl mx-auto">
              <SectionHeader badge={data.gallery.sectionBadge} title={data.gallery.sectionTitle} light />
              <p className="text-xs font-body text-white/50 mb-8 -mt-6 italic">{common.clickToZoom}</p>
              {grid}
            </div>
          </section>
        )}
      </LightboxGallery>
    </>
  )
}
