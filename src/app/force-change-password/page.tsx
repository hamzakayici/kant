import { auth } from "@/auth"
import { redirect } from "next/navigation"
import ForceChangeClient from "./ForceChangeClient"

export default async function ForceChangePasswordPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  // If somehow they got here but don't need to change password, redirect away
  if (!(session.user as any).mustChangePassword) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <ForceChangeClient />
    </div>
  )
}
