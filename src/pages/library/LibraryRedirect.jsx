import { Navigate, useLocation, useParams } from 'react-router-dom'

// /pramaan-library was the library's first (unlinked) address; it now lives at /pramaan/resource-centre.
// Keep old links working: same resource id, same filters in the query string.
export default function LibraryRedirect() {
  const { id } = useParams()
  const { search } = useLocation()
  const to = id ? `/pramaan/resource-centre/${encodeURIComponent(id)}` : '/pramaan/resource-centre'
  return <Navigate to={`${to}${search}`} replace />
}
