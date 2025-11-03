
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, decodeAudioData, encode, createBlob } from '../../services/gemini';
import { MicIcon } from '../Icons';

// FIX: Define the LiveSession type by inferring it from the SDK.
// This avoids needing to import a non-exported type.
type LiveSession = Awaited<ReturnType<InstanceType<typeof GoogleGenAI>['live']['connect']>>;

interface TranscriptionEntry {
    speaker: 'user' | 'model';
    text: string;
}

export const LiveConversation: React.FC = () => {
    const [isConversing, setIsConversing] = useState(false);
    const [status, setStatus] = useState('Idle');
    const [error, setError] = useState('');
    const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRefs = useRef<{
        input: AudioContext | null,
        output: AudioContext | null,
        micSource: MediaStreamAudioSourceNode | null,
        processor: ScriptProcessorNode | null,
        stream: MediaStream | null,
    }>({ input: null, output: null, micSource: null, processor: null, stream: null });
    
    const outputAudioState = useRef<{ nextStartTime: number, sources: Set<AudioBufferSourceNode> }>({ nextStartTime: 0, sources: new Set() });

    const stopConversationCleanup = useCallback(() => {
        console.log('Cleaning up conversation resources.');
        audioContextRefs.current.stream?.getTracks().forEach(track => track.stop());
        
        if (audioContextRefs.current.processor) {
            audioContextRefs.current.processor.disconnect();
            audioContextRefs.current.processor.onaudioprocess = null;
        }
        if(audioContextRefs.current.micSource) {
            audioContextRefs.current.micSource.disconnect();
        }

        if (audioContextRefs.current.input && audioContextRefs.current.input.state !== 'closed') {
            audioContextRefs.current.input.close();
        }
        if (audioContextRefs.current.output && audioContextRefs.current.output.state !== 'closed') {
             outputAudioState.current.sources.forEach(source => source.stop());
             outputAudioState.current.sources.clear();
             audioContextRefs.current.output.close();
        }

        Object.assign(audioContextRefs.current, { input: null, output: null, micSource: null, processor: null, stream: null });
        Object.assign(outputAudioState.current, { nextStartTime: 0 });
        sessionPromiseRef.current = null;
    }, []);

    const handleStopConversation = useCallback(() => {
        setIsConversing(false);
        setStatus('Stopping...');
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
        }
        stopConversationCleanup();
        setStatus('Idle');
    }, [stopConversationCleanup]);

    const handleStartConversation = useCallback(async () => {
        setIsConversing(true);
        setStatus('Initializing...');
        setError('');
        setTranscription([]);
        let currentInputTranscription = '';
        let currentOutputTranscription = '';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRefs.current.stream = stream;
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRefs.current.input = inputAudioContext;
            audioContextRefs.current.output = outputAudioContext;

            const micSource = inputAudioContext.createMediaStreamSource(stream);
            const processor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            audioContextRefs.current.micSource = micSource;
            audioContextRefs.current.processor = processor;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        console.log('Live session opened.');
                        setStatus('Listening...');
                        processor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        micSource.connect(processor);
                        processor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                         if (message.serverContent?.inputTranscription) {
                            currentInputTranscription += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscription += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.turnComplete) {
                             setTranscription(prev => [
                                ...prev,
                                { speaker: 'user', text: currentInputTranscription.trim() },
                                { speaker: 'model', text: currentOutputTranscription.trim() }
                             ]);
                            currentInputTranscription = '';
                            currentOutputTranscription = '';
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && audioContextRefs.current.output) {
                            const oCtx = audioContextRefs.current.output;
                            outputAudioState.current.nextStartTime = Math.max(outputAudioState.current.nextStartTime, oCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), oCtx, 24000, 1);
                            const source = oCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(oCtx.destination);
                            source.addEventListener('ended', () => outputAudioState.current.sources.delete(source));
                            source.start(outputAudioState.current.nextStartTime);
                            outputAudioState.current.nextStartTime += audioBuffer.duration;
                            outputAudioState.current.sources.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setError('An error occurred during the conversation. Please try again.');
                        handleStopConversation();
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Live session closed.');
                        stopConversationCleanup();
                         if (isConversing) {
                            setIsConversing(false);
                            setStatus('Idle');
                        }
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
            });

        } catch (err) {
            console.error('Error starting conversation:', err);
            setError('Could not start microphone. Please ensure access is granted.');
            setIsConversing(false);
            setStatus('Error');
        }
    }, [handleStopConversation, stopConversationCleanup, isConversing]);
    
     useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (isConversing) {
                handleStopConversation();
            }
        };
    }, [isConversing, handleStopConversation]);

    return (
        <div className="space-y-4 text-center">
            <h2 className="text-xl font-bold text-purple-400">Live Conversation</h2>
            <p className="text-neutral-400">Speak directly with Gemini and get real-time audio responses.</p>
            
            <button
                onClick={isConversing ? handleStopConversation : handleStartConversation}
                className={`mx-auto w-32 px-6 py-2 rounded-lg text-lg font-semibold transition flex items-center justify-center gap-2 ${
                    isConversing 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
            >
                <MicIcon className="w-5 h-5" />
                {isConversing ? 'Stop' : 'Start'}
            </button>
            <p className="text-neutral-500 text-sm">Status: {status}</p>

            <div className="text-left w-full h-80 bg-neutral-900/50 p-4 rounded-lg border border-neutral-700 overflow-y-auto space-y-4">
                {transcription.map((entry, index) => (
                    <div key={index} className={`flex flex-col ${entry.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                         <p className={`text-xs mb-1 ${entry.speaker === 'user' ? 'text-purple-400' : 'text-teal-400'}`}>{entry.speaker === 'user' ? 'You' : 'Gemini'}</p>
                         <p className={`max-w-[85%] px-4 py-2 rounded-xl text-white ${entry.speaker === 'user' ? 'bg-purple-600' : 'bg-neutral-600'}`}>
                           {entry.text}
                         </p>
                    </div>
                ))}
                 {transcription.length === 0 && !isConversing && (
                    <p className="text-center text-neutral-500 pt-16">Conversation transcript will appear here.</p>
                 )}
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        </div>
    );
};
