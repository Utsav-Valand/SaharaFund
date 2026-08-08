import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'
import PublicLayout from '../components/layout/PublicLayout'

export default function NotFoundPage() {
  return (
    <PublicLayout>
      <div className="section">
        <div className="container-md text-center">
          <div className="text-8xl md:text-9xl font-extrabold text-gray-100 mb-4 tabular-nums">404</div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Page not found</h1>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            We couldn't find the page you're looking for. It may have been moved, deleted, or the URL might be incorrect.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/" className="btn-primary gap-2">
              <Home className="w-4 h-4" /> Back to Home
            </Link>
            <Link to="/discover" className="btn-secondary gap-2">
              <Search className="w-4 h-4" /> Discover Fundraisers
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
