import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Giriş Yap",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").trim().toLowerCase()
        const password = String(credentials?.password || "")

        if (!email || !password) return null

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) return null

        if (!user.isActive) {
          throw new Error("Hesabınız yönetici tarafından askıya alınmıştır.")
        }

        const passwordsMatch = await bcrypt.compare(
          password,
          user.password
        )

        if (passwordsMatch) {
          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
            isSuperAdmin: user.isSuperAdmin,
          }
        }

        return null
      },
    }),
  ],
})
