import React, { useState } from 'react';
import { runCodeAssistant } from '../../services/gemini';
import { SparklesIcon, CopyIcon } from '../Icons';

type ToolMode = 'generate' | 'explain' | 'debug' | 'translate';

// Component for the code assistant tool
export const CodeTool: React.FC = () => {
    // State management for the tool
    const [mode, setMode] = useState<ToolMode>('generate');
    const [prompt, setPrompt] = useState(''); // For generate mode
    const [language, setLanguage] = useState('javascript'); // For generate/translate
    const [sourceCode, setSourceCode] = useState(''); // For explain/debug/translate
    const [targetLanguage, setTargetLanguage] = useState('python'); // For translate

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<string | { explanation: string; correctedCode: string } | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    // Common programming languages for dropdowns
    const commonLanguages = ['javascript', 'python', 'typescript', 'java', 'csharp', 'go', 'rust', 'html', 'css', 'sql'];

    // Handler for running the AI assistant
    const handleRun = async () => {
        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await runCodeAssistant(mode, {
                prompt,
                language,
                sourceCode,
                targetLanguage,
            });
            setResult(response);
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to run assistant: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Handler for copying the result to clipboard
    const handleCopy = () => {
        if (!result) return;
        const textToCopy = typeof result === 'string' ? result : (result.correctedCode || '');
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            });
        }
    };

    // Renders the appropriate input fields based on the selected mode
    const renderInputs = () => {
        switch (mode) {
            case 'generate':
                return (
                    <div className="space-y-4">
                        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A function to sort an array of objects by a property" className="w-full h-24 bg-neutral-900 border border-neutral-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none transition" />
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Language</label>
                            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none transition">
                                {commonLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                            </select>
                        </div>
                    </div>
                );
            case 'explain':
            case 'debug':
                return <textarea value={sourceCode} onChange={(e) => setSourceCode(e.target.value)} placeholder="Paste your code snippet here..." className="w-full h-40 bg-neutral-900 border border-neutral-600 rounded-lg p-2 text-white font-mono focus:ring-2 focus:ring-purple-500 outline-none transition" />;
            case 'translate':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">From</label>
                                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none transition">
                                    {commonLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">To</label>
                                <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none transition">
                                     {commonLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                </select>
                            </div>
                        </div>
                        <textarea value={sourceCode} onChange={(e) => setSourceCode(e.target.value)} placeholder="Paste your code to translate..." className="w-full h-32 bg-neutral-900 border border-neutral-600 rounded-lg p-2 text-white font-mono focus:ring-2 focus:ring-purple-500 outline-none transition" />
                    </div>
                );
            default:
                return null;
        }
    };
    
    // Renders the output from the AI assistant
    const renderOutput = () => {
        if (isLoading) {
             return (
                <div className="text-center text-neutral-400">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-400 mx-auto"></div>
                    <p className="mt-4">AI is on the case...</p>
                </div>
            );
        }
        if (!result) return <p className="text-neutral-500">Output will appear here.</p>;

        if (typeof result === 'string') {
            return <pre><code className="font-mono text-sm whitespace-pre-wrap">{result}</code></pre>;
        }

        if (mode === 'debug' && 'explanation' in result) {
            return (
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-violet-300 mb-2">Explanation</h4>
                        <p className="whitespace-pre-wrap">{result.explanation}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-violet-300 mb-2">Corrected Code</h4>
                        <pre><code className="font-mono text-sm whitespace-pre-wrap">{result.correctedCode}</code></pre>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-purple-400">AI Code Assistant</h2>
            
            {/* Mode selection tabs */}
            <div className="flex flex-wrap gap-2">
                {(['generate', 'explain', 'debug', 'translate'] as ToolMode[]).map(m => (
                    <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition capitalize ${mode === m ? 'bg-purple-600 text-white' : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'}`}>
                        {m}
                    </button>
                ))}
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-300">Input</h3>
                    {renderInputs()}
                    <button onClick={handleRun} disabled={isLoading} className="w-full px-6 py-2 rounded-lg text-lg font-semibold transition flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-neutral-600 disabled:cursor-not-allowed">
                        <SparklesIcon className="w-5 h-5" />
                        {isLoading ? 'Running...' : 'Run Assistant'}
                    </button>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-300">Output</h3>
                    <div className="relative w-full h-full min-h-[200px] bg-neutral-900/50 rounded-lg border border-neutral-700 p-4 overflow-y-auto">
                        {renderOutput()}
                        {result && (
                            <button onClick={handleCopy} className="absolute top-3 right-3 text-neutral-400 hover:text-white transition" title="Copy Output">
                                {copySuccess ? <span className="text-xs text-green-400">Copied!</span> : <CopyIcon className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
             {error && <p className="text-sm text-red-400 text-center mt-2">{error}</p>}
        </div>
    );
};
