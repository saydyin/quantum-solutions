
import React, { useState } from 'react';
import { generateSpeech } from '../../services/gemini';
import { SparklesIcon } from '../Icons';

export const TextToSpeech: React.FC = () => {
    const [text, setText] = useState('Hello! I am a friendly AI from Quantum Solutions. Have a wonderful day!');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

    const handleSpeak = async () => {
        if (!text.trim()) {
            setError('Please enter some text to speak.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            setAudioContext(ctx);

            const audioBuffer = await generateSpeech(text, ctx);
            
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start();

        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate speech: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-purple-400">Text-to-Speech</h2>
            <p className="text-neutral-400">Convert text into natural-sounding speech. Powered by Gemini.</p>
            
            <div>
                <label htmlFor="tts-text" className="block text-sm font-medium text-neutral-300 mb-1">Text</label>
                <textarea
                    id="tts-text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter the text you want to hear..."
                    className="w-full h-40 bg-neutral-900 border border-neutral-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                    disabled={isLoading}
                />
            </div>

            <button
                onClick={handleSpeak}
                disabled={isLoading || !text.trim()}
                className="w-full px-6 py-2 rounded-lg text-lg font-semibold transition flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-neutral-600 disabled:cursor-not-allowed"
            >
                <SparklesIcon className="w-5 h-5" />
                {isLoading ? 'Generating Audio...' : 'Speak'}
            </button>
            
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        </div>
    );
};
