import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  
  // If user is not authenticated, redirect to sign in
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  
  // If user is authenticated and trying to access dashboard, check profile completion
  if (token && request.nextUrl.pathname.startsWith('/dashboard')) {
    try {
      // Make a request to check profile completion
      const profileResponse = await fetch(`${request.nextUrl.origin}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token.accessToken}`,
          'Cookie': request.headers.get('cookie') || '',
        },
      })
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        
        if (profileData.user) {
          const profileCompleted = profileData.user.profile_completed
          const onboardingCompleted = profileData.user.onboarding_completed_at
          
          // If profile is not completed, redirect to onboarding
          if (!profileCompleted || !onboardingCompleted) {
            return NextResponse.redirect(new URL('/onboarding/profile', request.url))
          }
        }
      }
    } catch (error) {
      console.error('Middleware profile check error:', error)
      // If we can't check profile, allow access (fallback)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*'
  ]
}