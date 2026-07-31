import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { FileDown, Lock, Calendar, FileText } from "lucide-react"
import { getAttachmentUrl, isOpenCloudHttpUrl } from "@/lib/attachment-url"

// Formatting bytes to readable size
function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bayt"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bayt", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export default async function PublicSharePage({
  params
}: {
  params: { token: string }
}) {
  const { token } = await params;

  const sharedLink = await prisma.sharedLink.findUnique({
    where: { token },
    include: { attachment: true }
  })

  if (!sharedLink) {
    notFound()
  }

  const isExpired = sharedLink.expiresAt && new Date() > sharedLink.expiresAt
  const requiresPassword = !!sharedLink.password
  const openCloudUrl = getAttachmentUrl(sharedLink.attachment)
  const downloadUrl = isOpenCloudHttpUrl(openCloudUrl)
    ? openCloudUrl
    : `/api/download/${token}`

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 relative overflow-hidden text-foreground">
      {/* Background blobs for premium glassmorphism effect */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob animation-delay-2000" />
      
      <div className="relative z-10 w-full max-w-lg p-8 backdrop-blur-2xl bg-muted border border-border rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-tr from-primary to-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6">
            <FileText className="w-10 h-10 text-foreground" />
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dosya Paylaşımı</h1>
          <p className="text-muted-foreground">Sizinle bir dosya paylaşıldı</p>
        </div>

        <div className="bg-black/20 rounded-2xl p-6 border border-border mb-8 text-left">
          <div className="font-medium text-lg mb-1 truncate text-foreground" title={sharedLink.attachment.filename}>
            {sharedLink.attachment.filename}
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-4">
            <span className="flex items-center gap-1"><FileDown className="w-4 h-4" /> {formatBytes(sharedLink.attachment.size)}</span>
            {sharedLink.expiresAt && (
              <span className="flex items-center gap-1 text-orange-400">
                <Calendar className="w-4 h-4" /> 
                {new Date(sharedLink.expiresAt).toLocaleDateString('tr-TR')} tarihine kadar geçerli
              </span>
            )}
          </div>
        </div>

        {isExpired ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center font-medium">
            Bu bağlantının süresi dolmuş.
          </div>
        ) : requiresPassword ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-yellow-500 mb-4 bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
              <Lock className="w-5 h-5" />
              <span className="text-sm font-medium">Bu dosya şifre ile korunmaktadır.</span>
            </div>
            
            <form method="GET" action={downloadUrl} className="flex flex-col gap-3">
              <input
                type="password"
                name="password"
                placeholder="İndirme şifresini girin"
                required
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-foreground placeholder:text-muted-foreground"
              />
              <button 
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-foreground font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center group"
              >
                Dosyayı İndir
                <FileDown className="w-5 h-5 ml-2 group-hover:translate-y-1 transition-transform" />
              </button>
            </form>
          </div>
        ) : (
          <a
            href={downloadUrl}
            className="w-full py-4 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-foreground font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center group text-lg"
          >
            Dosyayı İndir
            <FileDown className="w-6 h-6 ml-2 group-hover:translate-y-1 transition-transform" />
          </a>
        )}
      </div>
    </div>
  )
}
