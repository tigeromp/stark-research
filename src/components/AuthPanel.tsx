import { useState } from 'react'
import { X, Mail, Lock, LogIn, UserPlus, Cloud, CloudOff } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { isSupabaseConfigured } from '../lib/supabase'

interface AuthPanelProps {
  onClose: () => void
}

export function AuthPanel({ onClose }: AuthPanelProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { signIn, signUp, user } = useAuthStore()
  const configured = isSupabaseConfigured()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const result = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password)

    setLoading(false)

    if (result.error) {
      setError(result.error.message)
    } else if (isSignUp && 'needsEmailConfirm' in result && result.needsEmailConfirm) {
      setSuccess('Account created! Check your email to confirm, then sign in.')
      setIsSignUp(false)
    } else if (isSignUp) {
      setSuccess('Account created and signed in!')
      setTimeout(onClose, 1200)
    } else {
      setSuccess('Signed in successfully!')
      setTimeout(onClose, 1200)
    }
  }

  if (!configured) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="glass-panel w-full max-w-md mx-4 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-semibold text-[#f4f1ea]">
              Cloud Sync Unavailable
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#9c9590] hover:text-[#f4f1ea] hover:bg-white/[0.04] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-stark-800 border border-white/[0.08]">
              <CloudOff size={24} className="text-[#9c9590]" />
              <p className="text-sm text-[#9c9590]">
                Supabase is not configured. Your data is stored locally on this device only.
              </p>
            </div>

            <p className="text-xs text-[#9c9590]">
              To enable cloud sync across devices, set up your Supabase project and add the environment variables.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md mx-4 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Cloud size={24} className="text-arc-400" />
            <h2 className="text-xl font-display font-semibold text-[#f4f1ea]">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#9c9590] hover:text-[#f4f1ea] hover:bg-white/[0.04] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {user ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-arc-500/10 border border-arc-500/25">
              <p className="text-sm text-[#f4f1ea]">
                ✓ Signed in as <strong>{user.email}</strong>
              </p>
              <p className="text-xs text-[#9c9590] mt-1">
                Your research syncs automatically across all devices
              </p>
            </div>
            <button
              onClick={onClose}
              className="hud-button-primary w-full py-3"
            >
              Continue
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#9c9590] mb-2">
                <Mail size={14} className="inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="hud-input w-full px-4 py-3"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9c9590] mb-2">
                <Lock size={14} className="inline mr-1" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="hud-input w-full px-4 py-3"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/25 text-sm text-green-400">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="hud-button-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Loading...'
              ) : isSignUp ? (
                <>
                  <UserPlus size={16} />
                  Create Account
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setSuccess('')
              }}
              className="w-full text-sm text-[#9c9590] hover:text-[#f4f1ea] transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-white/[0.08]">
          <p className="text-xs text-center text-[#9c9590]">
            <Cloud size={12} className="inline mr-1" />
            Sync your research across iPhone, Mac, and all devices
          </p>
        </div>
      </div>
    </div>
  )
}
