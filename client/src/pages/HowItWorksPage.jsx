import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  UserPlus, FileText, Image, Send, Wallet, ArrowDownToLine,
  Search, BadgeCheck, IndianRupee, ShieldCheck, BarChart2,
  Shield, Fingerprint, AlertTriangle, Lock, Eye,
  PlusCircle, CheckCircle, Coins, Sparkles,
  ArrowRight, ChevronRight, Heart,
} from 'lucide-react'
import PublicLayout from '../components/layout/PublicLayout'

/* ── animation variants ─────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { delay: i * 0.08, duration: 0.45 },
  }),
}

/* ── data ────────────────────────────────────────────────────── */
const FUNDRAISER_STEPS = [
  {
    icon: UserPlus,
    title: 'Create an Account',
    desc: 'Sign up in seconds with your email. Your profile forms the trust layer donors rely on.',
    color: 'bg-primary-50 text-primary-700',
    accent: 'border-primary-200',
  },
  {
    icon: FileText,
    title: 'Create Your Campaign',
    desc: 'Give your fundraiser a title, choose a category, and set a realistic target amount.',
    color: 'bg-teal-50 text-teal-700',
    accent: 'border-teal-200',
  },
  {
    icon: Image,
    title: 'Tell Your Story',
    desc: 'Add your story, supporting images, and documents so donors can trust your cause completely.',
    color: 'bg-blue-50 text-blue-700',
    accent: 'border-blue-200',
  },
  {
    icon: Send,
    title: 'Submit for Review',
    desc: 'Our team verifies your identity and campaign details before it goes live on the platform.',
    color: 'bg-violet-50 text-violet-700',
    accent: 'border-violet-200',
  },
  {
    icon: Wallet,
    title: 'Receive Donations',
    desc: 'Once live, share your campaign link. Donors from across India can contribute securely.',
    color: 'bg-amber-50 text-amber-700',
    accent: 'border-amber-200',
  },
  {
    icon: ArrowDownToLine,
    title: 'Withdraw Funds',
    desc: 'Request a payout to your verified bank account. Funds arrive within 2-5 business days.',
    color: 'bg-green-50 text-green-700',
    accent: 'border-green-200',
  },
]

const DONOR_STEPS = [
  {
    icon: Search,
    title: 'Browse Campaigns',
    desc: 'Explore campaigns by category, urgency, or location. Filter to find a cause close to your heart.',
    color: 'bg-primary-50 text-primary-700',
  },
  {
    icon: BadgeCheck,
    title: 'Verify Campaign Info',
    desc: 'Every campaign displays verification status, full story, documents, and transparent donation history.',
    color: 'bg-teal-50 text-teal-700',
  },
  {
    icon: IndianRupee,
    title: 'Choose an Amount',
    desc: 'Pick from suggested amounts or enter any custom amount. Even small donations make a big difference.',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    icon: ShieldCheck,
    title: 'Donate Securely',
    desc: 'Pay via UPI, card, or net banking through our encrypted payment gateway - no account needed.',
    color: 'bg-green-50 text-green-700',
  },
  {
    icon: BarChart2,
    title: 'Track Your Impact',
    desc: 'See exactly where your donation went. Fundraisers post updates so you stay informed.',
    color: 'bg-violet-50 text-violet-700',
  },
]

const TRUST_FEATURES = [
  {
    icon: BadgeCheck,
    title: 'Campaign Verification',
    desc: 'Every campaign is manually reviewed by our Trust & Safety team before going live. Fake or misleading campaigns are rejected at this stage.',
    color: 'bg-primary-50 text-primary-700',
  },
  {
    icon: Fingerprint,
    title: 'Identity Verification',
    desc: 'Fundraisers submit government-issued ID and supporting documents. Our team verifies authenticity for every campaign.',
    color: 'bg-teal-50 text-teal-700',
  },
  {
    icon: AlertTriangle,
    title: 'AI Fraud Detection',
    desc: 'Our system automatically flags suspicious activity, duplicate accounts, and irregular donation patterns for human review.',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    icon: Lock,
    title: 'Secure Payments',
    desc: 'All payments are processed through RBI-compliant, PCI-DSS certified gateways. No payment data is stored on our servers.',
    color: 'bg-red-50 text-red-700',
  },
  {
    icon: Eye,
    title: 'Full Transparency',
    desc: 'Donation amounts, donor names, and fund usage are publicly visible. Fundraisers are required to post progress updates.',
    color: 'bg-blue-50 text-blue-700',
  },
  {
    icon: Shield,
    title: 'Donor Protection',
    desc: 'If a campaign is found to be fraudulent after donations are made, we work with donors on refunds through our dispute resolution process.',
    color: 'bg-violet-50 text-violet-700',
  },
]

const PROCESS_STEPS = [
  {
    icon: PlusCircle,
    label: 'Create',
    desc: 'Set up your fundraiser with your story and goal',
    color: 'bg-primary-700',
  },
  {
    icon: CheckCircle,
    label: 'Verify',
    desc: 'We review your identity and campaign details',
    color: 'bg-teal-600',
  },
  {
    icon: Coins,
    label: 'Fund',
    desc: 'Your live campaign receives donations from real donors',
    color: 'bg-amber-500',
  },
  {
    icon: Sparkles,
    label: 'Impact',
    desc: 'Funds reach you and create real, lasting change',
    color: 'bg-green-600',
  },
]

const FAQS = [
  {
    q: 'Is SaharaFund free to use?',
    a: 'Creating a campaign and donating is free. SaharaFund deducts a small platform fee from funds raised to keep the service running. Exact fee details are shown before you submit your campaign.',
  },
  {
    q: 'How long does campaign review take?',
    a: 'Most campaigns are reviewed within 24-48 hours. Complex cases requiring additional documentation may take slightly longer. You will be notified by email at every stage.',
  },
  {
    q: 'Is my payment information safe?',
    a: 'Yes. All payments are processed through RBI-compliant payment gateways. SaharaFund never stores your card or bank details on its servers.',
  },
  {
    q: 'Can I donate anonymously?',
    a: 'Yes. During checkout you can choose to make your donation anonymous. Your name will not appear on the campaign\'s public donor list.',
  },
  {
    q: 'How do fundraisers withdraw money?',
    a: 'Once a campaign is live, fundraisers can request payouts to their verified bank account at any time. Funds are transferred within 2-5 business days.',
  },
  {
    q: 'What happens if a campaign is fraudulent?',
    a: 'If fraud is detected after donations are made, we suspend the campaign immediately, investigate thoroughly, and work with affected donors through our dispute resolution process.',
  },
]

/* ── sub-components ──────────────────────────────────────────── */
function SectionLabel({ children, color }) {
  const cls = color || 'bg-emerald-50 text-emerald-700 border-emerald-200'
  return (
    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${cls} mb-3`}>
      {children}
    </span>
  )
}

function StepCard({ icon: Icon, title, desc, color, accent, index }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      custom={index}
      className={`card p-6 border-t-2 ${accent || 'border-primary-200'} group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-bold text-gray-300 tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <div className={`w-11 h-11 rounded-2xl ${color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </motion.div>
  )
}

/* ── page ────────────────────────────────────────────────────── */
export default function HowItWorksPage() {
  return (
    <PublicLayout>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #042f2e 0%, #0f766e 45%, #0d9488 75%, #134e4a 100%)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-primary-400/10 blur-3xl" />
        </div>

        <div className="container-xl relative z-10 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/80 text-sm font-medium mb-6"
            >
              <Heart className="w-4 h-4 text-accent-400" fill="currentColor" />
              Simple. Transparent. Trusted.
            </motion.div>

            <motion.h1
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-4xl md:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6"
            >
              How{' '}
              <span style={{ background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                SaharaFund
              </span>{' '}
              Works
            </motion.h1>

            <motion.p
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl mx-auto mb-10"
            >
              Whether you are raising funds for a cause you believe in or supporting someone in need, SaharaFund makes every step simple, secure, and transparent.
            </motion.p>

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link to="/create" className="btn bg-accent-500 text-white hover:bg-accent-600 btn-lg shadow-lg hover:shadow-xl active:scale-[0.98] gap-2">
                <PlusCircle className="w-5 h-5" />
                Start a Fundraiser
              </Link>
              <Link to="/discover" className="btn glass text-white border-white/20 hover:bg-white/20 btn-lg gap-2">
                Explore Campaigns
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-12 fill-white">
            <path d="M0,60 C240,0 480,60 720,30 C960,0 1200,60 1440,30 L1440,60 Z" />
          </svg>
        </div>
      </section>

      {/* ── 4-STEP VISUAL PROCESS ───────────────────────────── */}
      <section className="section bg-white">
        <div className="container-xl">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-14"
          >
            <SectionLabel>At a Glance</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-3">
              Four steps to real impact
            </h2>
            <p className="text-gray-500">
              From idea to funded, SaharaFund guides you through every milestone with clarity and confidence.
            </p>
          </motion.div>

          <div className="relative">
            <div className="hidden lg:block absolute top-14 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary-200 via-teal-200 to-green-200 z-0" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {PROCESS_STEPS.map((step, i) => (
                <motion.div
                  key={step.label}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  className="flex flex-col items-center text-center"
                >
                  <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-5 shadow-lg transition-transform duration-300 hover:scale-110`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Step {i + 1}</span>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.label}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">{step.desc}</p>
                  {i < PROCESS_STEPS.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-gray-300 mt-4 lg:hidden" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR FUNDRAISERS ─────────────────────────────────── */}
      <section className="section bg-gray-50">
        <div className="container-xl">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center mb-14"
          >
            <SectionLabel color="bg-primary-50 text-primary-700 border-primary-200">For Fundraisers</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-3">
              Start raising funds in minutes
            </h2>
            <p className="text-gray-500">
              Creating a campaign on SaharaFund is straightforward and guided. Here is exactly what to expect from account creation to your first withdrawal.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FUNDRAISER_STEPS.map((step, i) => (
              <StepCard key={step.title} {...step} index={i} />
            ))}
          </div>

          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mt-10 text-center"
          >
            <Link to="/create" className="btn-primary btn-lg gap-2">
              <PlusCircle className="w-5 h-5" />
              Create Your Fundraiser
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOR DONORS ──────────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container-xl">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center mb-14"
          >
            <SectionLabel color="bg-amber-50 text-amber-700 border-amber-200">For Donors</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-3">
              Give with confidence
            </h2>
            <p className="text-gray-500">
              Finding and supporting a cause you believe in takes just a few minutes. Every donation goes through a secure, transparent process.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-4">
            {DONOR_STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="relative flex flex-col items-center text-center"
              >
                {i < DONOR_STEPS.length - 1 && (
                  <div className="hidden md:flex absolute right-0 top-7 translate-x-1/2 z-10 items-center">
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                )}
                <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center mb-4 transition-transform duration-300 hover:scale-110`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-gray-300 mb-1">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mt-10 text-center"
          >
            <Link to="/discover" className="btn-secondary btn-lg gap-2">
              Explore Campaigns
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── TRUST & SAFETY ──────────────────────────────────── */}
      <section className="section bg-gray-50">
        <div className="container-xl">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center mb-14"
          >
            <SectionLabel color="bg-red-50 text-red-700 border-red-200">Trust &amp; Safety</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-3">
              Built on a foundation of trust
            </h2>
            <p className="text-gray-500">
              SaharaFund uses multiple layers of verification, fraud detection, and transparent reporting so every donation creates genuine impact.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRUST_FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="card p-6 group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-2xl ${feature.color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container-lg">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-12"
          >
            <SectionLabel>Common Questions</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-3">
              Frequently asked questions
            </h2>
          </motion.div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="card p-6"
              >
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    Q
                  </span>
                  {faq.q}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed pl-7">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────── */}
      <section className="section bg-primary-700">
        <div className="container-xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium mb-6">
              <Heart className="w-4 h-4 text-accent-400" fill="currentColor" />
              Join thousands making a real difference
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to take the next step?
            </h2>
            <p className="text-primary-200 text-lg mb-8 max-w-xl mx-auto">
              Whether you are starting a fundraiser or looking to support a cause, SaharaFund is your trusted platform for impact-driven giving.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/create" className="btn bg-accent-500 hover:bg-accent-600 text-white btn-lg shadow-lg gap-2">
                <PlusCircle className="w-5 h-5" />
                Start a Fundraiser
              </Link>
              <Link to="/discover" className="btn bg-white/10 text-white hover:bg-white/20 border border-white/20 btn-lg gap-2">
                Explore Campaigns
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </PublicLayout>
  )
}
