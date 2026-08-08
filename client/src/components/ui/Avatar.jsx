import { getInitials } from '../../utils/helpers'

const SIZES = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-9 h-9 text-sm',
  md: 'w-11 h-11 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
}

const COLORS = [
  'bg-teal-600 text-white',
  'bg-blue-600 text-white',
  'bg-purple-600 text-white',
  'bg-rose-600 text-white',
  'bg-amber-600 text-white',
  'bg-emerald-600 text-white',
  'bg-indigo-600 text-white',
]

function getColorFromName(name) {
  if (!name) return COLORS[0]
  const idx = name.charCodeAt(0) % COLORS.length
  return COLORS[idx]
}

export default function Avatar({ name, src, size = 'md', className = '' }) {
  const sizeClass = SIZES[size] || SIZES.md
  const colorClass = getColorFromName(name)

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center font-bold flex-shrink-0 select-none ${className}`}
      aria-label={name}
      title={name}
    >
      {getInitials(name)}
    </div>
  )
}
