import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import {
  isOnboardingProfilePath,
  isProfileOnboardingComplete,
  pathRequiresAuth,
  pathRequiresProfileOnboarding,
} from '@/lib/profile-onboarding'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  const noIndexPaths =
    pathname.startsWith('/placements') ||
    pathname.startsWith('/blog-analytics') ||
    pathname.startsWith('/download-analytics') ||
    pathname.startsWith('/resources-for-teaching')

  const withOptionalNoIndex = (res: NextResponse) => {
    if (noIndexPaths) {
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    }
    return res
  }

  // Private app areas require login
  if (!token && pathRequiresAuth(pathname)) {
    const signIn = new URL('/auth/signin', request.url)
    signIn.searchParams.set('callbackUrl', pathname)
    return withOptionalNoIndex(NextResponse.redirect(signIn))
  }

  // Authenticated: enforce / redirect around profile onboarding
  if (token && (pathRequiresProfileOnboarding(pathname) || isOnboardingProfilePath(pathname))) {
    try {
      const profileResponse = await fetch(`${request.nextUrl.origin}/api/user/profile`, {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
        cache: 'no-store',
      })

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        const complete = isProfileOnboardingComplete(profileData.user)

        // Already complete → never show onboarding again
        if (complete && isOnboardingProfilePath(pathname)) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Incomplete → force onboarding before app use
        if (!complete && pathRequiresProfileOnboarding(pathname)) {
          return withOptionalNoIndex(
            NextResponse.redirect(new URL('/onboarding/profile', request.url))
          )
        }
      }
    } catch (error) {
      console.error('Middleware profile check error:', error)
    }
  }

  return withOptionalNoIndex(NextResponse.next())
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/placements/:path*',
    '/placements-guide/:path*',
    '/blog-analytics',
    '/blog-analytics/:path*',
    '/download-analytics',
    '/download-analytics/:path*',
    '/events',
    '/events/:path*',
    '/events-list',
    '/events-list/:path*',
    '/calendar',
    '/calendar/:path*',
    '/calendar-subscription',
    '/calendar-subscription/:path*',
    '/formats',
    '/formats/:path*',
    '/my-bookings',
    '/my-bookings/:path*',
    '/my-attendance',
    '/my-attendance/:path*',
    '/mycertificates',
    '/mycertificates/:path*',
    '/bookings',
    '/bookings/:path*',
    '/cohorts',
    '/cohorts/:path*',
    '/event-data',
    '/event-data/:path*',
    '/certificates',
    '/certificates/:path*',
    '/feedback',
    '/feedback/:path*',
    '/attendance-tracking',
    '/attendance-tracking/:path*',
    '/qr-codes',
    '/qr-codes/:path*',
    '/bulk-upload',
    '/bulk-upload/:path*',
    '/bulk-upload-ai',
    '/bulk-upload-ai/:path*',
    '/emails',
    '/emails/:path*',
    '/analytics',
    '/analytics/:path*',
    '/games',
    '/games/:path*',
    '/games-organiser',
    '/games-organiser/:path*',
    '/stations',
    '/stations/:path*',
    '/profile',
    '/profile/:path*',
    '/settings',
    '/settings/:path*',
    '/downloads',
    '/downloads/:path*',
    '/resources-for-teaching',
    '/resources-for-teaching/:path*',
    '/imt-portfolio',
    '/imt-portfolio/:path*',
    '/teaching-portfolio',
    '/teaching-portfolio/:path*',
    '/simulation-fellowship',
    '/simulation-fellowship/:path*',
    '/admin-users',
    '/admin-users/:path*',
    '/year-progression',
    '/year-progression/:path*',
    '/admin-file-requests',
    '/admin-file-requests/:path*',
    '/admin-teaching-requests',
    '/admin-teaching-requests/:path*',
    '/contact-messages',
    '/contact-messages/:path*',
    '/changelog',
    '/simulator-analytics',
    '/simulator-analytics/:path*',
    '/clinical-sounds',
    '/clinical-sounds/:path*',
    '/meded-contacts',
    '/meded-contacts/:path*',
    '/conferences',
    '/conferences/:path*',
    '/conference-data',
    '/conference-data/:path*',
  ],
}
