import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, BookOpen, Expand, ExternalLink, MapPin, Layers, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PageHero from '../../components/ui/PageHero'
import AblNavBar from '../../components/abl/AblNavBar'
import Button from '../../components/ui/Button'
import DriveImage from '../../components/abl/DriveImage'
import ImageLightbox from '../../components/abl/ImageLightbox'
import VideoLightbox from '../../components/abl/VideoLightbox'
import { useABLData } from '../../hooks/useABLData'
import { getDrivePreviewUrl } from '../../utils/driveUtils'
import { TAB_STYLE_MAP } from '../../config/abl'

const GRADES = ['GRADE 1', 'GRADE 2', 'GRADE 3', 'GRADE 4', 'GRADE 5']

const ACCENT_MAP = {
  blue:    { tile: 'bg-blue-50 text-blue-700 border-blue-200',       eyebrow: 'text-blue-700', solid: 'bg-blue-600' },
  emerald: { tile: 'bg-emerald-50 text-emerald-700 border-emerald-200', eyebrow: 'text-emerald-700', solid: 'bg-emerald-600' },
  violet:  { tile: 'bg-violet-50 text-violet-700 border-violet-200',  eyebrow: 'text-violet-700', solid: 'bg-violet-600' },
  amber:   { tile: 'bg-amber-50 text-amber-700 border-amber-200',    eyebrow: 'text-amber-700', solid: 'bg-amber-600' },
  gray:    { tile: 'bg-tide-subtle text-tide-muted border-tide-border', eyebrow: 'text-tide-muted', solid: 'bg-tide-muted' },
}

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
      <Eyebrow className={accent.eyebrow}>{'Coverage'}</Eyebrow>
      <div className="grid grid-cols-5 gap-2 mt-2">
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
                className={`w-full aspect-square rounded-lg border flex items-center justify-center text-base font-display font-semibold transition-all duration-200 ${
                  has ? accent.tile : 'border-tide-border text-tide-muted/30'
                } ${isActive ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
              >
                {has ? list.length : '–'}
              </div>
              <span className="text-xs font-body text-tide-muted">{grade.replace('GRADE ', 'G')}</span>
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
            <div className="mt-3 px-3 py-2.5 rounded-xl bg-tide-subtle text-sm font-body text-tide-muted">
              <span className="font-semibold text-tide-text">{active.grade.replace('GRADE ', 'Grade ')}</span>
              {' — '}{active.list.join(', ')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function AblDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { allResources, loading, error } = useABLData()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const [expandedGrade, setExpandedGrade] = useState(null)

  const backLink = (
    <Link
      to="/resources/abl-resources/resource-center"
      className="inline-flex items-center gap-2 text-sm font-body font-medium text-tide-muted hover:text-primary transition-colors mb-8"
    >
      <ArrowLeft className="w-4 h-4" /> {t('abl.detail.back', 'Back to Resource Center')}
    </Link>
  )

  const resource = allResources.find(r => r.id === id)

  if (loading) {
    return (
      <>
        <PageHero badge="Resources · ABL" title={t('abl.resourceCenter.loading', 'Loading…')} />
        <AblNavBar />
        <section className="section-padding bg-tide-bg">
          <div className="max-w-5xl mx-auto">
            {backLink}
            <div className="animate-pulse grid md:grid-cols-5 gap-10">
              <div className="md:col-span-2 max-w-[280px] aspect-[3/4] bg-tide-subtle rounded-2xl" />
              <div className="md:col-span-3 space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-4 bg-tide-subtle rounded w-3/4" />
                ))}
              </div>
            </div>
          </div>
        </section>
      </>
    )
  }

  if (error || !resource) {
    return (
      <>
        <PageHero badge="Resources · ABL" title={t('abl.detail.notFound', 'Resource Not Found')} />
        <AblNavBar />
        <section className="section-padding bg-tide-bg">
          <div className="max-w-5xl mx-auto text-center py-10">
            <BookOpen className="w-12 h-12 text-tide-muted/40 mx-auto mb-4" />
            <p className="font-body text-tide-muted mb-6">
              {error ?? `No resource found with ID "${id}".`}
            </p>
            {backLink}
          </div>
        </section>
      </>
    )
  }

  const languages       = resource.language?.split(',').map(l => l.trim()).filter(Boolean) ?? []
  const videoPreviewUrl = getDrivePreviewUrl(resource.videoUrl)
  const style           = TAB_STYLE_MAP[resource.type] ?? TAB_STYLE_MAP._default
  const accent          = ACCENT_MAP[style.color] ?? ACCENT_MAP.gray
  const hasActions      = Boolean(resource.photoUrl || resource.referenceLink)
  const hasCoverage     = GRADES.some(g => (resource.chapters?.[g]?.length ?? 0) > 0)

  return (
    <>
      <PageHero badge={`Resources · ${resource.type}`} title={resource.name} />
      <AblNavBar />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            {backLink}

            <div className="grid md:grid-cols-5 gap-10">

              {/* Left — media plate */}
              <div className="md:col-span-2">
                <div className="max-w-[280px]">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-tide-border shadow-card">
                    <DriveImage id={resource.id} alt={resource.name} variant="full" />

                    <button
                      type="button"
                      onClick={() => resource.photoUrl && setLightboxOpen(true)}
                      disabled={!resource.photoUrl}
                      className={`group/img absolute inset-0 w-full h-full ${resource.photoUrl ? 'cursor-zoom-in' : 'cursor-default'}`}
                      aria-label="View full image"
                    >
                      {resource.photoUrl && (
                        <>
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/15 transition-colors duration-300" />
                          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-xs font-body font-medium">
                            <Expand className="w-3.5 h-3.5" /> {t('abl.detail.viewLarger', 'Tap to view larger')}
                          </div>
                        </>
                      )}
                    </button>

                  </div>

                  {hasActions && (
                    <div className="flex gap-3 mt-4 flex-wrap">
                      {resource.photoUrl && (
                        <Button href={resource.photoUrl} external variant="accent">
                          {t('abl.detail.openFull', 'Full Preview')} <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      {resource.referenceLink && (
                        <Button href={resource.referenceLink} external variant="secondary">
                          {t('abl.detail.sourceRef', 'Source Reference')}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right — one consolidated fact sheet */}
              <motion.div
                className="md:col-span-3 bg-white rounded-2xl border border-tide-border p-6 space-y-5"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
              >
                {(resource.concept || videoPreviewUrl) && (
                  <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {resource.concept && (
                      <div className="flex-1 min-w-0">
                        <Eyebrow className={accent.eyebrow}>{t('abl.detail.concept', 'Concept')}</Eyebrow>
                        <p className="font-display text-2xl font-semibold text-tide-text mt-1">{resource.concept}</p>
                      </div>
                    )}

                    {videoPreviewUrl && (
                      <div className="w-full sm:w-64 flex-shrink-0">
                        <Eyebrow className="text-tide-muted mb-1.5">{t('abl.detail.explanationVideo', 'Explanation Video')}</Eyebrow>
                        <motion.div
                          className="group/video relative aspect-video rounded-xl overflow-hidden border-2 border-primary/25 shadow-card cursor-pointer"
                          whileHover={{ scale: 1.06, y: -4, boxShadow: '0 20px 40px -8px rgba(30,107,170,0.45)' }}
                          transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                        >
                          <iframe
                            src={videoPreviewUrl}
                            title={t('abl.detail.explanationVideo', 'Explanation Video')}
                            className="absolute inset-0 w-full h-full"
                            frameBorder="0"
                          />
                          <button
                            type="button"
                            onClick={() => setVideoOpen(true)}
                            aria-label={t('abl.detail.playVideo', 'Play explanation video')}
                            className="absolute inset-0 w-full h-full flex items-center justify-center bg-primary/0 group-hover/video:bg-primary/25 transition-colors duration-300"
                          >
                            {/* Always-visible subtle badge, replaced by a larger button on hover */}
                            <span className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center opacity-100 group-hover/video:opacity-0 transition-opacity duration-200">
                              <Play className="w-3 h-3 text-white fill-white translate-x-px" />
                            </span>
                            <span className="opacity-0 group-hover/video:opacity-100 scale-75 group-hover/video:scale-100 transition-all duration-300 w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-xl">
                              <Play className="w-5 h-5 text-primary fill-primary translate-x-px" />
                            </span>
                          </button>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                )}

                {(languages.length > 0 || resource.ownership) && (
                  <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
                    {languages.map(l => (
                      <span key={l} className="inline-block px-3 py-1 text-sm font-semibold rounded-full border bg-tide-subtle text-tide-muted border-tide-border">
                        {l}
                      </span>
                    ))}
                    {resource.ownership && (
                      <span className="inline-flex items-center gap-1.5 text-sm font-body text-tide-muted">
                        <span className={`w-1.5 h-1.5 rounded-full ${resource.ownership === 'TIDE' ? 'bg-primary' : 'bg-tide-muted'}`} />
                        {resource.ownership === 'TIDE' ? t('abl.resourceCard.tideResource', 'TIDE Resource') : t('abl.resourceCard.externalResource', 'External Resource')}
                      </span>
                    )}
                  </motion.div>
                )}

                {hasCoverage && (
                  <motion.div variants={fadeUp}><div className="h-px bg-tide-border" /></motion.div>
                )}

                <CoverageMatrix
                  chapters={resource.chapters ?? {}}
                  accent={accent}
                  expanded={expandedGrade}
                  onToggle={setExpandedGrade}
                />

                {(resource.storageLocation || resource.quantity) && (
                  <motion.div variants={fadeUp} className="flex flex-wrap gap-6 pt-1">
                    {resource.storageLocation && (
                      <div className="flex items-center gap-2 text-sm font-body text-tide-muted">
                        <MapPin className="w-4 h-4 text-tide-muted/60" /> {resource.storageLocation}
                      </div>
                    )}
                    {resource.quantity && (
                      <div className="flex items-center gap-2 text-sm font-body text-tide-muted">
                        <Layers className="w-4 h-4 text-tide-muted/60" /> {resource.quantity} set(s)
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </div>

            {resource.description && (
              <div className="mt-12 pt-8 border-t border-tide-border">
                <Eyebrow className="text-tide-muted mb-3">{t('abl.detail.about', 'About This Resource')}</Eyebrow>
                <p className="text-tide-text font-body leading-relaxed max-w-3xl">{resource.description}</p>
              </div>
            )}
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
        title={t('abl.detail.explanationVideo', 'Explanation Video')}
        onClose={() => setVideoOpen(false)}
      />
    </>
  )
}
