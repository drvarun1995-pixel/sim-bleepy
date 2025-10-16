import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Check if user needs to change password
    if (req.nextauth.token?.mustChangePassword && 
        req.nextUrl.pathname !== '/change-password' && 
        req.nextUrl.pathname !== '/onboarding/profile') {
      return NextResponse.redirect(new URL('/change-password', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin-users/:path*',
    '/analytics/:path*',
    '/events/:path*',
    '/stations/:path*',
    '/resources/:path*',
    '/portfolio/:path*',
    '/imt-portfolio/:path*',
    '/bulk-upload-ai/:path*',
    '/event-data/:path*',
    '/formats/:path*',
    '/downloads/:path*',
    '/events-list/:path*',
    '/calendar/:path*',
    '/onboarding/:path*'
  ]
}