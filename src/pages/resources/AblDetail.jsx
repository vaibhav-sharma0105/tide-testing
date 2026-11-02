import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, BookOpen, Expand, ExternalLink, MapPin, Layers, Play } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import SeoHead from '../../components/ui/SeoHead'
import PageHero from '../../components/ui/PageHero'
import AblNavBar from '../../components/abl/AblNavBar'
import Button from '../../components/ui/Button'
import ResourceTypeBadge from '../../components/abl/ResourceTypeBadge'
import CreativeLoader from '../../components/ui/CreativeLoader'
import DriveImage from '../../components/abl/DriveImage'
import ImageLightbox from '../../components/abl/ImageLightbox'
import VideoLightbox from '../../components/abl/VideoLightbox'
import { useABLData } from '../../hooks/useABLData'
import { useDelayedVisible } from '../../hooks/useDelayedVisible'
import { getDrivePreviewUrl } from '../../utils/driveUtils'
import { imgSrc } from '../../utils/imgSrc'
import { parseLanguages } from '../../utils/resourceLanguages'
import { GRADES, getTabStyle, getTypeColors } from '../../config/abl'
import data from '../../data/abl-detail.json'
import rcData from '../../data/abl-resource-center.json'
import site from '../../data/site.json'


// Fills {token} placeholders in a YAML template (function replacer so a value
// containing "$&" etc. is inserted literally).
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k])

const fadeUp = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

function Eyebrow({ children, className = '' }) {
  return (
    <p className={`text-xs font-body font-semibold uppercase tracking-widest ${className}`}>
      {children}
    </p>
  )
}

/* Grade × chapter-count grid — tap a tile to reveal its chapters in a
   shared panel below, instead of always-on text for every grade at once. */
function CoverageMatrix({ chapters, accent, expanded, onToggle }) {
  const rows = GRADES.map(g => ({ grade: g, list: chapters[g] ?? [] }))
  const hasAny = rows.some(r => r.list.length > 0)
  if (!hasAny) return null

  const active = rows.find(r => r.grade === expanded && r.list.length > 0)

  return (
    <motion.div variants={fadeUp}>
      <Eyebrow className={accent.eyebrow}>{data.coverage.eyebrow}</Eyebrow>
      <div className="grid grid-cols-5 gap-3 mt-3 max-w-lg">
        {rows.map(({ grade, list }, i) => {
          const has = list.length > 0
          const isActive = expanded === grade
          return (
            <motion.button
              key={grade}
              type="button"
              disabled={!has}
              onClick={() => onToggle(isActive ? null : grade)}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              className={`flex flex-col items-center gap-1.5 ${has ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div
                className={`w-full aspect-square rounded-xl border flex items-center justify-center text-base font-display font-semibold transition-all duration-200 ${
                  has ? (isActive ? `${accent.selectedTile} -translate-y-0.5` : `${accent.badge} hover:-translate-y-0.5 hover:shadow-card`) : 'border-tide-border text-tide-muted/30'
                }`}
              >
                {has ? list.length : '–'}
              </div>
              <span className="text-xs font-body text-tide-muted">{fill(data.coverage.shortGradeTemplate, { n: grade.replace('GRADE ', '') })}</span>
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.grade}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 px-4 py-3 rounded-2xl bg-tide-subtle text-sm font-body text-tide-muted">
              <span className="font-semibold text-tide-text">{fill(data.coverage.gradeTemplate, { n: active.grade.replace('GRADE ', '') })}</span>
              {data.coverage.chapterSeparator}{active.list.join(', ')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function AblDetail() {
  const { id } = useParams()
  const { allResources, loading, error } = useABLData()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const [expandedGrade, setExpandedGrade] = useState(null)
  const showLoader = useDelayedVisible(loading, 200)

  const backLink = (
    <Link
      to="/pramaan/resource-centre"
      className="group/back inline-flex items-center gap-2 text-sm font-body font-medium text-tide-muted hover:text-primary transition-colors mb-8"
    >
      <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover/back:-translate-x-1" /> {data.backLabel}
    </Link>
  )

  const resource = allResources.find(r => r.id === id)

  if (loading) {
    return (
      <>
        {/* Transient — no canonical/OG needed, just a non-empty <title> in
            case a crawler captures this exact instant. */}
        <Helmet><title>{data.meta.loadingSeoTitle}</title></Helmet>
        <PageHero badge={data.meta.badge} title={data.meta.loadingHeading} />
        <AblNavBar />
        <section className="section-padding bg-tide-bg min-h-[40vh] flex items-center justify-center">
          {showLoader && <CreativeLoader />}
        </section>
      </>
    )
  }

  if (error || !resource) {
    return (
      <>
        {/* This specific resource id doesn't exist (or failed to load) —
            noindex so a stale/typo'd link never gets indexed as real content. */}
        <SeoHead
          title={data.notFound.seoTitle}
          description={data.notFound.seoDescription}
          path={`/pramaan/resource-centre/${id}`}
          noindex
        />
        <PageHero badge={data.meta.badge} title={data.notFound.heading} />
        <AblNavBar />
        <section className="section-padding bg-tide-bg">
          <div className="max-w-5xl mx-auto text-center py-10">
            <BookOpen className="w-12 h-12 text-tide-muted/40 mx-auto mb-4" />
            <p className="font-body text-tide-muted mb-6">
              {error ?? fill(data.notFound.messageTemplate, { id })}
            </p>
            {backLink}
          </div>
        </section>
      </>
    )
  }

  const languages       = parseLanguages(resource.language)
  const videoPreviewUrl = getDrivePreviewUrl(resource.videoUrl)
  // The Sheet tab is the reliable type: a row's own `type` text is free-typed ("Kit", "Flashcard", even typos)
  const kind            = resource.tab ?? resource.type
  const style           = getTabStyle(kind)
  const accent          = getTypeColors(kind)
  const hasActions      = Boolean(resource.photoUrl || resource.referenceLink)
  const hasCoverage     = GRADES.some(g => (resource.chapters?.[g]?.length ?? 0) > 0)
  const gradesCovered   = GRADES.filter(g => (resource.chapters?.[g]?.length ?? 0) > 0).map(g => g.replace('GRADE ', ''))
  const seoDescription  = resource.description
    || fill(data.meta.descriptionTemplate, {
      type:   style.pluralLabel?.replace(/s$/, '') || resource.type,
      grades: gradesCovered.length ? fill(data.meta.gradesTemplate, { grades: gradesCovered.join(', ') }) : data.meta.gradesFallback,
    })

  return (
    <>
      <SeoHead
        title={fill(data.meta.titleTemplate, { name: resource.name })}
        description={seoDescription}
        path={`/pramaan/resource-centre/${id}`}
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: site.breadcrumbs.pramaan, path: '/pramaan' },
          { name: site.breadcrumbs.resourceCentre, path: '/pramaan/resource-centre' },
          { name: resource.name, path: `/pramaan/resource-centre/${id}` },
        ]}
      />
      {/* Educational-content structured data — lets AI systems and rich
          search understand this as a specific teaching resource (grade,
          subject, free/paid, language), not just an undifferentiated page. */}
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'LearningResource',
          name: resource.name,
          description: seoDescription,
          learningResourceType: resource.type,
          ...(gradesCovered.length ? { educationalAlignment: gradesCovered.map(g => ({
            '@type': 'AlignmentObject',
            alignmentType: 'educationalLevel',
            targetName: fill(data.coverage.gradeTemplate, { n: g }),
          })) } : {}),
          ...(languages.length ? { inLanguage: languages } : {}),
          isAccessibleForFree: true,
          provider: { '@type': 'NGO', name: site.name, url: site.url },
        })}</script>
      </Helmet>
      <PageHero badge={fill(data.meta.badgeTemplate, { type: resource.type })} badgeClassName={accent.heroBadge} title={resource.name} />
      <AblNavBar />

      <section className="section-padding bg-gradient-to-b from-tide-bg to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            {backLink}

            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-14">

              {/* Left: the resource itself, a pinned print that stays in view while the facts scroll */}
              <div className="lg:sticky lg:top-[150px]">
                <div className="mx-auto max-w-[320px] lg:mx-0">
                  {/* a pinned white print, like the photos elsewhere on the site (kept straight: it is a document to read) */}
                  <div className="relative rounded-md bg-white p-2 shadow-[0_14px_36px_rgba(13,33,55,0.16)] ring-1 ring-tide-border transition-transform duration-500 hover:-translate-y-1">
                    <span className={`absolute left-1/2 -top-2 z-10 h-4 w-4 -translate-x-1/2 rounded-full ${accent.solid} shadow-[0_2px_3px_rgba(0,0,0,0.35)]`} aria-hidden="true" />
                    <div className="relative aspect-[3/4] rounded-sm overflow-hidden">
                      <DriveImage id={resource.id} alt={resource.name} variant="full" />

                      <button
                        type="button"
                        onClick={() => resource.photoUrl && setLightboxOpen(true)}
                        disabled={!resource.photoUrl}
                        className={`group/img absolute inset-0 w-full h-full ${resource.photoUrl ? 'cursor-zoom-in' : 'cursor-default'}`}
                        aria-label={data.media.viewFullImageLabel}
                      >
                        {resource.photoUrl && (
                          <>
                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/15 transition-colors duration-300" />
                            <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy/60 ring-1 ring-white/25 backdrop-blur-sm text-white text-xs font-body font-medium">
                              <Expand className="w-3.5 h-3.5" /> {data.media.viewLarger}
                            </div>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {hasActions && (
                    <div className="flex gap-3 mt-5 flex-wrap">
                      {resource.photoUrl && (
                        <Button href={resource.photoUrl} external variant="accent">
                          {data.media.fullPreview} <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      {resource.referenceLink && (
                        <Button href={resource.referenceLink} external variant="secondary">
                          {data.media.sourceReference}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: what it is, how to watch it used, where it fits, where it lives, why it exists */}
              <motion.div
                className="min-w-0 space-y-6"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              >
                {/* identity: the type pill first, then language and ownership, then the concept */}
                <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl border border-tide-border bg-white p-6 shadow-card md:p-8">
                  <span className={`absolute inset-x-0 top-0 h-1.5 ${accent.solid}`} aria-hidden="true" />
                  <div className="flex flex-col gap-7 md:flex-row md:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <ResourceTypeBadge type={kind} icon className="!px-3.5 !py-1.5 !text-sm" />
                        {languages.map(l => (
                          <span key={l} className="inline-block rounded-full border border-tide-border bg-tide-subtle px-3.5 py-1 text-sm font-semibold text-tide-muted">
                            {l}
                          </span>
                        ))}
                        {resource.ownership && (
                          <span className="inline-flex items-center gap-1.5 pl-1 font-body text-sm text-tide-muted">
                            <span className={`h-1.5 w-1.5 rounded-full ${resource.ownership === 'TIDE' ? 'bg-primary' : 'bg-tide-muted'}`} />
                            {resource.ownership === 'TIDE' ? rcData.card.tideResource : rcData.card.externalResource}
                          </span>
                        )}
                      </div>

                      {resource.concept && (
                        <div className="mt-6">
                          <Eyebrow className={accent.eyebrow}>{data.facts.concept}</Eyebrow>
                          <p className="mt-1.5 font-display text-2xl font-semibold leading-snug text-tide-text md:text-3xl">{resource.concept}</p>
                        </div>
                      )}
                    </div>

                    {videoPreviewUrl && (
                      <div className="w-full shrink-0 md:w-80">
                        <Eyebrow className={`${accent.eyebrow} mb-3`}>{data.facts.explanationVideo}</Eyebrow>
                        {/* The poster is drawn: a live Drive iframe here would letterbox unpredictably depending
                            on the source video's own aspect ratio, which we can't control or detect from a
                            cross-origin embed. */}
                        <motion.button
                          type="button"
                          onClick={() => setVideoOpen(true)}
                          aria-label={data.facts.playVideoLabel}
                          aria-haspopup="dialog"
                          whileHover={{ y: -2 }}
                          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                          className={`group/video relative block aspect-video w-full overflow-hidden rounded-2xl border border-tide-border bg-gradient-to-br ${accent.poster} shadow-card`}
                        >
                          <span className="absolute inset-0 flex items-center justify-center">
                            <img src={imgSrc(data.media.videoLogo)} alt="" className="h-28 w-28 opacity-50 mix-blend-multiply" />
                          </span>
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className={`flex h-14 w-14 items-center justify-center rounded-full ${accent.solid} text-white shadow-lg ring-4 ring-white/70 transition-transform duration-300 group-hover/video:scale-110`}>
                              <Play className="h-5 w-5 translate-x-px fill-white" />
                            </span>
                          </span>
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>

                {hasCoverage && (
                  <motion.div variants={fadeUp} className="rounded-3xl border border-tide-border bg-white p-6 shadow-card md:p-8">
                    <CoverageMatrix
                      chapters={resource.chapters ?? {}}
                      accent={accent}
                      expanded={expandedGrade}
                      onToggle={setExpandedGrade}
                    />
                  </motion.div>
                )}

                {(resource.storageLocation || resource.quantity) && (
                  <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2">
                    {resource.storageLocation && (
                      <div className="flex items-center gap-3 rounded-2xl border border-tide-border bg-white p-4 shadow-card">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent.soft}`}><MapPin className="h-5 w-5" /></span>
                        <span className="font-body text-sm text-tide-text">{resource.storageLocation}</span>
                      </div>
                    )}
                    {resource.quantity && (
                      <div className="flex items-center gap-3 rounded-2xl border border-tide-border bg-white p-4 shadow-card">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent.soft}`}><Layers className="h-5 w-5" /></span>
                        <span className="font-body text-sm text-tide-text">{fill(data.facts.setsTemplate, { quantity: resource.quantity })}</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {resource.description && (
                  <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl border border-tide-border bg-white p-6 pl-8 shadow-card md:p-8 md:pl-10">
                    <span className={`absolute inset-y-0 left-0 w-1.5 ${accent.solid}`} aria-hidden="true" />
                    <Eyebrow className={`${accent.eyebrow} mb-3`}>{data.facts.about}</Eyebrow>
                    <p className="max-w-3xl font-body leading-relaxed text-tide-text">{resource.description}</p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <ImageLightbox
        id={lightboxOpen ? resource.id : null}
        alt={resource.name}
        onClose={() => setLightboxOpen(false)}
      />

      <VideoLightbox
        src={videoOpen ? videoPreviewUrl : null}
        title={data.facts.explanationVideo}
        onClose={() => setVideoOpen(false)}
        translucent
      />
    </>
  )
}
