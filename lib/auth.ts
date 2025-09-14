import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Get user from database
          const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, password_hash, auth_provider, email_verified')
            .eq('email', credentials.email.toLowerCase())
            .single();

          if (error || !user) {
            return null;
          }

          // Only allow email/password authentication for users with email auth_provider
          if (user.auth_provider !== 'email') {
            return null;
          }

          // Check if email is verified
          if (!user.email_verified) {
            throw new Error('Please verify your email address before signing in. Check your inbox for a verification email.');
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
          
          if (!isValidPassword) {
            return null;
          }

          // Return user object (password_hash will be excluded)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }: { user: any; account: any; profile?: any }) {
      // Handle Google OAuth sign-ins
      if (account?.provider === 'google') {
        try {
          // Check if user exists in our database
          const { data: existingUser } = await supabase
            .from('users')
            .select('id, email, auth_provider')
            .eq('email', user.email?.toLowerCase())
            .single();

          if (!existingUser) {
            // Create new user for Google OAuth
            const { error } = await supabase
              .from('users')
              .insert({
                email: user.email?.toLowerCase(),
                name: user.name || user.email?.split('@')[0],
                auth_provider: 'google',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (error) {
              console.error('Error creating Google user:', error);
              return false;
            }
          }
          return true;
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
      }

      // Handle email/password sign-ins (already validated in authorize function)
      if (account?.provider === 'credentials') {
        return true;
      }

      return false;
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
}
