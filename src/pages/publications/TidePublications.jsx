import { useMemo } from 'react'
import SeoHead from '../../components/ui/SeoHead'
import { PublicationsHero, PublicationsEmpty } from '../../components/publications/PublicationsHero'
import TideCollection from '../../components/publications/TideCollection'
import PublicationsJsonLd from '../../components/publications/PublicationsJsonLd'
import { PUBLICATION_PAGES } from '../../config/publications'
import { applyPublicationFilters, rowsForOrg } from '../../utils/publicationFilters'
import snapshot from '../../data/sheets/publications.json'
import data from '../../data/tide-publications.json'
import site from '../../data/site.json'

// /tide/publications — TIDE's publications (Sheet rows answered "TIDE"): the latest annual report
// spotlighted, then one filterable library (see components/publications/TideCollection). Rows from the Publications snapshot.
// No year chart in the banner (config HERO_CHART.TIDE: too few rows per year to say anything).
export default function TidePublications() {
  const rows = useMemo(() => rowsForOrg(snapshot.resources, 'TIDE'), [])
  const ordered = useMemo(() => applyPublicationFilters(rows, {}), [rows])
  const { path } = PUBLICATION_PAGES.TIDE
  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path={path}
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: site.breadcrumbs.aboutUs },
          { name: data.meta.breadcrumbName, path },
        ]}
      />
      <PublicationsJsonLd rows={ordered} name={data.meta.title} path={path} />
      <PublicationsHero data={data} rows={rows} />
      {rows.length === 0 ? <PublicationsEmpty meta={data.meta} /> : <TideCollection rows={rows} data={data} />}
    </>
  )
}
