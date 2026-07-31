"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const password = String(formData.get("password") || "")

  if (!email || !password) {
    return "E-posta ve şifre zorunludur."
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Hatalı e-posta veya şifre."
        default:
          return "Giriş yapılırken bir hata oluştu."
      }
    }
    throw error
  }
}
