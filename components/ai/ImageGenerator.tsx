
import React, { useState } from 'react';
import { generateImage } from '../../services/gemini';
import { SparklesIcon } from '../Icons';

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedImage(null);
        try {
            const imageUrl = await generateImage(prompt, aspectRatio);
            setGeneratedImage(imageUrl);
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate image: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-purple-400">Image Generation</h2>
            <p className="text-neutral-400">Describe the image you want to create. Powered by Imagen 4.</p>
            
            <div>
                <label htmlFor="img-prompt" className="block text-sm font-medium text-neutral-300 mb-1">Prompt</label>
                <textarea
                    id="img-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A majestic lion wearing a crown, studio lighting, hyperrealistic"
                    className="w-full h-24 bg-neutral-900 border border-neutral-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                    disabled={isLoading}
                />
            </div>

            <div>
                 <label className="block text-sm font-medium text-neutral-300 mb-2">Aspect Ratio</label>
                 <div className="flex flex-wrap gap-2">
                    {(["1:1", "16:9", "9:16", "4:3", "3:4"] as AspectRatio[]).map(ratio => (
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
                            {ratio}
                         </button>
                    ))}
                 </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className="w-full px-6 py-2 rounded-lg text-lg font-semibold transition flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-neutral-600 disabled:cursor-not-allowed"
            >
                <SparklesIcon className="w-5 h-5" />
                {isLoading ? 'Generating...' : 'Generate Image'}
            </button>
            
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <div className="mt-4 w-full aspect-square bg-neutral-900/50 rounded-lg border border-neutral-700 flex items-center justify-center">
                 {isLoading && (
                    <div className="text-center text-neutral-400">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
                        <p className="mt-4">Conjuring pixels...</p>
                    </div>
                )}
                {generatedImage && !isLoading && (
                    <img src={generatedImage} alt="Generated art" className="max-w-full max-h-full object-contain rounded-lg" />
                )}
                 {!generatedImage && !isLoading && (
                    <p className="text-neutral-500">Your generated image will appear here.</p>
                )}
            </div>
        </div>
    );
};
