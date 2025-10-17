import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions = {
  providers: [
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
            .select('id, email, name, role, password_hash, auth_provider, email_verified, must_change_password, admin_created')
            .eq('email', credentials.email.toLowerCase())
            .single();

          if (error || !user) {
            return null;
          }

          // Only allow email/password authentication for users with email auth_provider
          if (user.auth_provider !== 'email') {
            return null;
          }

          // Check if email is verified (allow admin-created users to login once to verify)
          if (!user.email_verified && !user.admin_created) {
            throw new Error('EMAIL_NOT_VERIFIED');
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
          
          if (!isValidPassword) {
            return null;
          }

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
            mustChangePassword: user.must_change_password,
            adminCreated: user.admin_created,
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
      // Handle email/password sign-ins (already validated in authorize function)
      if (account?.provider === 'credentials') {
        return true;
      }

      return false;
    },
    async session({ session, token }: { session: any; token: any }) {
      // Ensure session data is properly set
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.mustChangePassword = token.mustChangePassword;
        session.user.adminCreated = token.adminCreated;
      }
      return session;
    },
    async jwt({ token, user }: { token: any; user: any }) {
      // Persist user data in token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
        token.adminCreated = user.adminCreated;
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
}
