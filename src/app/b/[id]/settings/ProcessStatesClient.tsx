"use client"

import { useState } from "react"
import { GripVertical, Plus, Trash2 } from "lucide-react"
import { updateColumn, createColumn, deleteColumn } from "@/app/actions"

import { useModal } from "@/components/providers/ModalProvider"

const CATEGORIES = [
  "BACKLOG",
  "UNSTARTED",
  "ACTIVE",
  "DONE STATUS / WON",
  "DONE STATUS / LOST",
] as const

const CATEGORY_LABELS: Record<string, string> = {
  BACKLOG: "Bekleyen",
  UNSTARTED: "Başlanmadı",
  ACTIVE: "Aktif",
  "DONE STATUS / WON": "Tamamlandı (Kazanıldı)",
  "DONE STATUS / LOST": "Tamamlandı (Kaybedildi)",
}

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6",
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#71717a", "#64748b"
]

export default function ProcessStatesClient({ boardId, initialColumns }: { boardId: string, initialColumns: any[] }) {
  const { showConfirm } = useModal()
  const [columns, setColumns] = useState(initialColumns)
  const [selectedColId, setSelectedColId] = useState<string | null>(initialColumns[0]?.id || null)

  const selectedCol = columns.find(c => c.id === selectedColId)

  const handleUpdate = async (id: string, field: string, value: any) => {
    // Optimistic UI update
    setColumns(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
    
    // Server update
    try {
      await updateColumn(id, { [field]: value })
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreate = async (category: string) => {
    try {
      const newCol = await createColumn(boardId, "Yeni Durum", category, COLORS[Math.floor(Math.random() * COLORS.length)])
      setColumns(prev => [...prev, newCol])
      setSelectedColId(newCol.id)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id: string) => {
    if (!(await showConfirm("Bu durumu silmek istediğinize emin misiniz? (İçindeki kartlar da silinebilir)"))) return
    
    setColumns(prev => prev.filter(c => c.id !== id))
    if (selectedColId === id) setSelectedColId(null)
    
    try {
      await deleteColumn(id)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 h-full bg-white text-gray-800">
      
      {/* Left Pane: Process States List */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold tracking-wider">
            <span className="w-4 h-4 border-2 border-gray-400 rounded-full"></span> SÜREÇ DURUMLARI
          </div>
          <button className="w-6 h-6 bg-primary hover:bg-primary/90 text-foreground rounded flex items-center justify-center transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4 space-y-8 custom-scrollbar">
          {CATEGORIES.map(category => {
            const categoryCols = columns.filter(c => (c.category || "ACTIVE") === category).sort((a, b) => a.order - b.order)
            
            return (
              <div key={category} className="space-y-2 relative">
                <div className="flex items-center gap-4 group">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-24 shrink-0">{CATEGORY_LABELS[category] || category}</h3>
                  <div className="h-px bg-gray-100 flex-1"></div>
                  <button 
                    onClick={() => handleCreate(category)}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 bg-green-500 text-foreground rounded-full flex items-center justify-center transition-opacity"
                    title="Bu kategoriye yeni durum ekle"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1 pl-4 border-l-2 border-transparent">
                  {categoryCols.map(col => (
                    <div 
                      key={col.id} 
                      onClick={() => setSelectedColId(col.id)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group ${selectedColId === col.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: col.color || '#cbd5e1' }}>
                        {selectedColId === col.id && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.color || '#cbd5e1' }}></div>}
                      </div>
                      <span className={`text-xs font-semibold ${selectedColId === col.id ? 'text-blue-700' : 'text-muted-foreground/70'}`}>{col.name.toUpperCase()}</span>
                      
                      {selectedColId === col.id && <div className="ml-auto text-blue-500"><span className="text-[10px] font-bold">&gt;</span></div>}
                    </div>
                  ))}
                  {categoryCols.length === 0 && (
                    <div className="text-xs text-muted-foreground italic p-2 pl-9">Bu kategoride durum yok</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right Pane: Edit State */}
      <div className="w-full md:w-[400px]">
        {selectedCol ? (
          <div className="bg-white">
            <div className="flex items-center justify-between mb-8 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
              <span>Durumu Düzenle</span>
              <div className="flex items-center gap-3 text-muted-foreground">
                <button onClick={() => handleDelete(selectedCol.id)} className="hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                <span>ESC</span>
                <span>X</span>
              </div>
            </div>

            <input 
              type="text" 
              value={selectedCol.name}
              onChange={(e) => handleUpdate(selectedCol.id, 'name', e.target.value)}
              className="text-3xl font-semibold text-gray-900 border-none bg-transparent w-full focus:outline-none mb-4"
              placeholder="Durum adı"
            />
            
            <textarea 
              placeholder="Açıklama"
              className="w-full text-sm text-muted-foreground bg-transparent border-none focus:outline-none resize-none mb-12"
              rows={2}
            ></textarea>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Durum Kategorisi</label>
                <select 
                  value={selectedCol.category || "ACTIVE"}
                  onChange={(e) => handleUpdate(selectedCol.id, 'category', e.target.value)}
                  className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-muted-foreground/70 focus:outline-none"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>)}
                </select>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-200/50 rounded-lg text-xs font-semibold text-muted-foreground/70 mb-4">
                  <span>🎨 Renk</span>
                </div>
                
                <div className="grid grid-cols-6 gap-3">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => handleUpdate(selectedCol.id, 'color', color)}
                      className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                      style={{ 
                        backgroundColor: color, 
                        borderColor: selectedCol.color === color ? 'white' : color,
                        boxShadow: selectedCol.color === color ? `0 0 0 2px ${color}` : 'none'
                      }}
                    >
                      {selectedCol.color === color && <span className="text-foreground text-xs font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sıralama (Sıra No)</label>
                  <input
                    type="number"
                    value={selectedCol.order}
                    onChange={(e) => handleUpdate(selectedCol.id, 'order', parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-muted-foreground/70 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Bu Sütuna Kart Bırakabilen Roller (Giriş İzni)</label>
                  <p className="text-xs text-muted-foreground mb-3">Hiçbiri seçilmezse herkes taşıyabilir.</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "system_admin", label: "Yönetici" },
                      { id: "system_editor", label: "Editör" },
                      { id: "system_designer", label: "Tasarımcı" },
                      { id: "system_requester", label: "Talep Eden" }
                    ].map(role => {
                      const isSelected = (selectedCol.allowedRoles || []).includes(role.id)
                      return (
                        <button
                          key={role.id}
                          onClick={() => {
                            const current = selectedCol.allowedRoles || []
                            const next = isSelected ? current.filter((r: string) => r !== role.id) : [...current, role.id]
                            handleUpdate(selectedCol.id, 'allowedRoles', next)
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isSelected ? 'bg-primary text-foreground' : 'bg-gray-200 text-muted-foreground/70 hover:bg-gray-300'}`}
                        >
                          {role.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Bu Sütundan Kart Çıkarabilen Roller (Çıkış İzni)</label>
                  <p className="text-xs text-muted-foreground mb-3">Kartın bu sütundan başka sütuna (geri veya ileri) taşınmasına izin verilen roller. Boş bırakılırsa herkes taşıyabilir.</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "system_admin", label: "Yönetici" },
                      { id: "system_editor", label: "Editör" },
                      { id: "system_designer", label: "Tasarımcı" },
                      { id: "system_requester", label: "Talep Eden" }
                    ].map(role => {
                      const isSelected = (selectedCol.dragOutRoles || []).includes(role.id)
                      return (
                        <button
                          key={role.id}
                          onClick={() => {
                            const current = selectedCol.dragOutRoles || []
                            const next = isSelected ? current.filter((r: string) => r !== role.id) : [...current, role.id]
                            handleUpdate(selectedCol.id, 'dragOutRoles', next)
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isSelected ? 'bg-rose-500 text-foreground' : 'bg-gray-200 text-muted-foreground/70 hover:bg-gray-300'}`}
                        >
                          {role.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Düzenlemek için bir durum seçin
          </div>
        )}
      </div>

    </div>
  )
}
