import { AlertCircle, RefreshCw } from 'lucide-react'

/**
 * EmptyState — shown when a list has no items
 */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        {Icon ? <Icon className="w-8 h-8 text-gray-400" /> : (
          <span className="text-3xl">📭</span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-xs mb-6">{description}</p>}
      {action && action}
    </div>
  )
}

/**
 * ErrorState — shown when an API call fails
 */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-danger-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-danger-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Something went wrong</h3>
      <p className="text-sm text-gray-500 max-w-xs mb-6">
        {message || 'Unable to load data. Please try again.'}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary btn-sm gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  )
}

/**
 * InlineError — compact error message
 */
export function InlineError({ message }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-danger-50 border border-danger-100 text-danger-700 text-sm">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}
