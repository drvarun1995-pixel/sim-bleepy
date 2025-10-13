import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface SessionValidationResult {
  isValid: boolean
  isLoading: boolean
  shouldSignOut: boolean
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
}

export function useSessionValidation(): SessionValidationResult {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [validationResult, setValidationResult] = useState<SessionValidationResult>({
    isValid: false,
    isLoading: true,
    shouldSignOut: false
  })

  useEffect(() => {
    const validateSession = async () => {
      if (status === 'loading') {
        setValidationResult({
          isValid: false,
          isLoading: true,
          shouldSignOut: false
        })
        return
      }

      if (!session?.user?.email) {
        setValidationResult({
          isValid: false,
          isLoading: false,
          shouldSignOut: false
        })
        return
      }

      try {
        const response = await fetch('/api/auth/validate-session')
        const data = await response.json()

        if (data.valid) {
          setValidationResult({
            isValid: true,
            isLoading: false,
            shouldSignOut: false,
            user: data.user
          })
        } else {
          setValidationResult({
            isValid: false,
            isLoading: false,
            shouldSignOut: data.shouldSignOut || false
          })

          // If user should be signed out, do it automatically
          if (data.shouldSignOut) {
            console.log('User deleted from database, signing out...')
            await signOut({ callbackUrl: '/' })
          }
        }
      } catch (error) {
        console.error('Error validating session:', error)
        setValidationResult({
          isValid: false,
          isLoading: false,
          shouldSignOut: false
        })
      }
    }

    validateSession()
  }, [session, status])

  return validationResult
}

