import { calcProgress } from '../../utils/helpers'

export default function ProgressBar({ raised = 0, goal = 0, showLabel = false, height = 'h-2', className = '' }) {
  const pct = calcProgress(raised, goal)

  return (
    <div className={className}>
      <div className={`progress-bar ${height}`}>
        <div
          className="progress-fill"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${pct}% funded`}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 mt-1">{pct}% funded</p>
      )}
    </div>
  )
}
