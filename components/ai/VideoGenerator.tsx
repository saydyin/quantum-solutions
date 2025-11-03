
import React, { useState, useRef, useEffect } from 'react';
import { generateVideo } from '../../services/gemini';
import { fileToBase64 } from '../../utils/helpers';
import { SparklesIcon, PhotoIcon } from '../Icons';

type AspectRatio = "16:9" | "9:16";

const loadingMessages = [
    "Initializing hyper-dimensional render core...",
    "Brewing a fresh pot of coffee for the AI...",
    "Teaching the model about cinematography...",
    "This can take a few minutes, please wait...",
    "Assembling video from pure imagination...",
    "Polishing the final frames...",
    "The AI is hard at work, almost there..."
];

export const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [sourceImage, setSourceImage] = useState<{ file: File, url: string } | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const [error, setError] = useState('');
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const loadingIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
                setApiKeySelected(true);
            }
        };
        checkApiKey();
    }, []);

    useEffect(() => {
        if (isLoading) {
            loadingIntervalRef.current = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 4000);
        } else if (loadingIntervalRef.current) {
            clearInterval(loadingIntervalRef.current);
        }
        return () => {
            if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
        };
    }, [isLoading]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Please upload a valid image file.');
                return;
            }
            setSourceImage({ file, url: URL.createObjectURL(file) });
            setError('');
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim() && !sourceImage) {
            setError('Please enter a prompt or upload an image.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedVideo(null);
        setLoadingMessage(loadingMessages[0]);
        
        try {
            const imagePayload = sourceImage ? {
                data: await fileToBase64(sourceImage.file),
                mimeType: sourceImage.file.type
            } : null;

            const videoUrl = await generateVideo(prompt, aspectRatio, imagePayload);
            setGeneratedVideo(videoUrl);
        } catch (err) {
            console.error(err);
            let message = err instanceof Error ? err.message : 'An unknown error occurred.';
            if (message.includes('Requested entity was not found')) {
                message = "API Key not valid. Please select a valid key.";
                setApiKeySelected(false);
            }
            setError(`Failed to generate video: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true); // Assume success to avoid race conditions
        }
    }

    if (!apiKeySelected) {
        return (
            <div className="text-center">
                 <h2 className="text-xl font-bold text-purple-400 mb-4">Video Generation with Veo</h2>
                 <p className="text-neutral-400 mb-4">Video generation requires a Google AI API key with access to the Veo model.</p>
                 <p className="text-neutral-500 text-sm mb-4">For billing information, please visit <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline text-purple-400">ai.google.dev/gemini-api/docs/billing</a>.</p>
                 <button onClick={handleSelectKey} className="px-6 py-2 rounded-lg text-lg font-semibold transition bg-purple-600 hover:bg-purple-700 text-white">
                    Select API Key
                 </button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-purple-400">Video Generation</h2>
            <p className="text-neutral-400">Create a short video from a text prompt or an image. Powered by Veo.</p>
            
            <div>
                <label htmlFor="video-prompt" className="block text-sm font-medium text-neutral-300 mb-1">Prompt</label>
                <textarea
                    id="video-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A majestic eagle flying over a mountain range at sunset"
                    className="w-full h-24 bg-neutral-900 border border-neutral-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                    disabled={isLoading}
                />
            </div>
            
             <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Starting Image (Optional)</label>
                 <div 
                    className="w-full h-24 bg-neutral-800 border-2 border-dashed border-neutral-600 rounded-lg flex items-center justify-center text-center text-neutral-400 cursor-pointer hover:border-purple-500 hover:bg-neutral-700/50 transition relative"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {sourceImage ? (
                        <img src={sourceImage.url} alt="Source" className="max-w-full max-h-full object-contain rounded" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <PhotoIcon className="w-8 h-8" />
                            <p>Click to upload</p>
                        </div>
                    )}
                </div>
                 <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </div>

            <div>
                 <label className="block text-sm font-medium text-neutral-300 mb-2">Aspect Ratio</label>
                 <div className="flex flex-wrap gap-2">
                    {(["16:9", "9:16"] as AspectRatio[]).map(ratio => (
                         <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            disabled={isLoading}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                aspectRatio === ratio
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
                            }`}
                         >
                            {ratio} {ratio === "16:9" ? '(Landscape)' : '(Portrait)'}
                         </button>
                    ))}
                 </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={isLoading || (!prompt.trim() && !sourceImage)}
                className="w-full px-6 py-2 rounded-lg text-lg font-semibold transition flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-neutral-600 disabled:cursor-not-allowed"
            >
                <SparklesIcon className="w-5 h-5" />
                {isLoading ? 'Generating Video...' : 'Generate Video'}
            </button>
            
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <div className="mt-4 w-full aspect-video bg-neutral-900/50 rounded-lg border border-neutral-700 flex items-center justify-center">
                 {isLoading && (
                    <div className="text-center text-neutral-400">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
                        <p className="mt-4">{loadingMessage}</p>
                    </div>
                )}
                {generatedVideo && !isLoading && (
                    <video src={generatedVideo} controls autoPlay loop className="max-w-full max-h-full object-contain rounded-lg" />
                )}
                 {!generatedVideo && !isLoading && (
                    <p className="text-neutral-500">Your generated video will appear here.</p>
                )}
            </div>
        </div>
    );
};
