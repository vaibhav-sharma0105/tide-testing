import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SeoHead from '../../components/ui/SeoHead'
import { PublicationsHero, PublicationsEmpty } from '../../components/publications/PublicationsHero'
import ResearchArchive from '../../components/publications/ResearchArchive'
import YearChart from '../../components/publications/YearChart'
import PublicationsJsonLd from '../../components/publications/PublicationsJsonLd'
import { HERO_CHART, PUBLICATION_PAGES } from '../../config/publications'
import {
  applyPublicationFilters, parsePublicationParams, publicationParamsToSearch, rowsForOrg, yearCounts,
} from '../../utils/publicationFilters'
import snapshot from '../../data/sheets/publications.json'
import data from '../../data/thrive-publications.json'
import site from '../../data/site.json'

// /thrive/publications — the THRIvE Research Centre's publications (Sheet rows answered
// "THRIvE"), laid out as a research archive (see components/publications/ResearchArchive).
// The banner's "publications per year" chart filters the archive by year (?year=), then the
// archive scrolls to and focuses its results line.
export default function ThrivePublications() {
  const rows = useMemo(() => rowsForOrg(snapshot.resources, 'THRIvE'), [])
  const ordered = useMemo(() => applyPublicationFilters(rows, {}), [rows])
  const counts = useMemo(() => yearCounts(rows), [rows])
  const location = useLocation()
  const navigate = useNavigate()
  const params = parsePublicationParams(location.search)
  const { path } = PUBLICATION_PAGES.THRIvE
  const noun = (n) => (n === 1 ? data.results.publicationSingular : data.results.publicationPlural)
  const selectYear = (year) => navigate(
    { search: publicationParamsToSearch({ ...params, year, page: 1 }) },
    { replace: true, state: { focusResults: true } },
  )
  const chart = HERO_CHART.THRIvE && counts.length > 1
    ? <YearChart counts={counts} selected={params.year} onSelect={selectYear} labels={data.chart} noun={noun} />
    : null

  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path={path}
        breadcrumbs={[
          { name: site.breadcrumbs.home, path: '/' },
          { name: site.breadcrumbs.thrive, path: '/thrive' },
          { name: data.meta.breadcrumbName, path },
        ]}
      />
      <PublicationsJsonLd rows={ordered} name={data.meta.title} path={path} />
      <PublicationsHero data={data} rows={rows} chart={chart} />
      {rows.length === 0 ? <PublicationsEmpty meta={data.meta} /> : <ResearchArchive rows={rows} data={data} />}
    </>
  )
}
