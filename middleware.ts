import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default withAuth(
  async function middleware(req) {
    const pathname = req.nextUrl.pathname
    const token = req.nextauth.token
    
    // Check if the request is for admin routes
    if (pathname.startsWith('/admin')) {
      // If no token, redirect to sign in
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
      
      // Check if user is admin
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || []
      const userEmail = token.email as string
      
      if (!adminEmails.includes(userEmail)) {
        // Redirect non-admin users to dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }
    
    // Check profile completion for authenticated users on protected routes
    if (token?.email) {
      // Skip check for onboarding, auth, and API routes
      if (
        pathname.startsWith('/onboarding') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname === '/' ||
        pathname === '/pricing' ||
        pathname === '/events'
      ) {
        return NextResponse.next()
      }
      
      try {
        // Get user profile from database
        const { data: user, error } = await supabase
          .from('users')
          .select('profile_completed, last_profile_prompt')
          .eq('email', token.email)
          .single()
        
        if (!error && user) {
          // If profile not completed, check if we should prompt
          if (!user.profile_completed) {
            const now = new Date()
            const lastPrompt = user.last_profile_prompt 
              ? new Date(user.last_profile_prompt)
              : null
            
            // Calculate hours since last prompt
            const hoursSincePrompt = lastPrompt 
              ? (now.getTime() - lastPrompt.getTime()) / (1000 * 60 * 60)
              : 25 // If never prompted, consider it > 24 hours
            
            // Redirect if more than 24 hours since last prompt
            if (hoursSincePrompt >= 24) {
              // Update last_profile_prompt timestamp
              await supabase
                .from('users')
                .update({ last_profile_prompt: now.toISOString() })
                .eq('email', token.email)
              
              return NextResponse.redirect(new URL('/onboarding/profile', req.url))
            }
          }
        }
      } catch (error) {
        console.error('Error checking profile completion:', error)
        // Continue on error to not block access
      }
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to admin routes only if user is authenticated
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/calendar/:path*',
    '/stations/:path*',
    '/event-data/:path*',
  ]
}
