import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import {
  checkAuthRateLimit,
  clearAuthRateLimit,
  ipRateKey,
  LOGIN_IP_RATE_LIMIT,
  loginRateKey,
  recordFailedAuthAttempt,
} from '@/lib/auth-rate-limit'
import { notifyLoginLockout } from '@/lib/login-lockout'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const AUTH_ERROR_TOO_MANY = 'TOO_MANY_ATTEMPTS'
const AUTH_ERROR_UNVERIFIED = 'EMAIL_NOT_VERIFIED'

function getAuthorizeIp(req?: { headers?: Record<string, unknown> | { get?: (name: string) => string | null } }): string {
  const headers = req?.headers
  if (!headers) return 'unknown'
  const read = (name: string): string => {
    if (typeof (headers as { get?: (n: string) => string | null }).get === 'function') {
      return (headers as { get: (n: string) => string | null }).get(name) || ''
    }
    const raw = (headers as Record<string, unknown>)[name] ?? (headers as Record<string, unknown>)[name.toLowerCase()]
    if (Array.isArray(raw)) return String(raw[0] || '')
    return typeof raw === 'string' ? raw : ''
  }
  const forwarded = read('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return read('x-real-ip') || 'unknown'
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const normalizedEmail = credentials.email.toLowerCase().trim()
          const emailKey = loginRateKey(normalizedEmail)
          const ip = getAuthorizeIp(req as { headers?: Record<string, unknown> })
          const ipKey = ip !== 'unknown' ? ipRateKey(ip, 'login') : null

          const [emailLimit, ipLimit] = await Promise.all([
            checkAuthRateLimit(emailKey),
            ipKey ? checkAuthRateLimit(ipKey, LOGIN_IP_RATE_LIMIT) : Promise.resolve({ allowed: true as const }),
          ])

          if (!emailLimit.allowed || !ipLimit.allowed) {
            throw new Error(AUTH_ERROR_TOO_MANY)
          }

          // Get user from database
          const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, role, role_type, foundation_year, password_hash, auth_provider, email_verified, must_change_password, admin_created')
            .eq('email', normalizedEmail)
            .single();

          const recordFailure = async (userExists: boolean, userName?: string | null) => {
            const emailResult = await recordFailedAuthAttempt(emailKey)
            if (ipKey) await recordFailedAuthAttempt(ipKey, LOGIN_IP_RATE_LIMIT)
            if (emailResult.justLocked) {
              void notifyLoginLockout({
                email: normalizedEmail,
                userName,
                userExists,
                ip,
              })
            }
          }

          if (error || !user) {
            await recordFailure(false)
            return null;
          }

          // Only allow email/password authentication for users with email auth_provider
          if (user.auth_provider !== 'email') {
            return null;
          }

          // Check if email is verified (allow admin-created users to login once to verify)
          if (!user.email_verified && !user.admin_created) {
            throw new Error(AUTH_ERROR_UNVERIFIED);
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
          
          if (!isValidPassword) {
            await recordFailure(true, user.name)
            return null;
          }

          await clearAuthRateLimit(emailKey)
          if (ipKey) await clearAuthRateLimit(ipKey)

          // If this is an admin-created user logging in for the first time, verify their email
          if (user.admin_created && !user.email_verified) {
            try {
              const { error: updateError } = await supabase
                .from('users')
                .update({ email_verified: true })
                .eq('id', user.id);
              
              if (updateError) {
                console.error('Error verifying email for admin-created user:', updateError);
              }
            } catch (error) {
              console.error('Error updating email verification:', error);
            }
          }

          // Return user object (password_hash will be excluded)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            roleType: user.role_type,
            foundationYear: user.foundation_year,
            mustChangePassword: user.must_change_password,
            adminCreated: user.admin_created,
            rememberMe: credentials.rememberMe === 'true',
          };
        } catch (error) {
          if (
            error instanceof Error &&
            (error.message === AUTH_ERROR_TOO_MANY || error.message === AUTH_ERROR_UNVERIFIED)
          ) {
            throw error
          }
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }: { user: any; account: any; profile?: any }) {
      // Handle email/password sign-ins (already validated in authorize function)
      if (account?.provider === 'credentials') {
        return true;
      }

      return false;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token?.sessionInvalidated) {
        return {
          ...session,
          user: undefined,
          expires: new Date(0).toISOString(),
        }
      }
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.roleType = token.roleType ?? null;
        session.user.foundationYear = token.foundationYear ?? null;
        session.user.mustChangePassword = token.mustChangePassword;
        session.user.adminCreated = token.adminCreated;
        session.user.rememberMe = token.rememberMe;
      }
      return session;
    },
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.roleType = user.roleType ?? null;
        token.foundationYear = user.foundationYear ?? null;
        token.mustChangePassword = user.mustChangePassword;
        token.adminCreated = user.adminCreated;
        token.rememberMe = user.rememberMe;
        return token;
      }

      if (token?.id && typeof token.iat === 'number') {
        try {
          const { data } = await supabase
            .from('users')
            .select('password_changed_at, role, role_type, foundation_year')
            .eq('id', token.id)
            .maybeSingle()

          if (data?.password_changed_at) {
            const changedSec = Math.floor(new Date(data.password_changed_at).getTime() / 1000)
            if (changedSec > token.iat) {
              return { sessionInvalidated: true }
            }
          }
          if (data) {
            token.role = data.role ?? token.role
            token.roleType = data.role_type ?? null
            token.foundationYear = data.foundation_year ?? null
          }
        } catch (error) {
          console.error('Password session check failed:', error)
        }
      }

      return token;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Redirect to dashboard after successful sign-in
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: "jwt" as const,
    // Default session duration: 1 day (86400 seconds)
    maxAge: 24 * 60 * 60,
  },
  jwt: {
    // JWT token expiration: 30 days for "remember me", 1 day otherwise
    maxAge: 30 * 24 * 60 * 60,
  },
}
