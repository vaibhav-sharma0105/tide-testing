import { useState } from 'react'
import LangText from '../../components/ui/LangText'
import { textLang } from '../../utils/scriptLang'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, BookOpen, Expand, ExternalLink, Play } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import SeoHead from '../../components/ui/SeoHead'
import { libraryResourceJsonLd } from '../../utils/libraryJsonLd'
import PageHero from '../../components/ui/PageHero'
import AblNavBar from '../../components/abl/AblNavBar'
import Button from '../../components/ui/Button'
import DriveImage from '../../components/abl/DriveImage'
import ImageLightbox from '../../components/abl/ImageLightbox'
import VideoLightbox from '../../components/abl/VideoLightbox'
import LibraryTypeBadge from '../../components/library/LibraryTypeBadge'
import { libraryTypeColors } from '../../config/library'
import { getLibraryPhoto } from '../../utils/libraryPhotos'
import { getVideoEmbedUrl } from '../../utils/videoLinks'
import { jsonLdText } from '../../utils/jsonLd'
import { safeHttpUrl } from '../../utils/safeUrl'
import { LIBRARY_GRADES, gradeLabel, linkParts } from '../../utils/libraryFilters'
import { imgSrc } from '../../utils/imgSrc'
import snapshot from '../../data/sheets/pramaan-library.json'
import data from '../../data/pramaan-library.json'
import site from '../../data/site.json'
import TiltGlare from '../../components/ui/TiltGlare'
import { tiltProps } from '../../utils/tilt'
const TILT = tiltProps(5, 4)

const d = data.detail
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k])
const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }
const shortGrade = (g) => g === 'FOUNDATIONAL' ? d.shortFoundational : fill(d.shortGradeTemplate, { n: g.replace('GRADE ', '') })

function Eyebrow({ children, className = '' }) {
  return <p className={`text-xs font-body font-semibold uppercase tracking-widest ${className}`}>{children}</p>
}

// Grade × chapter count; tap a grade to see its chapters. Only grades that name at least one
// chapter are shown (no greyed-out tiles for the others); no such grade → no section at all.
function Coverage({ chapters, accent }) {
  const [open, setOpen] = useState(null)
  const rows = LIBRARY_GRADES.map(g => ({ grade: g, list: chapters?.[g] ?? [] })).filter(r => r.list.length > 0)
  if (rows.length === 0) return null
  const active = rows.find(r => r.grade === open)
  return (
    <div>
      <Eyebrow className={accent.eyebrow}>{d.coverageTitle}</Eyebrow>
      <p className="mt-1 text-xs font-body text-tide-muted">{d.coverageHint}</p>
      <div className="grid grid-cols-6 gap-2 sm:gap-3 mt-3 max-w-xl">
        {rows.map(({ grade, list }) => {
          const isActive = open === grade
          return (
            <button
              key={grade}
              type="button"
              aria-pressed={isActive}
              aria-label={`${gradeLabel(grade)}: ${list.length}`}
              onClick={() => setOpen(isActive ? null : grade)}
              className="flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <span className={`w-full aspect-square rounded-xl border flex items-center justify-center text-base font-display font-semibold transition-all duration-200 ${
                isActive ? `${accent.selectedTile} -translate-y-0.5` : `${accent.badge} hover:-translate-y-0.5 hover:shadow-card`
              }`}
              >
                {list.length}
              </span>
              <span className="text-xs font-body text-tide-muted">{shortGrade(grade)}</span>
            </button>
          )
        })}
      </div>
      <AnimatePresence mode="wait">
        {active && (
          <motion.div key={active.grade} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mt-3 px-4 py-3 rounded-2xl bg-tide-subtle text-sm font-body text-tide-text/80">
              <span className="font-semibold text-tide-text">{gradeLabel(active.grade)}</span>
              {d.chapterSeparator}{active.list.join(', ')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PramaanLibraryDetail() {
  const { id } = useParams()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const resource = (snapshot.resources ?? []).find(r => r.id === id)

  const backLink = (
    <Link to="/pramaan/resource-centre" className="group/back inline-flex min-h-[44px] items-center gap-2 py-2 text-sm font-body font-medium text-tide-muted hover:text-primary-dark transition-colors mb-6">
      <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover/back:-translate-x-1" /> {d.backLabel}
    </Link>
  )

  if (!resource) {
    return (
      <>
        <SeoHead title={d.notFoundSeoTitle} description={data.meta.seoDescription} path={`/pramaan/resource-centre/${encodeURIComponent(id)}`} noindex />
        <PageHero badge={data.meta.badge} title={d.notFoundHeading} />
        <AblNavBar />
        <section className="section-padding bg-tide-bg">
          <div className="max-w-5xl mx-auto text-center py-10">
            <BookOpen className="w-12 h-12 text-tide-muted/40 mx-auto mb-4" />
            <p className="font-body text-tide-muted mb-6">{fill(d.notFoundTemplate, { id })}</p>
            {backLink}
          </div>
        </section>
      </>
    )
  }

  const accent = libraryTypeColors(resource.type)
  const photoFull = getLibraryPhoto(resource.id, 'full')
  const embedUrl = getVideoEmbedUrl(resource.videoUrl)
  // Sheet links: shown only when they are plain http(s) web links (checked again here, after the sync).
  const fileUrl = safeHttpUrl(resource.photoUrl)
  const videoLink = safeHttpUrl(resource.videoUrl)
  const extra = linkParts(resource.additionalInfo)

  return (
    <>
      <SeoHead
        title={fill(d.titleTemplate, { name: resource.name })}
        description={resource.description || data.meta.seoDescription}
        path={`/pramaan/resource-centre/${encodeURIComponent(resource.id)}`}
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: site.breadcrumbs.pramaan, path: '/pramaan' },
          { name: site.breadcrumbs.resourceCentre, path: '/pramaan/resource-centre' },
          { name: resource.name, path: `/pramaan/resource-centre/${encodeURIComponent(resource.id)}` },
        ]}
      />
      <Helmet>
        <script type="application/ld+json">{jsonLdText(libraryResourceJsonLd(resource, {
          url: `${site.url}/pramaan/resource-centre/${encodeURIComponent(resource.id)}`,
          collectionUrl: `${site.url}/pramaan/resource-centre`,
          collectionName: site.breadcrumbs.resourceCentre,
        }))}</script>
      </Helmet>
      <PageHero badge={resource.subject ? `${data.meta.badge} · ${resource.subject}` : data.meta.badge} badgeClassName={accent.heroBadge} title={<LangText text={resource.name} />} />
      <AblNavBar />

      <section className="section-padding bg-gradient-to-b from-tide-bg to-white">
        <div className="max-w-6xl mx-auto">
          {backLink}
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-14">

            {/* Left: the photo (H) and the links to the original file and video (H, I) */}
            <div className="lg:sticky lg:top-[150px]">
              <div className="mx-auto max-w-[320px] lg:mx-0">
                <div className="relative rounded-md bg-white p-2 shadow-[0_14px_36px_rgba(13,33,55,0.16)] ring-1 ring-tide-border">
                  <span className={`absolute left-1/2 -top-2 z-10 h-4 w-4 -translate-x-1/2 rounded-full ${accent.solid} shadow-[0_2px_3px_rgba(0,0,0,0.35)]`} aria-hidden="true" />
                  <div className="relative aspect-[3/4] rounded-sm overflow-hidden">
                    <DriveImage src={photoFull} alt={resource.name} lang={textLang(resource.name)} />
                    {photoFull && (
                      <button type="button" onClick={() => setLightboxOpen(true)} className="group/img absolute inset-0 w-full h-full cursor-zoom-in" aria-label={d.viewFullImageLabel}>
                        <span className="absolute inset-0 bg-black/0 group-hover/img:bg-black/15 transition-colors duration-300" />
                        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy/60 ring-1 ring-white/25 backdrop-blur-sm text-white text-xs font-body font-medium">
                          <Expand className="w-3.5 h-3.5" /> {d.viewLarger}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
                {(fileUrl || (videoLink && !embedUrl)) && (
                  <div className="flex gap-3 mt-5 flex-wrap">
                    {fileUrl && (
                      <Button href={fileUrl} external variant="accent">
                        {d.openFile} <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    {videoLink && !embedUrl && (
                      <Button href={videoLink} external variant="secondary">
                        {d.openVideo} <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: what it is (C, D), who owns it (K), video (I), more links (J), grade alignment */}
            <motion.div className="min-w-0 space-y-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
              <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl border border-tide-border bg-white p-6 shadow-card md:p-8">
                <span className={`absolute inset-x-0 top-0 h-1.5 ${accent.solid}`} aria-hidden="true" />
                <div className="flex flex-col gap-7 md:flex-row md:items-start lg:flex-col lg:items-stretch xl:flex-row xl:items-start">
                  <div className="min-w-0 flex-1 space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <LibraryTypeBadge type={resource.type} className="!px-3.5 !py-1.5 !text-sm" />
                      {resource.language && (
                        <span className="inline-block rounded-full border border-tide-border bg-tide-subtle px-3.5 py-1 text-sm font-semibold text-tide-text/80">{resource.language}</span>
                      )}
                    </div>
                    <dl className="grid gap-4 sm:grid-cols-2">
                      {resource.subject && (
                        <div>
                          <dt><Eyebrow className={accent.eyebrow}>{d.subject}</Eyebrow></dt>
                          <dd className="mt-1 font-body text-tide-text">{resource.subject}</dd>
                        </div>
                      )}
                      {resource.ownership && (
                        <div>
                          <dt><Eyebrow className={accent.eyebrow}>{d.owner}</Eyebrow></dt>
                          <dd className="mt-1 font-body text-tide-text">{resource.ownership}</dd>
                        </div>
                      )}
                    </dl>
                    {resource.concept && (
                      <div>
                        <Eyebrow className={accent.eyebrow}>{d.concept}</Eyebrow>
                        <p className="mt-1.5 font-display text-2xl font-semibold leading-snug text-tide-text">{resource.concept}</p>
                      </div>
                    )}
                  </div>

                  {embedUrl && (
                    <div className="w-full shrink-0 md:w-72 lg:w-full lg:max-w-md xl:w-72">
                      <Eyebrow className={`${accent.eyebrow} mb-3`}>{d.explanationVideo}</Eyebrow>
                      <button
                        type="button"
                        onClick={() => setVideoOpen(true)}
                        aria-label={d.playVideoLabel}
                        aria-haspopup="dialog"
                        {...TILT}
                        className={`tilt-3d tilt-lift group/video relative block aspect-video w-full overflow-hidden rounded-2xl border border-tide-border bg-gradient-to-br ${accent.poster} shadow-card hover:shadow-card-hover`}
                      >
                        <TiltGlare />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <img src={imgSrc(d.videoLogo)} alt="" className="h-24 w-24 opacity-50 mix-blend-multiply" />
                        </span>
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className={`flex h-14 w-14 items-center justify-center rounded-full ${accent.solid} text-white shadow-lg ring-4 ring-white/70 transition-transform duration-300 group-hover/video:scale-110`}>
                            <Play className="h-5 w-5 translate-x-px fill-white" />
                          </span>
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>

              {resource.description && (
                <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl border border-tide-border bg-white p-6 pl-8 shadow-card md:p-8 md:pl-10">
                  <span className={`absolute inset-y-0 left-0 w-1.5 ${accent.solid}`} aria-hidden="true" />
                  <Eyebrow className={`${accent.eyebrow} mb-3`}>{d.about}</Eyebrow>
                  <p className="max-w-3xl font-body leading-relaxed text-tide-text">{resource.description}</p>
                </motion.div>
              )}

              {extra.length > 0 && (
                <motion.div variants={fadeUp} className="rounded-3xl border border-tide-border bg-white p-6 shadow-card md:p-8">
                  <Eyebrow className={`${accent.eyebrow} mb-3`}>{d.additionalInfo}</Eyebrow>
                  <p className="font-body leading-relaxed text-tide-text break-words">
                    {extra.map((part, i) => part.href
                      ? <a key={i} href={part.href} target="_blank" rel="noopener noreferrer" className="text-primary-dark underline underline-offset-2 hover:text-primary-deeper">{part.text}</a>
                      : <span key={i}>{part.text}</span>)}
                  </p>
                </motion.div>
              )}

              <motion.div variants={fadeUp} className="rounded-3xl border border-tide-border bg-white p-6 shadow-card md:p-8 empty:hidden">
                <Coverage chapters={resource.chapters} accent={accent} />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <ImageLightbox id={lightboxOpen ? resource.id : null} src={photoFull} alt={resource.name} onClose={() => setLightboxOpen(false)} />
      <VideoLightbox src={videoOpen ? embedUrl : null} title={d.explanationVideo} onClose={() => setVideoOpen(false)} translucent />
    </>
  )
}
