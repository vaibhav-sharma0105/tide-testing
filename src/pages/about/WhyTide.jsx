import { Eye, Target, Heart, Lightbulb, GraduationCap } from 'lucide-react'
import SeoHead from '../../components/ui/SeoHead'
import PageHero from '../../components/ui/PageHero'
import data from '../../data/about-why-tide.json'
import site from '../../data/site.json'
import { imgSrc } from '../../utils/imgSrc'

const GOAL_ICONS = { Heart, Lightbulb, Target, GraduationCap }

function Pillar({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <span className="w-12 h-12 rounded-full bg-primary-faint border border-primary/20 text-primary flex items-center justify-center shrink-0">
          <Icon aria-hidden="true" className="w-5 h-5" />
        </span>
        <h2 className="font-display text-2xl font-semibold text-tide-text leading-tight">{title}</h2>
      </div>
      <div className="font-body text-tide-muted leading-relaxed space-y-4">{children}</div>
    </div>
  )
}

export default function WhyTide() {
  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/about/why-tide"
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: site.breadcrumbs.aboutUs },
          { name: data.meta.breadcrumbName, path: '/about/why-tide' },
        ]}
      />
      <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.subtitle} />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 md:divide-x divide-tide-border gap-10 md:gap-0">
            <div className="md:pr-12">
              <Pillar icon={Target} title={data.whoWeAre.sectionTitle}>
                <p>{data.whoWeAre.mission}</p>
              </Pillar>
            </div>
            <div className="md:pl-12">
              <Pillar icon={Eye} title={data.vision.title}>
                <p>{data.vision.body}</p>
                <p>{data.vision.policy}</p>
              </Pillar>
            </div>
          </div>

          <figure className="relative mt-14 md:mt-20 rounded-3xl overflow-hidden bg-navy">
            <img
              src={imgSrc(data.vision.backgroundImage)} alt="" loading="lazy" decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/10" />
            <blockquote className="relative px-8 py-12 md:px-14 md:py-16 max-w-xl">
              <div className="h-1 w-12 bg-accent rounded-full mb-6" />
              <p className="font-display italic text-2xl md:text-3xl leading-snug text-white">"{data.vision.quote}"</p>
            </blockquote>
          </figure>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-semibold text-tide-text leading-tight mb-8">{data.goals.sectionTitle}</h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 mt-14">
            {data.goals.items.map((g) => {
              const Icon = GOAL_ICONS[g.iconKey] || Target
              return (
                <li key={g.text} className="relative bg-tide-bg border border-tide-border rounded-2xl px-6 pt-10 pb-7 transition-shadow duration-300 hover:shadow-card-hover">
                  <span className="absolute -top-6 left-6 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center ring-4 ring-white">
                    <Icon aria-hidden="true" className="w-5 h-5" />
                  </span>
                  <p className="font-display text-lg font-semibold leading-snug text-tide-text">{g.text}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className="relative section-padding pt-24 md:pt-32 bg-tide-warm">
        <svg aria-hidden="true" className="absolute top-0 left-0 w-full h-6 md:h-10 text-white" preserveAspectRatio="none" viewBox="0 0 1440 40">
          <path fill="currentColor" d="M0 0h1440v16c-120 24-240 24-360 8S840 0 720 8 480 32 360 32 120 24 0 8z" />
        </svg>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-semibold text-tide-text leading-tight mb-12 text-center">{data.principles.sectionTitle}</h2>
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-12">
            {data.principles.items.map((p) => (
              <li key={p.title} className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.34rem)] text-center">
                <img
                  src={imgSrc(p.image)} alt="" loading="lazy" decoding="async"
                  className="w-32 h-32 mx-auto rounded-full object-cover ring-2 ring-accent ring-offset-4 ring-offset-tide-warm"
                />
                <h3 className="mt-6 font-display text-xl font-semibold text-tide-text leading-snug">{p.title}</h3>
                <p className="mt-2 font-body text-tide-muted leading-relaxed max-w-xs mx-auto">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
