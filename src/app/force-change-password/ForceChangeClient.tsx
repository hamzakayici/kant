"use client"

import { useState } from "react"
import { Lock, Save, ArrowRight } from "lucide-react"
import { changeMyPassword } from "@/app/actions/roleActions"
import { signOut } from "next-auth/react"

export default function ForceChangeClient() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.")
      return
    }
    
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.")
      return
    }

    setLoading(true)
    try {
      await changeMyPassword(password)
      // Log out to clear the old session/token with mustChangePassword=true
      await signOut({ callbackUrl: "/login?reset=success" })
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu")
      setLoading(false)
    }
  }

  return (
    <div className="bg-card p-8 rounded-2xl shadow-2xl border border-border w-full max-w-md animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center border border-blue-500/30">
          <Lock className="w-8 h-8 text-primary" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-center text-foreground mb-2">Güvenlik Uyarısı</h1>
      <p className="text-muted-foreground text-center text-sm mb-8">
        Sisteme ilk defa giriş yapıyorsunuz veya şifreniz yönetici tarafından sıfırlandı. Lütfen devam etmeden önce yeni bir şifre belirleyin.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Yeni Şifre</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-ring transition-colors placeholder:text-muted-foreground/70"
            placeholder="En az 6 karakter"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Yeni Şifre (Tekrar)</label>
          <input 
            type="password" 
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-ring transition-colors placeholder:text-muted-foreground/70"
            placeholder="Şifrenizi tekrar girin"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="mt-4 w-full bg-primary hover:bg-primary/90 text-foreground font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
        >
          {loading ? "Kaydediliyor..." : (
            <>Şifreyi Güncelle ve Giriş Yap <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>
    </div>
  )
}
