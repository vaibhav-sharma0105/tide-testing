import { motion } from 'framer-motion'
import { ExternalLink, BookOpen, Video, FileText, Mic } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHero from '../../components/ui/PageHero'
import SectionHeader from '../../components/ui/SectionHeader'
import data from '../../data/resources-publications.json'

/* Visual config — can't be stored in JSON */
const TYPE_ICONS = {
  book:      <BookOpen className="w-5 h-5" />,
  article:   <FileText className="w-5 h-5" />,
  video:     <Video className="w-5 h-5" />,
  talk:      <Mic className="w-5 h-5" />,
  materials: <BookOpen className="w-5 h-5" />,
}

const typeColors = {
  book:      { pill: 'bg-violet-100 text-violet-700 border-violet-200', icon: 'bg-violet-50 text-violet-600 border-violet-200' },
  article:   { pill: 'bg-blue-100 text-blue-700 border-blue-200',       icon: 'bg-blue-50 text-blue-600 border-blue-200' },
  video:     { pill: 'bg-rose-100 text-rose-700 border-rose-200',       icon: 'bg-rose-50 text-rose-600 border-rose-200' },
  talk:      { pill: 'bg-amber-100 text-amber-700 border-amber-200',    icon: 'bg-amber-50 text-amber-600 border-amber-200' },
  materials: { pill: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
}

const typeLabel = { book: 'Book', article: 'Article', video: 'Video', talk: 'Talk', materials: 'Materials' }

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.35, delay, ease: [0.4, 0, 0.2, 1] },
})

export default function Publications() {
  return (
    <>
      <PageHero badge={data.meta.badge} title={data.meta.title} subtitle={data.meta.tagline} />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            badge={data.section.sectionBadge}
            title={data.section.sectionTitle}
            subtitle={data.section.sectionSubtitle}
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.publications.map((p, i) => {
              const colors = typeColors[p.type]
              const Wrapper = p.href
                ? p.internal
                  ? ({ children, ...props }) => <Link to={p.href} {...props}>{children}</Link>
                  : ({ children, ...props }) => <a href={p.href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
                : ({ children, ...props }) => <div {...props}>{children}</div>

              return (
                <motion.div key={i} {...fadeUp(i * 0.04)}>
                  <Wrapper className="group block bg-white rounded-2xl border border-tide-border hover:border-primary hover:shadow-card-hover transition-all duration-300 overflow-hidden h-full">
                    {p.photo ? (
                      <div className="aspect-video overflow-hidden bg-tide-subtle">
                        <img src={p.photo} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                    ) : (
                      <div className={`aspect-video flex items-center justify-center ${colors.icon} border-b border-tide-border`}>
                        <div className="w-16 h-16 flex items-center justify-center">{TYPE_ICONS[p.type]}</div>
                      </div>
                    )}

                    <div className="p-5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-body font-semibold border mb-3 ${colors.pill}`}>
                        {typeLabel[p.type]}
                      </span>
                      <h3 className="font-display font-semibold text-tide-text text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-3">
                        {p.title}
                      </h3>
                      <p className="text-xs font-body text-tide-muted leading-relaxed">{p.publisher}</p>

                      {p.href && (
                        <div className="mt-3 flex items-center gap-1 text-xs font-body font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          {p.internal ? 'View resource' : 'Read more'}
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </Wrapper>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
