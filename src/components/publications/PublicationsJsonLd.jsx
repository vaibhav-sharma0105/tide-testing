import { Helmet } from 'react-helmet-async'
import site from '../../data/site.json'
import { publicationsJsonLd } from '../../utils/publicationFilters'

// schema.org ItemList of a Publications page's rows, added to <head> through react-helmet-async
// the same way SeoHead adds the BreadcrumbList. Facts only: name, date and link from the Sheet.
export default function PublicationsJsonLd({ rows, name, path }) {
  if (!rows.length) return null
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(publicationsJsonLd(rows, { name, url: `${site.url}${path}` }))}</script>
    </Helmet>
  )
}
