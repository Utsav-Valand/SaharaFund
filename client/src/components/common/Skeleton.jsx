/**
 * Skeleton loader components for different UI patterns
 */

export function SkeletonCampaignCard() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-2 bg-gray-200 rounded-full w-full mt-2" />
        <div className="flex justify-between">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonCampaignGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCampaignCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonCampaignDetail() {
  return (
    <div className="animate-pulse">
      <div className="w-full h-72 bg-gray-200 rounded-2xl mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-4/5" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="space-y-2 mt-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`h-4 bg-gray-200 rounded ${i === 5 ? 'w-2/3' : 'w-full'}`} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-5 space-y-3">
            <div className="h-8 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-200 rounded-full w-full" />
            <div className="h-10 bg-gray-200 rounded-xl" />
            <div className="h-10 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonDashboardStat() {
  return (
    <div className="stat-card animate-pulse">
      <div className="stat-icon bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-6 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  )
}

export function SkeletonTableRow({ cols = 4 }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5 border-b border-gray-50">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-200 rounded ${i === lines - 1 ? 'w-3/5' : 'w-full'}`}
        />
      ))}
    </div>
  )
}
