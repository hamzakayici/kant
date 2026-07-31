import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns"
import { tr } from "date-fns/locale"

interface DatePickerPopoverProps {
  initialStartDate: Date | null
  initialDueDate: Date | null
  initialReminderMinutes: number | null
  initialIsRecurring: boolean
  onSave: (data: { startDate: Date | null, dueDate: Date | null, reminderMinutes: number | null, isRecurring: boolean }) => void
  onClose: () => void
  onRemove: () => void
}

export default function DatePickerPopover({
  initialStartDate,
  initialDueDate,
  initialReminderMinutes,
  initialIsRecurring,
  onSave,
  onClose,
  onRemove
}: DatePickerPopoverProps) {
  const [currentMonth, setCurrentMonth] = useState(initialDueDate || new Date())
  
  const [hasStartDate, setHasStartDate] = useState(!!initialStartDate)
  const [startDateStr, setStartDateStr] = useState(initialStartDate ? format(initialStartDate, "yyyy-MM-dd") : "")
  
  const [hasDueDate, setHasDueDate] = useState(!!initialDueDate)
  const [dueDateStr, setDueDateStr] = useState(initialDueDate ? format(initialDueDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"))
  const [dueTimeStr, setDueTimeStr] = useState(initialDueDate ? format(initialDueDate, "HH:mm") : "12:00")
  
  const [isRecurring, setIsRecurring] = useState(initialIsRecurring)
  const [reminder, setReminder] = useState<number | null>(initialReminderMinutes)

  const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const startDate = monthStart
  const endDate = monthEnd
  const dateFormat = "d"
  const dateInterval = eachDayOfInterval({ start: startDate, end: endDate })

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const handleDayClick = (day: Date) => {
    const formatted = format(day, "yyyy-MM-dd")
    if (hasStartDate && !hasDueDate) {
      setHasDueDate(true)
      setDueDateStr(formatted)
    } else if (!hasStartDate && hasDueDate) {
      setDueDateStr(formatted)
    } else {
      setHasDueDate(true)
      setDueDateStr(formatted)
    }
  }

  const handleSave = () => {
    let finalStart = null
    if (hasStartDate && startDateStr) {
      finalStart = new Date(startDateStr)
    }

    let finalDue = null
    if (hasDueDate && dueDateStr) {
      const timeParts = dueTimeStr.split(":")
      finalDue = new Date(dueDateStr)
      if (timeParts.length === 2) {
        finalDue.setHours(parseInt(timeParts[0], 10))
        finalDue.setMinutes(parseInt(timeParts[1], 10))
      }
    }

    onSave({
      startDate: finalStart,
      dueDate: finalDue,
      reminderMinutes: reminder,
      isRecurring: isRecurring
    })
  }

  return (
    <div className="absolute top-full left-0 mt-2 w-80 bg-muted border border-border rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col text-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border relative">
        <div className="absolute left-0 right-0 text-center font-semibold text-muted-foreground pointer-events-none">Tarihler</div>
        <div className="w-6" />
        <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors z-10"><X className="w-4 h-4" /></button>
      </div>

      <div className="p-4 overflow-y-auto max-h-[400px] custom-scrollbar">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1 rounded hover:bg-accent text-muted-foreground"><ChevronLeft className="w-4 h-4" /></button>
            <span className="font-semibold text-foreground">{format(currentMonth, "MMMM yyyy", { locale: tr })}</span>
            <button onClick={nextMonth} className="p-1 rounded hover:bg-accent text-muted-foreground"><ChevronRight className="w-4 h-4" /></button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {days.map(d => <div key={d} className="text-xs font-semibold text-muted-foreground py-1">{d}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} className="p-1.5" />
            ))}
            
            {dateInterval.map((day: Date, i: number) => {
              const isSelectedDue = hasDueDate && dueDateStr === format(day, "yyyy-MM-dd")
              const isSelectedStart = hasStartDate && startDateStr === format(day, "yyyy-MM-dd")
              
              let bgClass = "hover:bg-accent text-muted-foreground"
              if (isSelectedDue) bgClass = "bg-primary text-foreground font-semibold"
              else if (isSelectedStart) bgClass = "bg-primary text-foreground font-semibold"
              else if (isToday(day)) bgClass = "bg-muted text-primary font-semibold"

              return (
                <button
                  key={i}
                  onClick={() => handleDayClick(day)}
                  className={`p-1.5 rounded-md text-sm transition-colors ${bgClass}`}
                >
                  {format(day, dateFormat)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Başlangıç Tarihi</label>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={hasStartDate} 
                onChange={(e) => setHasStartDate(e.target.checked)}
                className="rounded border-border bg-transparent"
              />
              <input 
                type="date"
                disabled={!hasStartDate}
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="flex-1 bg-muted border border-border rounded-lg px-2 py-1.5 text-sm text-muted-foreground focus:outline-none focus:border-ring disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Bitiş Tarihi</label>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={hasDueDate} 
                onChange={(e) => setHasDueDate(e.target.checked)}
                className="rounded border-border bg-transparent"
              />
              <input 
                type="date"
                disabled={!hasDueDate}
                value={dueDateStr}
                onChange={(e) => setDueDateStr(e.target.value)}
                className="flex-1 w-[120px] bg-muted border border-border rounded-lg px-2 py-1.5 text-sm text-muted-foreground focus:outline-none focus:border-ring disabled:opacity-50"
              />
              <input 
                type="time"
                disabled={!hasDueDate}
                value={dueTimeStr}
                onChange={(e) => setDueTimeStr(e.target.value)}
                className="w-[90px] bg-muted border border-border rounded-lg px-2 py-1.5 text-sm text-muted-foreground focus:outline-none focus:border-ring disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tekrarlayan</label>
            <select 
              value={isRecurring ? "yes" : "no"}
              onChange={(e) => setIsRecurring(e.target.value === "yes")}
              className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-sm text-muted-foreground focus:outline-none focus:border-ring appearance-none"
            >
              <option value="no">Hiçbir zaman</option>
              <option value="yes">Evet (Aktif)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Anımsatıcı Ayarla</label>
            <select 
              value={reminder === null ? "null" : reminder.toString()}
              onChange={(e) => {
                const val = e.target.value
                setReminder(val === "null" ? null : parseInt(val, 10))
              }}
              className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-sm text-muted-foreground focus:outline-none focus:border-ring appearance-none"
            >
              <option value="null">Yok</option>
              <option value="0">Vadesinde</option>
              <option value="5">5 Dakika Önce</option>
              <option value="10">10 Dakika Önce</option>
              <option value="15">15 Dakika Önce</option>
              <option value="60">1 Saat Önce</option>
              <option value="120">2 Saat Önce</option>
              <option value="1440">1 Gün Önce</option>
              <option value="2880">2 Gün Önce</option>
            </select>
            <p className="text-xs text-muted-foreground mt-2">
              Anımsatıcılar bu kartın tüm üyelerine ve izleyicilerine gönderilecektir. (Görsel temsil)
            </p>
          </div>
          
          <div className="pt-2 flex flex-col gap-2">
            <button 
              onClick={handleSave}
              className="w-full bg-primary hover:bg-primary text-foreground font-medium py-1.5 rounded-lg transition-colors"
            >
              Kaydet
            </button>
            <button 
              onClick={onRemove}
              className="w-full bg-transparent hover:bg-accent border border-border text-muted-foreground font-medium py-1.5 rounded-lg transition-colors"
            >
              Kaldır
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
