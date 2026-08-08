import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, Heart, Shield, TrendingUp, Users, CheckCircle,
  Star, Zap, Globe, Lock, PlusCircle, Search
} from 'lucide-react'
import PublicLayout from '../components/layout/PublicLayout'
import CampaignCard from '../components/campaign/CampaignCard'
import { SkeletonCampaignGrid } from '../components/common/Skeleton'
import { EmptyState } from '../components/common/StateComponents'
import { campaignService } from '../services/campaignService'
import { CATEGORIES } from '../utils/helpers'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' }
  }),
}

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: PlusCircle,
    title: 'Create Your Fundraiser',
    desc: 'Fill in your campaign details, tell your story, and set your funding goal in under 10 minutes.',
    color: 'bg-primary-50 text-primary-700',
  },
  {
    step: '02',
    icon: Shield,
    title: 'Verification & Review',
    desc: 'Your campaign goes through identity verification and our safety review to protect donors.',
    color: 'bg-accent-50 text-accent-700',
  },
  {
    step: '03',
    icon: Globe,
    title: 'Go Live & Share',
    desc: 'Once approved, your campaign is live. Share it with your network to start receiving donations.',
    color: 'bg-blue-50 text-blue-700',
  },
  {
    step: '04',
    icon: HandCoins,
    title: 'Receive Funds',
    desc: 'Funds are transferred securely to your verified bank account as your campaign succeeds.',
    color: 'bg-green-50 text-green-700',
  },
]

const TRUST_POINTS = [
  { icon: Shield, title: 'Verified Campaigns', desc: 'Every campaign is reviewed by our team before going live.' },
  { icon: Lock, title: 'Secure Payments', desc: 'End-to-end encrypted payment processing via trusted gateways.' },
  { icon: TrendingUp, title: 'Transparent Reporting', desc: 'Full donation history visible to all donors at all times.' },
  { icon: Users, title: 'Real Beneficiaries', desc: 'Identity verification ensures funds reach genuine people in need.' },
]

// HandCoins not in lucide, use a substitute
function HandCoins(props) {
  return <Heart {...props} />
}

export default function HomePage() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true)
        const data = await campaignService.getCampaigns({
          status: 'LIVE',
          sort: 'trending',
          limit: 6,
        })
        setCampaigns(data.campaigns || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`)
    else navigate('/discover')
  }

  return (
    <PublicLayout>
      {/* ======== HERO SECTION ======== */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #042f2e 0%, #0f766e 45%, #0d9488 75%, #134e4a 100%)' }}>
        {/* Decorative Circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-primary-400/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/3" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)' }} />
        </div>

        <div className="container-xl relative z-10 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/80 text-sm font-medium mb-6"
            >
              <Heart className="w-4 h-4 text-accent-400" fill="currentColor" />
              Trusted by thousands across India
            </motion.div>

            <motion.h1
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-4xl md:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6"
            >
              Fundraising that
              <span className="block" style={{ background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                changes lives
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="text-lg md:text-xl text-white/70 leading-relaxed max-w-xl mx-auto mb-10"
            >
              SaharaFund helps people across India raise money for medical emergencies, education, disaster relief, and genuine needs — safely and transparently.
            </motion.p>

            {/* Search Bar */}
            <motion.form
              variants={fadeUp} initial="hidden" animate="visible" custom={3}
              onSubmit={handleSearch}
              className="flex gap-2 max-w-md mx-auto mb-8"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a cause..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white text-gray-900 placeholder:text-gray-400 border-0 focus:ring-2 focus:ring-accent-400 outline-none"
                />
              </div>
              <button type="submit" className="btn-accent px-5 py-3 text-sm rounded-xl whitespace-nowrap">
                Search
              </button>
            </motion.form>

            {/* CTAs */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={4}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link to="/create" className="btn bg-accent-500 text-white hover:bg-accent-600 btn-lg shadow-lg hover:shadow-xl active:scale-[0.98] gap-2">
                <PlusCircle className="w-5 h-5" />
                Start a Fundraiser
              </Link>
              <Link to="/discover" className="btn glass text-white border-white/20 hover:bg-white/20 btn-lg gap-2">
                Discover Causes
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={5}
              className="flex items-center justify-center gap-8 md:gap-12 mt-14"
            >
              {[
                { label: 'Campaigns', value: '—' },
                { label: 'Donors', value: '—' },
                { label: 'States', value: '28+' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                  <p className="text-xs text-white/50 uppercase tracking-wider mt-0.5">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-12 fill-white">
            <path d="M0,60 C240,0 480,60 720,30 C960,0 1200,60 1440,30 L1440,60 Z" />
          </svg>
        </div>
      </section>

      {/* ======== CATEGORIES ======== */}
      <section className="section bg-white">
        <div className="container-xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
              Explore Causes
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3">
              Choose a category <br className="hidden sm:inline" />
              <span className="text-emerald-800 underline decoration-emerald-500 decoration-2 underline-offset-8">that inspires you</span>
            </h2>
            <p className="text-gray-500 text-sm md:text-base leading-relaxed">
              Discover campaigns across different causes and make a meaningful impact in the areas you care about most.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CATEGORIES.slice(0, 8).map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.35 }}
              >
                <Link
                  to={`/discover?category=${cat.id}`}
                  className={`flex flex-col items-center text-center p-6 rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-1 group min-h-[190px] justify-center ${cat.color}`}
                >
                  <div className="w-16 h-16 mb-3 flex items-center justify-center">
                    <img
                      src={cat.icon}
                      alt={cat.label}
                      className="w-14 h-14 object-contain transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                  <h3 className={`text-base font-bold leading-snug mb-1 ${cat.titleColor}`}>
                    {cat.label}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                    {cat.description}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Bottom inspirational tagline */}
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-xs md:text-sm text-gray-700 shadow-sm">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>
                <strong>Every cause matters. Every donation helps.</strong>{' '}
                <span className="text-emerald-700 font-semibold">Be the reason for someone's hope.</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ======== FEATURED CAMPAIGNS ======== */}
      <section className="section bg-gray-50">
        <div className="container-xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Active Fundraisers</h2>
              <p className="text-gray-500 text-sm">Live campaigns seeking your support right now</p>
            </div>
            <Link to="/discover" className="btn-secondary btn-sm hidden sm:flex gap-1.5">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <SkeletonCampaignGrid count={6} />
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-sm">Unable to load fundraisers. <Link to="/discover" className="text-primary-600 underline">Try again</Link></p>
            </div>
          ) : campaigns.length === 0 ? (
            <EmptyState
              title="No fundraisers are live yet."
              description="Be the first to make a difference — start a campaign today and help your community."
              action={
                <Link to="/create" className="btn-accent gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Start the First Fundraiser
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((c, i) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}
                >
                  <CampaignCard campaign={c} />
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link to="/discover" className="btn-secondary gap-2">
              View All Fundraisers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ======== HOW IT WORKS ======== */}
      <section className="section bg-white" id="how-it-works">
        <div className="container-xl">
          <div className="text-center mb-14">
            <span className="badge-primary mb-3">Simple & Transparent</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-3">How SaharaFund Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Start raising funds in minutes. Our verified process ensures every campaign reaches genuine beneficiaries.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative"
              >
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 right-0 translate-x-1/2 w-full h-0.5 bg-gradient-to-r from-gray-200 to-transparent z-0" />
                )}
                <div className="card p-6 relative z-10">
                  <div className="text-xs font-bold text-gray-300 mb-3">{step.step}</div>
                  <div className={`w-12 h-12 rounded-2xl ${step.color} flex items-center justify-center mb-4`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== TRUST & SAFETY ======== */}
      <section className="section bg-gray-50">
        <div className="container-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="badge-primary mb-4">Trust & Safety</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
                Your donations go where they're meant to
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                We combine advanced fraud detection, human review, and identity verification to ensure every campaign on SaharaFund is legitimate. Donors can give with confidence.
              </p>
              <Link to="/trust-safety" className="btn-primary gap-2">
                Learn About Our Safety Process
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TRUST_POINTS.map((point, i) => (
                <motion.div
                  key={point.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="card p-5"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center mb-3">
                    <point.icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">{point.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{point.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======== CTA BANNER ======== */}
      <section className="section bg-primary-700">
        <div className="container-xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to make a difference?
            </h2>
            <p className="text-primary-200 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of people who are changing lives through the power of community fundraising.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/create" className="btn bg-accent-500 hover:bg-accent-600 text-white btn-lg shadow-lg gap-2">
                <PlusCircle className="w-5 h-5" />
                Start a Fundraiser
              </Link>
              <Link to="/discover" className="btn bg-white/10 text-white hover:bg-white/20 border border-white/20 btn-lg gap-2">
                Browse Campaigns
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  )
}
