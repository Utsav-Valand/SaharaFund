import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import PublicLayout from '../components/layout/PublicLayout'
import CampaignCard from '../components/campaign/CampaignCard'
import { SkeletonCampaignGrid } from '../components/common/Skeleton'
import { EmptyState, ErrorState } from '../components/common/StateComponents'
import Pagination from '../components/common/Pagination'
import { campaignService } from '../services/campaignService'
import { CATEGORIES, INDIAN_STATES } from '../utils/helpers'
import { Link } from 'react-router-dom'
import { PlusCircle, Megaphone } from 'lucide-react'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'trending', label: 'Most Funded' },
  { value: 'ending_soon', label: 'Ending Soon' },
  { value: 'goal_amount_asc', label: 'Smallest Goal' },
  { value: 'goal_amount_desc', label: 'Largest Goal' },
]

export default function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Derive filter state from URL params
  const currentPage = parseInt(searchParams.get('page') || '1')
  const searchQuery = searchParams.get('q') || ''
  const selectedCategory = searchParams.get('category') || ''
  const selectedState = searchParams.get('state') || ''
  const sortBy = searchParams.get('sort') || 'newest'

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    if (key !== 'page') params.delete('page') // Reset page on filter change
    setSearchParams(params)
  }

  const clearAllFilters = () => {
    setSearchParams({})
  }

  const hasActiveFilters = searchQuery || selectedCategory || selectedState || sortBy !== 'newest'

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await campaignService.getCampaigns({
        status: 'LIVE',
        page: currentPage,
        limit: 12,
        q: searchQuery,
        category: selectedCategory,
        state: selectedState,
        sort: sortBy,
      })
      setCampaigns(data.campaigns || [])
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.total || 0)
    } catch (err) {
      setError(err.message || 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, selectedCategory, selectedState, sortBy])

  useEffect(() => {
    fetchCampaigns()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [fetchCampaigns])

  const [localSearch, setLocalSearch] = useState(searchQuery)
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateParam('q', localSearch.trim())
  }

  return (
    <PublicLayout>
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100 py-8">
        <div className="container-xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Fundraisers</h1>
          <p className="text-gray-500">
            {loading ? 'Loading campaigns...' : `${totalCount.toLocaleString()} active campaigns across India`}
          </p>
        </div>
      </div>

      <div className="container-xl py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className={`lg:w-64 flex-shrink-0 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="card p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-sm">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={clearAllFilters} className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                    Clear All
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="mb-5">
                <label className="label">Category</label>
                <div className="space-y-1">
                  <button
                    onClick={() => updateParam('category', '')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedCategory ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    All Categories
                  </button>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => updateParam('category', cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2.5 ${selectedCategory === cat.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <img src={cat.icon} alt="" className="w-5 h-5 object-contain" />
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* State Filter */}
              <div>
                <label htmlFor="state-filter" className="label">State</label>
                <select
                  id="state-filter"
                  value={selectedState}
                  onChange={(e) => updateParam('state', e.target.value)}
                  className="select text-sm"
                >
                  <option value="">All States</option>
                  {INDIAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search + Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search fundraisers..."
                  className="input pl-9 pr-4"
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => { setLocalSearch(''); updateParam('q', '') }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  className="select text-sm min-w-40"
                  aria-label="Sort campaigns"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="btn-secondary btn-sm lg:hidden gap-2"
                  aria-expanded={filtersOpen}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary-600" />}
                </button>
              </div>
            </div>

            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {searchQuery && (
                  <span className="badge-gray gap-1.5">
                    Search: "{searchQuery}"
                    <button onClick={() => { setLocalSearch(''); updateParam('q', '') }} aria-label="Remove search filter">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="badge-primary gap-1.5">
                    {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                    <button onClick={() => updateParam('category', '')} aria-label="Remove category filter">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedState && (
                  <span className="badge-primary gap-1.5">
                    {selectedState}
                    <button onClick={() => updateParam('state', '')} aria-label="Remove state filter">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Results */}
            {loading ? (
              <SkeletonCampaignGrid count={12} />
            ) : error ? (
              <ErrorState message={error} onRetry={fetchCampaigns} />
            ) : campaigns.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="No fundraisers found"
                description={hasActiveFilters ? 'Try adjusting your filters or search term.' : 'No campaigns are live yet. Be the first to start one!'}
                action={
                  <div className="flex gap-3">
                    {hasActiveFilters && (
                      <button onClick={clearAllFilters} className="btn-secondary btn-sm">Clear Filters</button>
                    )}
                    <Link to="/create" className="btn-accent btn-sm gap-2">
                      <PlusCircle className="w-4 h-4" />
                      Start a Fundraiser
                    </Link>
                  </div>
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {campaigns.map(c => (
                    <CampaignCard key={c._id} campaign={c} />
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(p) => updateParam('page', p)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
