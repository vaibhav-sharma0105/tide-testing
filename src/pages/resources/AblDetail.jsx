import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlayCircle, ExternalLink, ArrowLeft, BookOpen, Expand } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PageHero from '../../components/ui/PageHero'
import AblNavBar from '../../components/abl/AblNavBar'
import ResourceTypeBadge from '../../components/abl/ResourceTypeBadge'
import DriveImage from '../../components/abl/DriveImage'
import ImageLightbox from '../../components/abl/ImageLightbox'
import { useABLData } from '../../hooks/useABLData'
import { getDrivePreviewUrl } from '../../utils/driveUtils'

function MetaField({ label, value, children }) {
  if (value == null && !children) return null
  return (
    <div>
      <dt className="text-xs font-body font-semibold uppercase tracking-widest text-tide-muted mb-1">{label}</dt>
      <dd className="text-sm font-body text-tide-text">{children ?? value}</dd>
    </div>
  )
}

function GradeChip({ grade }) {
  return (
    <span className="bg-primary-light text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20 mr-1 mb-1 inline-block">
      {grade}
    </span>
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
        <PageHero badge="Resources · ABL" title={t('abl.resourceCenter.loading', 'Loading…')} gradient />
        <AblNavBar />
        <section className="section-padding bg-tide-bg">
          <div className="max-w-5xl mx-auto">
            {backLink}
            <div className="animate-pulse grid md:grid-cols-5 gap-10">
              <div className="md:col-span-3 aspect-[4/3] bg-tide-subtle rounded-2xl" />
              <div className="md:col-span-2 space-y-4">
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
        <PageHero badge="Resources · ABL" title={t('abl.detail.notFound', 'Resource Not Found')} gradient />
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

  const languages        = resource.language?.split(',').map(l => l.trim()).filter(Boolean) ?? []
  const videoPreviewUrl  = getDrivePreviewUrl(resource.videoUrl)
  const chaptersWithData = Object.entries(resource.chapters ?? {}).filter(([, chs]) => chs.length > 0)

  return (
    <>
      <PageHero badge={`Resources · ${resource.type}`} title={resource.name} gradient />
      <AblNavBar />

      <section className="section-padding bg-tide-bg">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            {backLink}

            <div className="grid md:grid-cols-5 gap-10">

              {/* Left — media */}
              <div className="md:col-span-3">

                {/* Clickable image → lightbox */}
                <button
                  type="button"
                  onClick={() => resource.photoUrl && setLightboxOpen(true)}
                  className={`group/img relative block w-full rounded-2xl overflow-hidden border border-tide-border ${resource.photoUrl ? 'cursor-zoom-in' : 'cursor-default'}`}
                  aria-label="View full image"
                  disabled={!resource.photoUrl}
                >
                  <DriveImage url={resource.photoUrl} alt={resource.name} width={1200} />

                  {/* Hover overlay */}
                  {resource.photoUrl && (
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/0 group-hover/img:bg-white/85 flex items-center justify-center transition-all duration-250 scale-75 group-hover/img:scale-100 shadow-xl">
                        <Expand className="w-5 h-5 text-tide-text opacity-0 group-hover/img:opacity-90 transition-opacity duration-200" />
                      </div>
                    </div>
                  )}
                </button>

                <div className="flex gap-3 mt-5 flex-wrap">
                  {videoPreviewUrl && (
                    <a
                      href={videoPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-white text-sm font-body font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" /> {t('abl.detail.watchVideo', 'Watch Video')}
                    </a>
                  )}
                  {resource.canvaUrl && (
                    <a
                      href={resource.canvaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-tide-border text-tide-text text-sm font-body font-semibold hover:border-primary hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> {t('abl.detail.viewCanva', 'View in Canva')}
                    </a>
                  )}
                  {resource.referenceLink && (
                    <a
                      href={resource.referenceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-tide-border text-tide-text text-sm font-body font-semibold hover:border-primary hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> {t('abl.detail.sourceRef', 'Source Reference')}
                    </a>
                  )}
                </div>
              </div>

              {/* Right — metadata */}
              <div className="md:col-span-2">
                <dl className="space-y-5">
                  <div><ResourceTypeBadge type={resource.type} /></div>

                  <MetaField label={t('abl.detail.concept', 'Concept')} value={resource.concept} />

                  {languages.length > 0 && (
                    <div>
                      <dt className="text-xs font-body font-semibold uppercase tracking-widest text-tide-muted mb-1">{t('abl.detail.language', 'Language')}</dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {languages.map(l => (
                          <span key={l} className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-tide-subtle text-tide-muted border-tide-border">
                            {l}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}

                  {resource.grades?.length > 0 && (
                    <div>
                      <dt className="text-xs font-body font-semibold uppercase tracking-widest text-tide-muted mb-1">{t('abl.detail.grades', 'Grades')}</dt>
                      <dd className="flex flex-wrap">
                        {resource.grades.map(g => <GradeChip key={g} grade={g} />)}
                      </dd>
                    </div>
                  )}

                  {chaptersWithData.map(([grade, chs]) => (
                    <details key={grade} className="border border-tide-border rounded-xl px-4 py-3">
                      <summary className="font-body text-sm font-semibold text-tide-text cursor-pointer list-none flex items-center justify-between">
                        {grade} — Chapters
                        <span className="text-tide-muted text-xs font-normal">({chs.length})</span>
                      </summary>
                      <p className="text-sm text-tide-muted mt-2 leading-relaxed">{chs.join(', ')}</p>
                    </details>
                  ))}

                  <MetaField label={t('abl.detail.ownership', 'Ownership')} value={resource.ownership ?? '—'} />

                  {resource.storageLocation && (
                    <p className="text-xs text-tide-muted">Storage: {resource.storageLocation}</p>
                  )}
                  {resource.quantity && (
                    <p className="text-xs text-tide-muted">Quantity: {resource.quantity} set(s)</p>
                  )}
                  <p className="text-xs text-tide-muted font-mono">ID: {resource.id}</p>
                </dl>
              </div>
            </div>

            {resource.description && (
              <div className="mt-10 bg-white rounded-2xl p-8 border border-tide-border">
                <h3 className="font-display text-xl font-semibold text-tide-text mb-4">About This Resource</h3>
                <p className="text-tide-muted font-body leading-relaxed">{resource.description}</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <ImageLightbox
        photoUrl={lightboxOpen ? resource.photoUrl : null}
        alt={resource.name}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  )
}
