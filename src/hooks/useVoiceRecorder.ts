"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  getVoiceRecordingMimeType,
  voiceFilenameForMime,
} from "@/lib/chat-upload"

export function useVoiceRecorder(onRecorded: (file: File) => void) {
  const [isRecording, setIsRecording] = useState(false)
  const [durationSec, setDurationSec] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanupStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    mediaRecorderRef.current = null
    chunksRef.current = []
    setDurationSec(0)
  }, [])

  useEffect(() => {
    return () => {
      cleanupStream()
    }
  }, [cleanupStream])

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === "inactive") {
      cleanupStream()
      setIsRecording(false)
      return
    }

    recorder.onstop = () => {
      const mimeType = recorder.mimeType || getVoiceRecordingMimeType()
      const blob = new Blob(chunksRef.current, { type: mimeType })
      if (blob.size > 0) {
        onRecorded(
          new File([blob], voiceFilenameForMime(mimeType), { type: mimeType }),
        )
      }
      cleanupStream()
      setIsRecording(false)
    }

    recorder.stop()
  }, [cleanupStream, onRecorded])

  const startRecording = useCallback(async () => {
    setError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Tarayıcınız ses kaydını desteklemiyor")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const mimeType = getVoiceRecordingMimeType()
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.start(250)
      setIsRecording(true)
      setDurationSec(0)
      timerRef.current = setInterval(() => {
        setDurationSec((prev) => prev + 1)
      }, 1000)
    } catch {
      cleanupStream()
      setError("Mikrofon izni gerekli")
      setIsRecording(false)
    }
  }, [cleanupStream])

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording()
      return
    }
    await startRecording()
  }, [isRecording, startRecording, stopRecording])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return {
    isRecording,
    durationSec,
    durationLabel: formatDuration(durationSec),
    error,
    toggleRecording,
    stopRecording,
  }
}
