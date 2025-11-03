import React, { useState, useRef } from 'react';
import { analyzeImage } from '../../services/gemini';
import { fileToBase64 } from '../../utils/helpers';
import { SparklesIcon, PhotoIcon } from '../Icons';

export const ImageAnalysis: React.FC = () => {
    const [prompt, setPrompt] = useState('Describe this image in detail.');
    const [sourceImage, setSourceImage] = useState<{ file: File, url: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Please upload a valid image file.');
                return;
            }
            setSourceImage({ file, url: URL.createObjectURL(file) });
            setAnalysisResult(null);
            setError('');
        }
    };

    const handleAnalyze = async () => {
        if (!prompt.trim() || !sourceImage) {
            setError('Please upload an image and enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysisResult(null);
        try {
            const base64Data = await fileToBase64(sourceImage.file);
            const result = await analyzeImage(prompt, base64Data, sourceImage.file.type);
            setAnalysisResult(result);
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to analyze image: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-purple-400">Image Analysis</h2>
            <p className="text-neutral-400">Upload an image and ask Gemini a question about it. Powered by Gemini 2.5 Pro.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                    className="w-full aspect-square bg-neutral-800 border-2 border-dashed border-neutral-600 rounded-lg flex items-center justify-center text-center text-neutral-400 cursor-pointer hover:border-purple-500 hover:bg-neutral-700/50 transition relative"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {sourceImage ? (
                        <img src={sourceImage.url} alt="Source for analysis" className="max-w-full max-h-full object-contain rounded" />
                    ) : (
                        <div>
                            <PhotoIcon className="w-12 h-12 mx-auto mb-2" />
                            <p>Click to upload image</p>
                        </div>
                    )}
                </div>
                 <div className="w-full aspect-square bg-neutral-900/50 rounded-lg border border-neutral-700 flex p-4 overflow-y-auto">
                    {isLoading && (
                        <div className="text-center text-neutral-400 m-auto">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
                            <p className="mt-4">Analyzing...</p>
                        </div>
                    )}
                    {analysisResult && !isLoading && (
                        <p className="text-neutral-200 whitespace-pre-wrap">{analysisResult}</p>
                    )}
                    {!analysisResult && !isLoading && (
                        <p className="text-neutral-500 m-auto">Analysis will appear here.</p>
                    )}
                </div>
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            <div>
                <label htmlFor="analysis-prompt" className="block text-sm font-medium text-neutral-300 mb-1">Question / Prompt</label>
                <textarea
                    id="analysis-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., What is happening in this image? or Is this a famous landmark?"
                    className="w-full h-24 bg-neutral-900 border border-neutral-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                    disabled={isLoading}
                />
            </div>

            <button
                onClick={handleAnalyze}
                disabled={isLoading || !prompt.trim() || !sourceImage}
                className="w-full px-6 py-2 rounded-lg text-lg font-semibold transition flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-neutral-600 disabled:cursor-not-allowed"
            >
                <SparklesIcon className="w-5 h-5" />
                {isLoading ? 'Analyzing...' : 'Analyze Image'}
            </button>
            
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        </div>
    );
};
