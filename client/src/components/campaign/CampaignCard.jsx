import { Link } from 'react-router-dom'
import { MapPin, Users, CheckCircle2 } from 'lucide-react'
import { formatCurrency, calcProgress, getCategoryById, campaignStatusConfig } from '../../utils/helpers'
import ProgressBar from '../ui/ProgressBar'
import Avatar from '../ui/Avatar'

export default function CampaignCard({ campaign }) {
  const {
    _id, title, description, coverImage, raisedAmount = 0, goalAmount = 0,
    location, category, organizerId, donorCount = 0, campaignStatus,
    verificationStatus,
  } = campaign

  const cat = getCategoryById(category)
  const pct = calcProgress(raisedAmount, goalAmount)
  const statusCfg = campaignStatusConfig[campaignStatus]

  return (
    <Link
      to={`/campaign/${_id}`}
      className="card-hover flex flex-col group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      aria-label={`View campaign: ${title}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[16/10] bg-gray-100">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <img src={cat.icon} alt={cat.label} className="w-16 h-16 object-contain" />
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`badge text-xs border flex items-center gap-1.5 backdrop-blur-sm ${cat.badgeColor || cat.color}`}>
            <img src={cat.icon} alt="" className="w-3.5 h-3.5 object-contain" />
            <span>{cat.label}</span>
          </span>
        </div>

        {/* Verified Badge */}
        {verificationStatus === 'VERIFIED' && (
          <div className="absolute top-3 right-3">
            <span className="badge bg-white/90 text-primary-700 border border-primary-100 shadow-sm">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Organizer */}
        <div className="flex items-center gap-2 mb-2.5">
          <Avatar
            name={organizerId?.name || 'Anonymous'}
            src={organizerId?.profileImage}
            size="xs"
          />
          <span className="text-xs text-gray-500 truncate">
            by <span className="font-medium text-gray-700">{organizerId?.name || 'Anonymous'}</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-1.5 group-hover:text-primary-700 transition-colors">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">{description}</p>
        )}

        {/* Location */}
        {location && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        )}

        {/* Progress */}
        <ProgressBar raised={raisedAmount} goal={goalAmount} className="mb-2" />

        {/* Stats */}
        <div className="flex items-center justify-between mt-1.5">
          <div>
            <p className="text-base font-bold text-gray-900">{formatCurrency(raisedAmount, true)}</p>
            <p className="text-xs text-gray-400">of {formatCurrency(goalAmount, true)} goal</p>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-primary-700">{pct}%</p>
            <div className="flex items-center gap-1 text-xs text-gray-400 justify-end">
              <Users className="w-3 h-3" />
              <span>{donorCount.toLocaleString()} donors</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
