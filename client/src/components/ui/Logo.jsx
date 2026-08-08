import { Link } from 'react-router-dom'
import logoImg from '../../assets/logo.png'

export default function Logo({
  size = 'md',
  showText = true,
  textColor = 'text-gray-900',
  to = '/',
  className = '',
  iconOnly = false,
}) {
  const sizeMap = {
    xs: { img: 'w-6 h-6', text: 'text-base' },
    sm: { img: 'w-8 h-8', text: 'text-base font-bold' },
    md: { img: 'w-10 h-10', text: 'text-lg font-bold' },
    lg: { img: 'w-12 h-12', text: 'text-xl font-extrabold' },
    xl: { img: 'w-16 h-16', text: 'text-2xl font-extrabold' },
    '2xl': { img: 'w-20 h-20', text: 'text-3xl font-extrabold' },
  }

  const currentSize = sizeMap[size] || sizeMap.md

  const content = (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <img
        src={logoImg}
        alt="SaharaFund Logo"
        className={`${currentSize.img} object-contain flex-shrink-0 transition-transform duration-200 hover:scale-105`}
      />
      {!iconOnly && showText && (
        <span className={`tracking-tight leading-none ${currentSize.text} ${textColor}`}>
          Sahara<span className="text-emerald-700">Fund</span>
        </span>
      )}
    </div>
  )

  if (!to) return content

  return (
    <Link to={to} className="inline-flex items-center group" aria-label="SaharaFund Home">
      {content}
    </Link>
  )
}
