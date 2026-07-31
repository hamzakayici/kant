"use client"

import { useState } from "react"
import { X, Search, MessageSquare, Hash, UserPlus, Send, Activity, Users } from "lucide-react"
import { createChatGroup, sendChatMessage } from "@/app/actions"

export default function InboxSidebar({ 
  onClose,
  boardId,
  userRole,
  currentUserId,
  allUsers = [],
  chatGroups = [],
  activities = []
}: { 
  onClose: () => void,
  boardId: string,
  userRole: string,
  currentUserId: string,
  allUsers?: any[],
  chatGroups?: any[],
  activities?: any[]
}) {
  const [activeTab, setActiveTab] = useState<"tumu" | "gorevler" | "sohbet">("sohbet")
  const [activeGroup, setActiveGroup] = useState<any | null>(chatGroups.length > 0 ? chatGroups[0] : null)
  
  // Create Group State
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    await createChatGroup(newGroupName, boardId, selectedUserIds)
    setIsCreatingGroup(false)
    setNewGroupName("")
    setSelectedUserIds([])
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !activeGroup) return
    setIsSending(true)
    await sendChatMessage(activeGroup.id, message)
    setMessage("")
    setIsSending(false)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] md:w-[450px] lg:w-[500px] bg-card border-l border-border shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-foreground">Gelen Kutusu</h2>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-border shrink-0">
          <button 
            onClick={() => setActiveTab("tumu")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "tumu" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-muted-foreground"}`}
          >
            <Activity className="w-4 h-4" /> Tümü
          </button>
          <button 
            onClick={() => setActiveTab("gorevler")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "gorevler" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-muted-foreground"}`}
          >
            <CheckIcon className="w-4 h-4" /> Görevler
          </button>
          <button 
            onClick={() => setActiveTab("sohbet")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "sohbet" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-muted-foreground"}`}
          >
            <MessageSquare className="w-4 h-4" /> Sohbet
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          
          {/* TASKS / ALL TAB */}
          {(activeTab === "tumu" || activeTab === "gorevler") && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {activities.length === 0 ? (
                <div className="text-center text-muted-foreground mt-10">Henüz bir etkinlik yok.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {activities.map((log: any) => (
                    <div key={log.id} className="flex gap-3 items-start p-3 hover:bg-accent rounded-lg transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs border border-primary/30">
                        {log.user?.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">{log.user?.email}</span> {log.action}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                          {log.card && <span className="ml-2 px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{log.card.title}</span>}
                        </p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === "sohbet" && (
            <div className="flex-1 flex overflow-hidden">
              
              {/* Groups List (Left) */}
              <div className="w-1/3 border-r border-border bg-card flex flex-col">
                <div className="p-3 border-b border-border flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gruplar</span>
                  {userRole === "ADMIN" && (
                    <button onClick={() => setIsCreatingGroup(!isCreatingGroup)} className="text-primary hover:text-primary p-1 rounded hover:bg-primary/10">
                      <UserPlus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  {chatGroups.map((g: any) => (
                    <button
                      key={g.id}
                      onClick={() => { setActiveGroup(g); setIsCreatingGroup(false); }}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm text-left transition-colors mb-1 ${activeGroup?.id === g.id && !isCreatingGroup ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                    >
                      <Hash className="w-4 h-4 opacity-50 shrink-0" />
                      <span className="truncate">{g.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat View (Right) */}
              <div className="w-2/3 flex flex-col bg-card">
                {isCreatingGroup ? (
                  <div className="p-4 flex flex-col h-full overflow-y-auto custom-scrollbar">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Yeni Grup Oluştur</h3>
                    <input 
                      type="text" 
                      placeholder="Grup Adı" 
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      className="bg-muted border border-border rounded-lg p-2.5 text-sm text-foreground mb-4 focus:outline-none focus:border-ring"
                    />
                    
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">Üye Ekle</h4>
                    <div className="flex flex-col gap-2 mb-4 max-h-[300px] overflow-y-auto custom-scrollbar border border-border rounded-lg p-2 bg-black/20">
                      {allUsers.filter(u => u.id !== currentUserId).map(u => (
                        <label key={u.id} className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="accent-indigo-500 w-4 h-4"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedUserIds(prev => [...prev, u.id])
                              else setSelectedUserIds(prev => prev.filter(id => id !== u.id))
                            }}
                          />
                          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                            {u.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-muted-foreground">{u.email}</span>
                        </label>
                      ))}
                    </div>
                    
                    <button 
                      onClick={handleCreateGroup}
                      disabled={!newGroupName.trim()}
                      className="mt-auto py-2.5 bg-primary hover:bg-primary disabled:opacity-50 text-foreground text-sm font-semibold rounded-lg transition-colors"
                    >
                      Oluştur
                    </button>
                  </div>
                ) : activeGroup ? (
                  <>
                    {/* Active Group Header */}
                    <div className="p-3 border-b border-border flex items-center justify-between shrink-0 bg-card">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-foreground">{activeGroup.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground" title={activeGroup.members?.map((m:any) => m.user?.email).join(', ')}>
                        <Users className="w-3.5 h-3.5" />
                        <span>{activeGroup.members?.length}</span>
                      </div>
                    </div>
                    
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                      {activeGroup.messages?.length === 0 ? (
                        <div className="m-auto text-xs text-muted-foreground/70 text-center">Bu grupta henüz mesaj yok.<br/>İlk mesajı siz gönderin!</div>
                      ) : (
                        activeGroup.messages?.map((msg: any) => {
                          const isMe = msg.authorId === currentUserId
                          return (
                            <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                              <span className="text-[10px] text-muted-foreground mb-1 px-1">{isMe ? 'Siz' : msg.author?.email}</span>
                              <div className={`px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-primary text-foreground rounded-br-sm' : 'bg-muted text-foreground border border-border rounded-bl-sm'}`}>
                                {msg.content}
                              </div>
                              <span className="text-[9px] text-muted-foreground/70 mt-1">{new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex gap-2 shrink-0">
                      <input 
                        type="text" 
                        placeholder="Mesaj yaz..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        className="flex-1 bg-black/20 border border-border rounded-full px-4 py-2 text-sm text-foreground focus:outline-none focus:border-ring"
                      />
                      <button 
                        type="submit"
                        disabled={!message.trim() || isSending}
                        className="w-9 h-9 rounded-full bg-primary hover:bg-primary disabled:opacity-50 text-foreground flex items-center justify-center transition-colors shrink-0"
                      >
                        <Send className="w-4 h-4 ml-0.5" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground/70 text-sm p-4 text-center">
                    Sohbet seçin veya yeni bir grup oluşturun.
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  )
}

function CheckIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
