
import React, { useState, useRef } from 'react';
import { analyzeVideo } from '../../services/gemini';
import { SparklesIcon } from '../Icons';

export const VideoAnalysis: React.FC = () => {
    const [prompt, setPrompt] = useState('Describe this video. What are the key objects and actions?');
    const [sourceVideo, setSourceVideo] = useState<{ file: File, url: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('video/')) {
                setError('Please upload a valid video file.');
                return;
            }
            setSourceVideo({ file, url: URL.createObjectURL(file) });
            setAnalysisResult(null);
            setError('');
        }
    };

    const handleAnalyze = async () => {
        if (!prompt.trim() || !sourceVideo) {
            setError('Please upload a video and enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysisResult(null);
        try {
            const result = await analyzeVideo(prompt, sourceVideo.file);
            setAnalysisResult(result);
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to analyze video: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-purple-400">Video Analysis</h2>
            <p className="text-neutral-400">Upload a video and ask Gemini a question about it. This uses a powerful model, so analysis may take some time. Powered by Gemini 2.5 Pro.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                     <div 
                        className="w-full aspect-video bg-neutral-800 border-2 border-dashed border-neutral-600 rounded-lg flex items-center justify-center text-center text-neutral-400 cursor-pointer hover:border-purple-500 hover:bg-neutral-700/50 transition relative"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {sourceVideo ? (
                            <video src={sourceVideo.url} controls className="max-w-full max-h-full object-contain rounded" />
                        ) : (
                            <p>Click to upload video</p>
                        )}
                    </div>
                    <input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>
                 <div className="w-full aspect-video bg-neutral-900/50 rounded-lg border border-neutral-700 flex p-4 overflow-y-auto">
                    {isLoading && (
                        <div className="text-center text-neutral-400 m-auto">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
                            <p className="mt-4">Analyzing video frames...</p>
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

            <div>
                <label htmlFor="video-analysis-prompt" className="block text-sm font-medium text-neutral-300 mb-1">Question / Prompt</label>
                <textarea
                    id="video-analysis-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., What is the main subject of this video?"
                    className="w-full h-24 bg-neutral-900 border border-neutral-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                    disabled={isLoading}
                />
            </div>

            <button
                onClick={handleAnalyze}
                disabled={isLoading || !prompt.trim() || !sourceVideo}
                className="w-full px-6 py-2 rounded-lg text-lg font-semibold transition flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-neutral-600 disabled:cursor-not-allowed"
            >
                <SparklesIcon className="w-5 h-5" />
                {isLoading ? 'Analyzing...' : 'Analyze Video'}
            </button>
            
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        </div>
    );
};
