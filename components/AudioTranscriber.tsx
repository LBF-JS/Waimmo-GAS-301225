import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { MicrophoneIcon, StopIcon } from './Icons';

// Helper functions for audio
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Clamp values to avoid distortion
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// The component itself
export const AudioTranscriber: React.FC<{
  onTranscriptionUpdate: (text: string) => void;
  onTranscriptionComplete: (text: string) => void;
  onStatusChange: (status: 'idle' | 'recording' | 'error', message?: string) => void;
}> = ({ onTranscriptionUpdate, onTranscriptionComplete, onStatusChange }) => {
    const [isRecording, setIsRecording] = useState(false);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const stopRecording = useCallback(async () => {
        if (processorRef.current && audioContextRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
            processorRef.current = null;
        }
        if (sourceNodeRef.current) {
             sourceNodeRef.current.disconnect();
             sourceNodeRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            await audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (sessionPromiseRef.current) {
            try {
              const session = await sessionPromiseRef.current;
              session.close();
            } catch (e) { console.error("Error closing session", e); }
            sessionPromiseRef.current = null;
        }
        setIsRecording(false);
        onStatusChange('idle');
    }, [onStatusChange]);

    const startRecording = useCallback(async () => {
        onStatusChange('recording');
        let fullTranscription = '';
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setIsRecording(true);
                        if (!audioContextRef.current || !streamRef.current) return;
                        sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
                        processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        processorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        sourceNodeRef.current.connect(processorRef.current);
                        processorRef.current.connect(audioContextRef.current.destination);
                    },
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            onTranscriptionUpdate(text);
                            fullTranscription += text;
                        }
                        if (message.serverContent?.turnComplete) {
                            onTranscriptionComplete(fullTranscription);
                            fullTranscription = '';
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        onStatusChange('error', 'Une erreur de connexion est survenue.');
                        stopRecording();
                    },
                    onclose: (e: CloseEvent) => {
                        stopRecording();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO], 
                    inputAudioTranscription: {},
                },
            });

        } catch (err) {
            console.error("Failed to start recording", err);
            onStatusChange('error', 'Impossible d\'accéder au microphone.');
            setIsRecording(false);
        }
    }, [onTranscriptionUpdate, onTranscriptionComplete, onStatusChange, stopRecording]);

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isRecording) {
                stopRecording();
            }
        };
    }, [isRecording, stopRecording]);

    return (
      <button 
        type="button" 
        onClick={toggleRecording} 
        className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-brand-light hover:bg-brand text-white'}`}
        aria-label={isRecording ? 'Arrêter l\'enregistrement' : 'Commencer l\'enregistrement'}
      >
        {isRecording ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
      </button>
    )
};
