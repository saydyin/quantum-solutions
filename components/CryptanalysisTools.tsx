
import React, { useState, useMemo } from 'react';
import { calculateIOC, solveCaesar, performKasiskiExamination } from '../utils/cryptanalysis';
// FIX: Corrected import path
import { ciphers } from '../services/ciphers';
import { getAICryptanalysis } from '../services/ai';
// FIX: Corrected import path
import { AICryptanalysisResult } from '../types';
import { CopyIcon, SparklesIcon } from './Icons';

type Tool = 'ioc' | 'kasiski' | 'caesar' | 'ai';

// --- Index of Coincidence Tool ---
const IOCTool: React.FC<{ text: string }> = ({ text }) => {
    const ioc = useMemo(() => calculateIOC(text), [text]);

    const getInterpretation = (value: number) => {
        if (value > 0.060) return { text: "Likely Monoalphabetic", color: "text-teal-400" };
        if (value > 0.045) return { text: "Potentially Monoalphabetic", color: "text-amber-400" };
        return { text: "Likely Polyalphabetic / Random", color: "text-rose-400" };
    };

    const interpretation = getInterpretation(ioc);

    return (
        <div className="space-y-4">
            <div className="bg-neutral-900/50 p-6 rounded-lg text-center border border-neutral-700">
                <p className="text-sm text-neutral-400">Index of Coincidence</p>
                <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-300 my-2">
                    {ioc.toFixed(4)}
                </p>
                <p className={`font-semibold ${interpretation.color}`}>{interpretation.text}</p>
            </div>
            <div className="text-sm text-neutral-400 space-y-2">
                <p><strong className="text-neutral-200">What is this?</strong> The Index of Coincidence (IoC) measures the likelihood of two randomly chosen letters in the text being the same. It's a powerful tool for cryptanalysis.</p>
                <ul className="list-disc list-inside">
                    <li><strong className="text-teal-400">High IoC (~0.067):</strong> The letter frequencies are similar to standard English, suggesting a simple substitution cipher (like Caesar, Atbash, or Keyword).</li>
                    <li><strong className="text-rose-400">Low IoC (~0.038):</strong> The letter frequencies are flattened and more random, suggesting a polyalphabetic cipher (like Vigenère) or non-alphabetic data.</li>
                </ul>
            </div>
        </div>
    );
};

// --- Caesar Solver Tool ---
const CaesarSolverTool: React.FC<{ text: string }> = ({ text }) => {
    const solutions = useMemo(() => solveCaesar(text), [text]);
    const [copySuccess, setCopySuccess] = useState<number | null>(null);

    const handleCopy = (shift: number, result: string) => {
        navigator.clipboard.writeText(result).then(() => {
            setCopySuccess(shift);
            setTimeout(() => setCopySuccess(null), 2000);
        });
    };

    return (
        <div className="space-y-3">
             <p className="text-sm text-neutral-400">This tool decrypts the text using all 26 possible Caesar cipher shifts. Look for the result that forms coherent words.</p>
            <div className="max-h-80 overflow-y-auto bg-neutral-900/50 p-2 rounded-lg border border-neutral-700">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-neutral-900">
                        <tr>
                            <th className="p-2 w-24">Shift</th>
                            <th className="p-2">Result</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-700/50">
                        {solutions.map(({ shift, result }) => (
                            <tr key={shift} className="hover:bg-neutral-700/30 group">
                                <td className="p-2 font-mono text-violet-400">+{shift === 0 ? '0 (Original)' : shift}</td>
                                <td className="p-2 font-mono break-all relative">
                                    {result}
                                    <button 
                                        onClick={() => handleCopy(shift, result)}
                                        className="absolute top-1/2 right-2 -translate-y-1/2 p-1 rounded-md text-neutral-500 bg-neutral-700/50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                                        title="Copy this result"
                                    >
                                        {copySuccess === shift ? 
                                            <span className="text-xs text-green-400 px-1">Copied!</span> : 
                                            <CopyIcon className="w-4 h-4" />
                                        }
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Kasiski Examination Tool ---
const KasiskiTool: React.FC<{ text: string }> = ({ text }) => {
    const analysis = useMemo(() => performKasiskiExamination(text), [text]);
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className="space-y-4">
            <p className="text-sm text-neutral-400">
                Kasiski examination finds repeated sequences in the text to guess the length of the keyword used in a polyalphabetic cipher like Vigenère. The most common factors of the distances between these sequences are the most likely key lengths.
            </p>
            
            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700">
                <h4 className="font-semibold text-neutral-300 mb-2">Most Likely Key Lengths</h4>
                {analysis.likelyLengths.length > 0 ? (
                     <ul className="space-y-2">
                        {analysis.likelyLengths.map(({ length, count }) => (
                            <li key={length} className="flex items-center justify-between">
                                <span className="font-mono text-lg text-violet-400">{length}</span>
                                <span className="text-sm text-neutral-400">Score: {count}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-neutral-500 text-center py-4">No significant repeated sequences found to determine key length.</p>
                )}
            </div>

            <div>
                <button onClick={() => setShowDetails(!showDetails)} className="text-sm text-neutral-400 hover:text-white">
                    {showDetails ? 'Hide' : 'Show'} Sequence Details
                </button>
                {showDetails && (
                    <div className="mt-2 max-h-60 overflow-y-auto bg-neutral-900/50 p-2 rounded-lg border border-neutral-700 animate-fade-in">
                        {analysis.sequences.length > 0 ? (
                             <table className="w-full text-left text-sm">
                                <thead className="sticky top-0 bg-neutral-900">
                                    <tr>
                                        <th className="p-2">Sequence</th>
                                        <th className="p-2">Positions</th>
                                        <th className="p-2">Distances</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-700/50">
                                    {analysis.sequences.map(({ sequence, positions, distances }) => (
                                        <tr key={sequence}>
                                            <td className="p-2 font-mono text-green-400">"{sequence}"</td>
                                            <td className="p-2 font-mono">{positions.join(', ')}</td>
                                            <td className="p-2 font-mono">{distances.join(', ')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                             <p className="text-neutral-500 text-center p-4">No repeated sequences of 3+ characters found.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- AI Analyst Tool ---
const AIAnalystTool: React.FC<{ text: string }> = ({ text }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<AICryptanalysisResult | null>(null);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError('');
        setResult(null);
        try {
            const analysis = await getAICryptanalysis(text, ciphers);
            setResult(analysis);
        } catch (err) {
            console.error("AI Cryptanalysis Error:", err);
            let message = 'An AI-powered analysis could not be performed.';
             if (err instanceof Error) {
                if (err.message.includes('API key not valid')) {
                    message = 'Could not connect to the AI analysis service (Invalid API Key).';
                } else if (err.message.includes('429')) {
                    message = 'The AI analysis service is busy. Please wait a moment and try again.';
                }
            }
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const suspectedCipher = useMemo(() => {
        if (!result?.suspectedCipherKey) return null;
        return ciphers.find(c => c.key === result.suspectedCipherKey);
    }, [result]);

    return (
        <div className="space-y-4">
            <p className="text-sm text-neutral-400">
                Let Gemini analyze the ciphertext to identify the encryption method, find the key, and attempt to decrypt the message.
            </p>
            <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full px-6 py-2 rounded-lg text-lg font-semibold transition flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-neutral-600 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    'Analyzing...'
                ) : (
                    <>
                        <SparklesIcon className="w-5 h-5" />
                        Analyze Ciphertext
                    </>
                )}
            </button>

            {isLoading && (
                <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                    <p className="mt-2 text-neutral-400">AI is thinking... this may take a moment.</p>
                </div>
            )}

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            
            {result && (
                <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700">
                             <h4 className="font-semibold text-neutral-400 text-sm">Suspected Cipher</h4>
                             <p className="text-lg text-white">{suspectedCipher?.name || result.suspectedCipherKey}</p>
                        </div>
                        <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700">
                             <h4 className="font-semibold text-neutral-400 text-sm">Confidence</h4>
                             <p className="text-lg text-white">{result.confidence}</p>
                        </div>
                    </div>
                     {result.key && (
                         <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700">
                             <h4 className="font-semibold text-neutral-400 text-sm">Discovered Key</h4>
                             <p className="text-lg text-violet-400 font-mono">{result.key}</p>
                         </div>
                    )}
                    <div>
                        <h4 className="font-semibold text-neutral-300 mb-2">Reasoning</h4>
                        <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700 text-neutral-300 text-sm whitespace-pre-wrap">{result.reasoning}</div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-neutral-300 mb-2">Attempted Decryption</h4>
                        <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700 text-green-300 font-mono">{result.decryptedText || <span className="text-neutral-500">Decryption not successful.</span>}</div>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Main Workspace Component ---
export const CryptanalysisWorkspace: React.FC<{ text: string }> = ({ text }) => {
    const [activeTool, setActiveTool] = useState<Tool>('ioc');

    return (
        <div>
            <div className="flex items-center border-b border-neutral-700 mb-4 overflow-x-auto">
                <TabButton name="Index of Coincidence" tool="ioc" activeTool={activeTool} onClick={setActiveTool} />
                <TabButton name="Kasiski Examination" tool="kasiski" activeTool={activeTool} onClick={setActiveTool} />
                <TabButton name="Caesar Solver" tool="caesar" activeTool={activeTool} onClick={setActiveTool} />
                <TabButton name="AI Analyst" tool="ai" activeTool={activeTool} onClick={setActiveTool} />
            </div>
            <div>
                {activeTool === 'ioc' && <IOCTool text={text} />}
                {activeTool === 'kasiski' && <KasiskiTool text={text} />}
                {activeTool === 'caesar' && <CaesarSolverTool text={text} />}
                {activeTool === 'ai' && <AIAnalystTool text={text} />}
            </div>
        </div>
    );
};

interface TabButtonProps {
    name: string;
    tool: Tool;
    activeTool: Tool;
    onClick: (tool: Tool) => void;
}
const TabButton: React.FC<TabButtonProps> = ({ name, tool, activeTool, onClick }) => {
    const isActive = activeTool === tool;
    return (
        <button
            onClick={() => onClick(tool)}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
                isActive 
                ? 'border-purple-500 text-white' 
                : 'border-transparent text-neutral-400 hover:bg-neutral-700/50 hover:text-white'
            }`}
        >
            {name}
        </button>
    );
};
