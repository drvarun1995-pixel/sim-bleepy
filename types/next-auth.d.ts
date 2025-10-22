import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      mustChangePassword?: boolean
      adminCreated?: boolean
      rememberMe?: boolean
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
    mustChangePassword?: boolean
    adminCreated?: boolean
    rememberMe?: boolean
  }
}
