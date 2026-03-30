'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { signin, totpVerify, AuthResponse } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'
import { PasswordInput } from '../../components/PasswordInput'

function SignInInner() {
  const t = useTranslations('SignIn')
  const { user, loading, login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mfaToken, setMfaToken] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    if (!loading && user) router.replace(callbackUrl)
  }, [user, loading, router, callbackUrl])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await signin(email, password)
      if ('requiresMfa' in res && res.requiresMfa) {
        setMfaToken(res.mfaToken)
      } else {
        login(res as AuthResponse)
        router.push(callbackUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFallback'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMfaSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await totpVerify(mfaToken!, mfaCode)
      login(res)
      router.push(callbackUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFallback'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  if (mfaToken) {
    return (
      <div className="page-center">
        <div className="card">
          <h1 className="card-title">{t('mfaTitle')}</h1>

          {error && <div className="error-msg">{error}</div>}

          <form className="form" onSubmit={handleMfaSubmit}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0 0 1rem' }}>
              {t('mfaPrompt')}
            </p>
            <div className="form-field">
              <label htmlFor="mfaCode">{t('mfaCode')}</label>
              <input
                id="mfaCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? t('mfaVerifying') : t('mfaVerify')}
            </button>
          </form>

          <p className="form-footer">{t('mfaRecoveryHint')}</p>

          <LanguageSwitcher />
        </div>
      </div>
    )
  }

  return (
    <div className="page-center">
      <div className="card">
        <h1 className="card-title">{t('title')}</h1>

        {error && <div className="error-msg">{error}</div>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">{t('email')}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <PasswordInput
            id="password"
            label={t('password')}
            autoComplete="current-password"
            required
            value={password}
            onChange={setPassword}
            showLabel={t('showPassword')}
            hideLabel={t('hidePassword')}
          />

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t('submitting') : t('submit')}
          </button>
        </form>

        <p className="form-footer">
          {t('noAccount')} <Link href="/signup">{t('signUpLink')}</Link>
        </p>

        <LanguageSwitcher />
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInInner />
    </Suspense>
  )
}
