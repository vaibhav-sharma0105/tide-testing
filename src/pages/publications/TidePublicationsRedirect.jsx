import { Navigate, useLocation } from 'react-router-dom'
import { PUBLICATION_PAGES } from '../../config/publications'

// /about/publications was the TIDE Publications page's first address; it now lives at
// /tide/publications (to match /thrive/publications). Keep old links and bookmarks working,
// with the same search and filters in the query string.
export default function TidePublicationsRedirect() {
  const { search } = useLocation()
  return <Navigate to={`${PUBLICATION_PAGES.TIDE.path}${search}`} replace />
}
