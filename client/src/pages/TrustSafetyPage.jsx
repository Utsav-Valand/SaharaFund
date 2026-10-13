import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Eye,
  FileText,
  AlertTriangle,
  HelpCircle,
  Mail,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  HeartHandshake,
  UserCheck,
  CheckCircle2,
  Flag,
} from 'lucide-react'
import PublicLayout from '../components/layout/PublicLayout'

/* ── Animation Variants ─────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' },
  }),
}

/* ── Content Data ───────────────────────────────────────────── */
const PILLARS = [
  {
    icon: FileText,
    title: 'Campaign Transparency',
    desc: 'Organizers provide transparent campaign stories, clear fund targets, and supporting documents so donors have the context they need.',
    badge: 'Open Details',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    icon: Lock,
    title: 'Secure Authentication & Access',
    desc: 'Accounts are protected with strong bcrypt password hashing, secure JWT authentication tokens, and strict role-based access controls.',
    badge: 'Account Security',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    icon: Flag,
    title: 'Review of Reported Campaigns',
    desc: 'Our moderation pipeline reviews user-submitted campaign reports. Flagged fundraisers undergo administrative review to safeguard the community.',
    badge: 'Active Moderation',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    icon: ShieldCheck,
    title: 'Payment & Signature Verification',
    desc: 'Online transactions are processed via RBI-compliant gateways. Every payment signature is verified server-side before campaign totals are updated.',
    badge: 'Verified Payments',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    icon: Eye,
    title: 'Privacy-Conscious Data Handling',
    desc: 'Sensitive payout bank details are encrypted, donors can choose to donate anonymously, and personal contact details are never made public.',
    badge: 'Data Protection',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
]

const SAFETY_TIPS = [
  {
    icon: Eye,
    title: 'Review Fundraiser Details',
    desc: 'Read the campaign description carefully. Look for clear explanations of how the funds will be utilized and review recent organizer updates.',
  },
  {
    icon: Lock,
    title: 'Protect Your Credentials & PINs',
    desc: 'Never share passwords, OTPs, or UPI PINs with anyone. SaharaFund will never ask you to disclose your secret banking credentials.',
  },
  {
    icon: AlertTriangle,
    title: 'Recognize Suspicious Activity',
    desc: 'Be cautious of fundraisers that refuse to clarify beneficiary details, rush you with undue urgency outside the platform, or ask for direct cash transfers.',
  },
]

const FAQS = [
  {
    q: 'How can I report a suspicious campaign?',
    a: 'You can report a campaign directly from its public page by clicking the "Report" flag icon below the campaign story. You can select a reason (such as misleading information or fraudulent activity) and provide additional details. Alternatively, email our safety team at support@saharafund.in with the campaign link.',
  },
  {
    q: 'How can I verify campaign information before donating?',
    a: 'Review the organizer\'s story, updates, and any attached documentation such as hospital estimates or certificates. You can also view recent donations and read comments from other supporters. If you have questions, leave a public comment or reach out before contributing.',
  },
  {
    q: 'What should I do if I suspect fraud?',
    a: 'If you suspect fraud, do not contribute funds. Use the "Report" button on the campaign page immediately, or send an email to support@saharafund.in with the campaign URL and any supporting evidence. Our moderation team will investigate the campaign promptly.',
  },
  {
    q: 'How is my personal information handled?',
    a: 'We take privacy seriously. Donors can choose to donate anonymously so their names are hidden from public donor lists. Payment processing is handled securely through RBI-compliant gateways without storing full card details, and sensitive withdrawal account data is encrypted.',
  },
]

export default function TrustSafetyPage() {
  const [openFaq, setOpenFaq] = useState(null)

  const toggleFaq = (idx) => {
    setOpenFaq((prev) => (prev === idx ? null : idx))
  }

  return (
    <PublicLayout>
      {/* ── 1. HERO SECTION ────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background: 'linear-gradient(135deg, #042f2e 0%, #0f766e 45%, #0d9488 75%, #134e4a 100%)',
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-teal-400/10 blur-3xl" />
        </div>

        <div className="container-xl relative z-10 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold text-teal-100 mb-6"
            >
              <ShieldCheck className="w-4 h-4 text-teal-300" />
              <span>Trust & Safety at SaharaFund</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="text-3xl md:text-5xl font-display font-extrabold tracking-tight text-white mb-6 leading-tight"
            >
              Your Trust. Our Responsibility.
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.16 }}
              className="text-base md:text-lg text-teal-50/90 leading-relaxed mb-8"
            >
              At SaharaFund, we believe that transparent giving changes lives. We are dedicated to making
              crowdfunding safer, more transparent, and more accountable for every donor, organizer, and beneficiary.
            </motion.p>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.24 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <a
                href="#how-we-protect"
                className="px-6 py-3 rounded-xl bg-white text-teal-900 font-semibold text-sm hover:bg-teal-50 transition-colors shadow-sm"
              >
                How We Protect You
              </a>
              <a
                href="#report-concern"
                className="px-6 py-3 rounded-xl bg-teal-800/80 hover:bg-teal-800 text-white font-semibold text-sm border border-teal-600/60 transition-colors flex items-center gap-2"
              >
                <Flag className="w-4 h-4 text-teal-200" />
                Report a Concern
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. HOW WE PROTECT OUR COMMUNITY ────────────────────────── */}
      <section id="how-we-protect" className="py-16 md:py-24 bg-gray-50/60 border-b border-gray-100">
        <div className="container-xl">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Platform Safeguards
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-4">
              How We Protect Our Community
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              From authentication to donation settlement, discover the measures we take to keep fundraisers genuine
              and secure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {PILLARS.map((pillar, idx) => {
              const Icon = pillar.icon
              return (
                <motion.div
                  key={pillar.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={idx}
                  className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${pillar.badgeColor}`}>
                        {pillar.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">{pillar.title}</h3>
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{pillar.desc}</p>
                  </div>
                </motion.div>
              )
            })}

            {/* Highlighted Trust Stat Card */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={5}
              className="bg-gradient-to-br from-teal-900 to-teal-800 p-6 rounded-2xl text-white shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-white/10 text-teal-200 flex items-center justify-center mb-4">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Community Accountability</h3>
                <p className="text-xs md:text-sm text-teal-100/90 leading-relaxed">
                  Real supporters and organizers collaborate transparently. Every verified donation directly advances a cause that matters.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-white/10 flex items-center gap-2 text-xs text-teal-200 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero tolerance for fraudulent behavior</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 3. DONATE SAFELY ───────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-white border-b border-gray-100">
        <div className="container-xl">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 mb-3">
              <AlertTriangle className="w-3.5 h-3.5" />
              Donor Best Practices
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-4">
              Donate Safely & Confidently
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              Protecting yourself as a donor is easy when you follow a few practical guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {SAFETY_TIPS.map((tip, idx) => {
              const Icon = tip.icon
              return (
                <motion.div
                  key={tip.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={idx}
                  className="p-6 rounded-2xl border border-gray-200/80 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{tip.title}</h3>
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{tip.desc}</p>
                </motion.div>
              )
            })}
          </div>

          {/* Golden Rule Callout */}
          <div className="max-w-3xl mx-auto mt-12 p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm leading-relaxed">
              <strong className="font-semibold block mb-1">Important Safety Reminder:</strong>
              SaharaFund and payment providers will never send you unsolicited messages asking for your UPI PIN, ATM PIN, or one-time password (OTP). Always initiate donations solely via the verified campaign payment interface.
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. REPORT A CONCERN ────────────────────────────────────── */}
      <section id="report-concern" className="py-16 md:py-24 bg-gray-50/70 border-b border-gray-100">
        <div className="container-xl">
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-200/90 shadow-sm p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Flag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Moderation & Support</span>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900">
                  Report a Concern
                </h2>
              </div>
            </div>

            <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">
              If you notice suspicious activity, misleading information, or potential fraud, we urge you to report it immediately. Your reports help keep SaharaFund safe for everyone.
            </p>

            <div className="space-y-4 mb-8">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs md:text-sm text-gray-700">
                  <strong>Reporting a specific fundraiser:</strong> Navigate to the campaign’s page and click the <strong>“Report”</strong> flag button under the story to submit an alert directly to our moderation queue.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                <Mail className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs md:text-sm text-gray-700">
                  <strong>General safety issues or payment concerns:</strong> Contact our Trust & Safety team directly via email. Please include the campaign link, transaction reference, and relevant screenshots.
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <a
                href="mailto:support@saharafund.in?subject=Trust%20%26%20Safety%20Concern%20Report&body=Please%20describe%20your%20concern%20below%3A%0A%0ACampaign%20Link%20(if%20applicable)%3A%0ADescription%20of%20issue%3A%0AEvidence%20or%20screenshots%3A"
                className="btn-danger flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold shadow-sm"
              >
                <Flag className="w-4 h-4" />
                Report a Concern via Email
              </a>
              <Link
                to="/discover"
                className="btn-secondary flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold"
              >
                Browse Campaigns
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. FREQUENTLY ASKED QUESTIONS ──────────────────────────── */}
      <section className="py-16 md:py-24 bg-white border-b border-gray-100">
        <div className="container-xl">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-4">
              Common Questions About Safety
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              Learn more about how our platform handles safety, identity, and donor protection.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={faq.q}
                  className="border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 font-semibold text-gray-900 text-sm md:text-base hover:bg-gray-50/60 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-teal-700' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-6 pb-5 pt-1 text-xs md:text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 6. FOOTER CALL TO ACTION ───────────────────────────────── */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container-xl">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-100/70 text-teal-800 flex items-center justify-center mx-auto mb-5">
              <HeartHandshake className="w-6 h-6" />
            </div>

            <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-4">
              Together, we can build a safer fundraising community.
            </h2>
            <p className="text-gray-600 text-sm md:text-base mb-8 max-w-xl mx-auto">
              Clear accountability begins with every member. Review our formal policies or get in touch with our team whenever you need support.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 mb-8">
              <Link to="/privacy" className="hover:text-teal-700 transition-colors font-medium">
                Privacy Policy
              </Link>
              <span className="text-gray-300">•</span>
              <Link to="/terms" className="hover:text-teal-700 transition-colors font-medium">
                Terms of Service
              </Link>
              <span className="text-gray-300">•</span>
              <Link to="/contact" className="hover:text-teal-700 transition-colors font-medium">
                Contact Us
              </Link>
            </div>

            <div>
              <Link
                to="/discover"
                className="btn-primary py-3 px-8 rounded-xl text-sm font-semibold inline-flex items-center gap-2 shadow-sm"
              >
                Explore Fundraisers
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
