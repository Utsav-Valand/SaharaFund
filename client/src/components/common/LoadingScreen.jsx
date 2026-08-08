import { Loader2 } from 'lucide-react'
import logoImg from '../../assets/logo.png'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-3 animate-pulse">
          <img src={logoImg} alt="SaharaFund" className="w-full h-full object-contain" />
        </div>
        <p className="text-gray-900 font-bold text-lg mb-1">
          Sahara<span className="text-emerald-700">Fund</span>
        </p>
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  )
}
