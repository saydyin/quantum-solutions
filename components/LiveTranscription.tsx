
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createBlob } from '../../services/gemini';
import { MicIcon, CopyIcon } from './Icons';

type LiveSession = Awaited<ReturnType<InstanceType<typeof GoogleGenAI>['live']['connect']>>;

export const LiveTranscription: React.FC = () => {
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [status, setStatus] = useState('Idle');
    const [error, setError] = useState('');
    const [transcript, setTranscript] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const stopTranscriptionCleanup = useCallback(() => {
        console.log('Cleaning up transcription resources.');
        streamRef.current?.getTracks().forEach(track => track.stop());
        
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
        }
        sourceRef.current?.disconnect();

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }

        streamRef.current = null;
        processorRef.current = null;
        sourceRef.current = null;
        audioContextRef.current = null;
        sessionPromiseRef.current = null;
    }, []);

    const handleStopTranscription = useCallback(() => {
        setIsTranscribing(false);
        setStatus('Stopping...');
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
        }
        stopTranscriptionCleanup();
        setStatus('Idle');
    }, [stopTranscriptionCleanup]);

    const handleStartTranscription = useCallback(async () => {
        setIsTranscribing(true);
        setStatus('Initializing...');
        setError('');
        setTranscript('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            sourceRef.current = source;
            processorRef.current = processor;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        console.log('Live transcription session opened.');
                        setStatus('Listening...');
                        processor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(processor);
                        processor.connect(audioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            setTranscript(prev => prev + message.serverContent.inputTranscription.text);
                        }
                        if (message.serverContent?.turnComplete && message.serverContent?.inputTranscription?.text) {
                             setTranscript(prev => prev + ' ');
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setError('An error occurred during transcription. Please try again.');
                        handleStopTranscription();
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Live session closed.');
                        stopTranscriptionCleanup();
                        if (isTranscribing) { // Check if it was closed unexpectedly
                           setIsTranscribing(false);
                           setStatus('Idle');
                        }
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO], // Required, but we won't process audio output
                    inputAudioTranscription: {},
                },
            });

        } catch (err) {
            console.error('Error starting transcription:', err);
            setError('Could not start microphone. Please ensure access is granted.');
            setIsTranscribing(false);
            setStatus('Error');
        }
    }, [handleStopTranscription, stopTranscriptionCleanup, isTranscribing]);
    
    useEffect(() => {
        return () => {
            if (isTranscribing) {
                handleStopTranscription();
            }
        };
    }, [isTranscribing, handleStopTranscription]);

    const handleCopy = () => {
        if (!transcript) return;
        navigator.clipboard.writeText(transcript).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    return (
        <div className="space-y-4 text-center">
            <h2 className="text-xl font-bold text-purple-400">Live Transcription</h2>
            <p className="text-neutral-400">Speak into your microphone and see the real-time transcription below.</p>
            
            <button
                onClick={isTranscribing ? handleStopTranscription : handleStartTranscription}
                className={`mx-auto w-48 px-6 py-3 rounded-full text-lg font-semibold transition flex items-center justify-center gap-3 shadow-lg ${
                    isTranscribing 
                        ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
            >
                <MicIcon className="w-6 h-6" />
                {isTranscribing ? 'Stop' : 'Start Transcribing'}
            </button>
            <p className="text-neutral-500 text-sm h-5">{status}</p>

            <div className="text-left w-full h-80 bg-neutral-900/50 p-4 rounded-lg border border-neutral-700 overflow-y-auto relative">
                <p className="whitespace-pre-wrap text-neutral-200">{transcript}</p>
                {transcript && (
                    <button onClick={handleCopy} className="absolute top-3 right-3 text-neutral-400 hover:text-white transition" title="Copy Transcript">
                        {copySuccess ? <span className="text-xs text-green-400">Copied!</span> : <CopyIcon className="w-5 h-5" />}
                    </button>
                )}
                 {!transcript && !isTranscribing && (
                    <p className="text-center text-neutral-500 pt-16">Start transcribing to see your speech converted to text here.</p>
                 )}
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        </div>
    );
};
