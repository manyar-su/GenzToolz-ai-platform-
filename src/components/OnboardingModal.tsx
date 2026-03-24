import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, FileText, Users, ArrowRight, X } from 'lucide-react'

const steps = [
  {
    icon: Zap,
    color: 'text-yellow-500',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    title: 'Selamat datang di GenzTools! 🎉',
    desc: 'Platform AI tools lengkap untuk content creator. Kamu sudah dapat 10 kredit gratis untuk mulai.',
    cta: 'Lanjut',
  },
  {
    icon: FileText,
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    title: 'Coba tool pertamamu',
    desc: 'Mulai dengan Script Architect — buat naskah video viral dalam hitungan detik menggunakan AI.',
    cta: 'Coba Script Architect',
    action: '/tools/script-architect',
  },
  {
    icon: Users,
    color: 'text-purple-500',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    title: 'Ajak teman, dapat bonus',
    desc: 'Bagikan link referralmu dan dapatkan +20 token setiap teman yang daftar. Tanpa batas!',
    cta: 'Lihat Program Affiliate',
    action: '/affiliate',
  },
]

interface Props {
  onClose: () => void
}

export default function OnboardingModal({ onClose }: Props) {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const current = steps[step]
  const Icon = current.icon

  const handleCta = () => {
    if (step < steps.length - 1) {
      if (current.action) {
        navigate(current.action)
        onClose()
      } else {
        setStep(s => s + 1)
      }
    } else {
      if (current.action) navigate(current.action)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X className="h-5 w-5" />
        </button>

        {/* Step dots */}
        <div className="mb-6 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-blue-600' : 'w-2 bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </div>

        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${current.bg}`}>
          <Icon className={`h-8 w-8 ${current.color}`} />
        </div>

        <h2 className="mb-2 text-center text-xl font-bold text-gray-900 dark:text-white">{current.title}</h2>
        <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">{current.desc}</p>

        <button
          onClick={handleCta}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-bold text-white shadow-lg shadow-blue-500/30 transition hover:scale-[1.02]"
        >
          {current.cta} <ArrowRight className="h-4 w-4" />
        </button>

        {step < steps.length - 1 && !current.action && (
          <button onClick={onClose} className="mt-3 w-full text-center text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            Lewati
          </button>
        )}
      </div>
    </div>
  )
}
