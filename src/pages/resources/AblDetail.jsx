import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, Expand, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PageHero from '../../components/ui/PageHero'
import AblNavBar from '../../components/abl/AblNavBar'
import Button from '../../components/ui/Button'
import DriveImage from '../../components/abl/DriveImage'
import ImageLightbox from '../../components/abl/ImageLightbox'
import { useABLData } from '../../hooks/useABLData'
import { getDrivePreviewUrl } from '../../utils/driveUtils'
import { TAB_STYLE_MAP } from '../../config/abl'

const GRADES = ['GRADE 1', 'GRADE 2', 'GRADE 3', 'GRADE 4', 'GRADE 5']

const ACCENT_MAP = {
  blue:    { tile: 'bg-blue-50 text-blue-700 border-blue-200',       eyebrow: 'text-blue-700' },
  emerald: { tile: 'bg-emerald-50 text-emerald-700 border-emerald-200', eyebrow: 'text-emerald-700' },
  violet:  { tile: 'bg-violet-50 text-violet-700 border-violet-200',  eyebrow: 'text-violet-700' },
  amber:   { tile: 'bg-amber-50 text-amber-700 border-amber-200',    eyebrow: 'text-amber-700' },
  gray:    { tile: 'bg-tide-subtle text-tide-muted border-tide-border', eyebrow: 'text-tide-muted' },
}

function Eyebrow({ children, className = '' }) {
  return (
    <p className={`text-xs font-body font-semibold uppercase tracking-widest ${className}`}>
      {children}
    </p>
  )
}

/* Glanceable grade × chapter-count grid — the one piece of data unique to
   this content type (which grades + how many chapters each one touches). */
function CoverageMatrix({ chapters, accent }) {
  const detailRows = GRADES
    .map(g => ({ grade: g, list: chapters[g] ?? [] }))
    .filter(row => row.list.length > 0)

  if (detailRows.length === 0) return null

  return (
    <div>
      <Eyebrow className={accent.eyebrow}>Coverage</Eyebrow>
      <div className="grid grid-cols-5 gap-2 mt-2">
        {GRADES.map(g => {
          const count = chapters[g]?.length ?? 0
          const has   = count > 0
          return (
            <div key={g} className="flex flex-col items-center gap-1.5">
              <div className={`w-full aspect-square rounded-lg border flex items-center justify-center text-base font-display font-semibold ${has ? accent.tile : 'border-tide-border text-tide-muted/30'}`}>
                {has ? count : '–'}
              </div>
              <span className="text-xs font-body text-tide-muted">{g.replace('GRADE ', 'G')}</span>
            </div>
          )
        })}
      </div>
      <ul className="mt-3 space-y-1">
        {detailRows.map(({ grade, list }) => (
          <li key={grade} className="text-sm font-body text-tide-muted">
            <span className="font-semibold text-tide-text">{grade.replace('GRADE ', 'Grade ')}</span>
            {' — '}{list.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AblDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { allResources, loading, error } = useABLData()
  const [lightboxOpen, setLightboxOpen] = useState(false)

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
  const hasCoverage     = GRADES.some(g => (resource.chapters?.[g]?.length ?? 0) > 0)
  const hasInfoCard     = Boolean(resource.concept || languages.length > 0 || resource.ownership)
  const hasActions      = Boolean(resource.photoUrl || resource.referenceLink)

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
                  <button
                    type="button"
                    onClick={() => resource.photoUrl && setLightboxOpen(true)}
                    className={`group/img relative block w-full rounded-2xl overflow-hidden border border-tide-border shadow-card ${resource.photoUrl ? 'cursor-zoom-in' : 'cursor-default'}`}
                    aria-label="View full image"
                    disabled={!resource.photoUrl}
                  >
                    <DriveImage id={resource.id} alt={resource.name} variant="full" />
                    {resource.photoUrl && (
                      <>
                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/15 transition-colors duration-300" />
                        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-xs font-body font-medium">
                          <Expand className="w-3.5 h-3.5" /> {t('abl.detail.viewLarger', 'Tap to view larger')}
                        </div>
                      </>
                    )}
                  </button>

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

              {/* Right — facts rail */}
              <div className="md:col-span-3 space-y-6">
                {videoPreviewUrl && (
                  <div>
                    <Eyebrow className={`mb-2 ${accent.eyebrow}`}>
                      {t('abl.detail.explanationVideo', 'Explanation Video')}
                    </Eyebrow>
                    <div
                      className="relative rounded-2xl overflow-hidden border border-tide-border shadow-card"
                      style={{ paddingBottom: '56.25%', height: 0 }}
                    >
                      <iframe
                        src={videoPreviewUrl}
                        title={t('abl.detail.explanationVideo', 'Explanation Video')}
                        className="absolute inset-0 w-full h-full"
                        frameBorder="0"
                        allow="autoplay"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {hasInfoCard && (
                  <div className="bg-white rounded-2xl border border-tide-border p-5 space-y-4">
                    {resource.concept && (
                      <div>
                        <Eyebrow className={accent.eyebrow}>{t('abl.detail.concept', 'Concept')}</Eyebrow>
                        <p className="font-display text-xl font-semibold text-tide-text mt-1">{resource.concept}</p>
                      </div>
                    )}

                    {languages.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {languages.map(l => (
                          <span key={l} className="inline-block px-3 py-1 text-sm font-semibold rounded-full border bg-tide-subtle text-tide-muted border-tide-border">
                            {l}
                          </span>
                        ))}
                      </div>
                    )}

                    {resource.ownership && (
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${resource.ownership === 'TIDE' ? 'bg-primary' : 'bg-tide-muted'}`} />
                        <span className="text-sm font-body text-tide-muted">
                          {resource.ownership === 'TIDE' ? t('abl.resourceCard.tideResource', 'TIDE Resource') : t('abl.resourceCard.externalResource', 'External Resource')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {hasCoverage && <div className="h-px bg-tide-border" />}

                <CoverageMatrix chapters={resource.chapters ?? {}} accent={accent} />

                {(resource.storageLocation || resource.quantity) && (
                  <div className="h-px bg-tide-border" />
                )}

                {resource.storageLocation && (
                  <p className="text-sm text-tide-muted">Storage: {resource.storageLocation}</p>
                )}
                {resource.quantity && (
                  <p className="text-sm text-tide-muted">Quantity: {resource.quantity} set(s)</p>
                )}
              </div>
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
    </>
  )
}
