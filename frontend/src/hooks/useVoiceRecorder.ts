import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_DURATION_SECONDS = 120;

const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
];

function getSupportedMimeType(): string {
  for (const mime of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
}

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  elapsedSeconds: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<File | null>;
  cancelRecording: () => void;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveRef = useRef<((file: File | null) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    setElapsedSeconds(0);
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];

    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;

    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

    recorder.start(250);
    setIsRecording(true);
    setElapsedSeconds(0);

    timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    autoStopRef.current = setTimeout(() => {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    }, MAX_DURATION_SECONDS * 1000);
  }, [isRecording]);

  const stopRecording = useCallback((): Promise<File | null> => {
    return new Promise(resolve => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state !== 'recording') { cleanup(); resolve(null); return; }
      resolveRef.current = resolve;
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const ext = mimeType.split('/')[1]?.split(';')[0] ?? 'webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const file = new File([blob], `voice-message.${ext}`, { type: mimeType });
        cleanup();
        resolveRef.current?.(file);
        resolveRef.current = null;
      };
      recorder.stop();
    });
  }, [cleanup]);

  const cancelRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    resolveRef.current?.(null);
    resolveRef.current = null;
    cleanup();
  }, [cleanup]);

  return { isRecording, elapsedSeconds, startRecording, stopRecording, cancelRecording };
}
