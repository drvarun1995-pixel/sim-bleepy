import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      roleType?: string | null
      foundationYear?: string | null
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
    roleType?: string | null
    foundationYear?: string | null
    mustChangePassword?: boolean
    adminCreated?: boolean
    rememberMe?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string
    roleType?: string | null
    foundationYear?: string | null
    mustChangePassword?: boolean
    adminCreated?: boolean
    rememberMe?: boolean
    sessionInvalidated?: boolean
  }
}

