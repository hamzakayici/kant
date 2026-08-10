import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.email = user.email
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.id = user.id
        token.mustChangePassword = user.mustChangePassword
        token.isSuperAdmin = user.isSuperAdmin
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string
        session.user.email = token.email as string
        session.user.firstName = token.firstName as string | null | undefined
        session.user.lastName = token.lastName as string | null | undefined
        session.user.id = token.id as string
        session.user.mustChangePassword = token.mustChangePassword as boolean
        session.user.isSuperAdmin = (token.isSuperAdmin as boolean) ?? false
      }
      return session
    },
  },
  providers: [],
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig
