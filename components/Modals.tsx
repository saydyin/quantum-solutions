

import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
// FIX: Corrected import path
import { ciphers } from '../services/ciphers';
// FIX: Corrected import path
import { Cipher, HistoryEntry } from '../types';
import { CloseIcon, TrashIcon, AdvisorIcon, ChartBarIcon, KeyIcon } from './Icons';
import { CryptanalysisWorkspace } from './CryptanalysisTools';

// --- ABOUT MODAL ---
interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
    cipherCategories: Record<string, Cipher[]>;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, cipherCategories }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-neutral-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-purple-400">About Quantum Solutions Cipher Suite</h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <main className="p-6 overflow-y-auto">
                    <p className="text-neutral-300 mb-4">Quantum Solutions provides a comprehensive web-based toolkit for encrypting and decrypting messages. It features a vast collection of ciphers, from classic algorithms used throughout history to modern, esoteric, and technical encoding schemes.</p>
                    <p className="text-neutral-300 mb-6">Whether you're a puzzle enthusiast, a student of cryptography, or just curious, this toolkit provides a hands-on experience with the fascinating world of ciphers.</p>
                    
                    <div className="space-y-4">
                        {Object.entries(cipherCategories).map(([category, ciphersInCategory]: [string, Cipher[]]) => (
                            <div key={category}>
                                <h3 className="text-lg font-semibold text-violet-400 mb-2 border-b border-violet-400/20 pb-1">{category}</h3>
                                <ul className="space-y-2">
                                    {ciphersInCategory.map(cipher => (
                                        <li key={cipher.key}>
                                            <strong className="text-neutral-200">{cipher.name}:</strong>
                                            <p className="text-sm text-neutral-400 ml-2">{cipher.description}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};

// --- HISTORY PANEL ---
interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryEntry[];
    onLoadEntry: (entry: HistoryEntry) => void;
    onClearHistory: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, history, onLoadEntry, onClearHistory }) => {
    return (
        <div className={`fixed inset-0 z-30 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-neutral-800 border-l border-neutral-700 shadow-2xl flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <header className="p-4 border-b border-neutral-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-purple-400">Operation History</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={onClearHistory} disabled={history.length === 0} className="text-neutral-400 hover:text-red-400 disabled:text-neutral-600 disabled:cursor-not-allowed" title="Clear History">
                            <TrashIcon className="w-6 h-6" />
                        </button>
                        <button onClick={onClose} className="text-neutral-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                    </div>
                </header>
                <main className="flex-grow overflow-y-auto">
                    {history.length === 0 ? (
                        <p className="text-neutral-400 text-center p-8">No history yet. Successful operations will appear here.</p>
                    ) : (
                        <ul className="divide-y divide-neutral-700/50">
                            {history.map(entry => (
                                <li key={entry.id} className="p-4 hover:bg-neutral-700/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold text-neutral-200">{entry.cipherName} <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${entry.mode === 'encode' ? 'bg-purple-500/30 text-purple-300' : 'bg-green-500/30 text-green-300'}`}>{entry.mode}</span></div>
                                            <div className="text-xs text-neutral-500 mt-1">{new Date(entry.timestamp).toLocaleString()}</div>
                                            <p className="text-sm text-neutral-400 mt-2 font-mono break-all truncate">
                                                Input: "{entry.inputText}"
                                            </p>
                                        </div>
                                        <button onClick={() => onLoadEntry(entry)} className="ml-4 text-sm px-3 py-1 bg-neutral-700 hover:bg-purple-600 rounded-lg transition-colors flex-shrink-0">Load</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </main>
            </div>
        </div>
    );
};

// --- ADVISOR MODAL ---
interface AdvisorModalProps {
    isOpen: boolean;
    onClose: () => void;
    query: string;
    onQueryChange: (query: string) => void;
    onGetSuggestion: () => void;
    isLoading: boolean;
    error: string;
    response: { cipherKey: string; explanation: string } | null;
    onUseCipher: (cipherKey: string) => void;
}

export const AdvisorModal: React.FC<AdvisorModalProps> = ({
    isOpen, onClose, query, onQueryChange, onGetSuggestion, isLoading, error, response, onUseCipher
}) => {
    if (!isOpen) return null;

    const suggestedCipher = useMemo(() => {
        if (!response?.cipherKey) return null;
        return ciphers.find(c => c.key === response.cipherKey);
    }, [response]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-neutral-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                        <AdvisorIcon className="w-6 h-6" /> AI Cipher Advisor
                    </h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <main className="p-6 overflow-y-auto space-y-4">
                    <p className="text-neutral-300">Describe what you need a cipher for, and our AI expert will suggest the best one for the job.</p>
                    <div>
                        <textarea
                            value={query}
                            onChange={(e) => onQueryChange(e.target.value)}
                            placeholder="e.g., 'A simple cipher for a treasure hunt game' or 'A strong, classic cipher for a secret message'"
                            className="w-full h-24 bg-neutral-900 border border-neutral-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition resize-none"
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        onClick={onGetSuggestion}
                        disabled={isLoading || !query}
                        className="w-full px-6 py-2 rounded-lg text-lg font-semibold transition flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-neutral-600 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Thinking...' : 'Get Suggestion'}
                    </button>

                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                    {isLoading && (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                            <p className="mt-2 text-neutral-400">Analyzing your request...</p>
                        </div>
                    )}

                    {response && suggestedCipher && (
                        <div className="mt-4 p-4 bg-neutral-900/50 border border-neutral-700 rounded-lg">
                            <h3 className="text-lg font-semibold text-violet-400">Suggestion: {suggestedCipher.name}</h3>
                            <p className="text-neutral-300 mt-2">{response.explanation}</p>
                            <button
                                onClick={() => onUseCipher(response.cipherKey)}
                                className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition"
                            >
                                Use this Cipher
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

// --- FREQUENCY ANALYSIS MODAL ---
interface FrequencyAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    text: string;
    title: string;
}

export const FrequencyAnalysisModal: React.FC<FrequencyAnalysisModalProps> = ({ isOpen, onClose, text, title }) => {
    const analysis = useMemo(() => {
        if (!text) return null;
        
        const upperText = text.toUpperCase();
        const frequencies: Record<string, number> = {};
        let letterCount = 0;
        
        for (const char of upperText) {
            if (char >= 'A' && char <= 'Z') {
                frequencies[char] = (frequencies[char] || 0) + 1;
                letterCount++;
            }
        }

        const sortedFreq = Object.entries(frequencies).sort((a, b) => b[1] - a[1]);
        const maxFreq = sortedFreq.length > 0 ? sortedFreq[0][1] : 0;
        
        return {
            totalChars: text.length,
            letterCount,
            uniqueLetters: sortedFreq.length,
            frequencies: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(char => ({
                char,
                count: frequencies[char] || 0,
            })),
            maxFreq,
        };
    }, [text]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-neutral-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                        <ChartBarIcon className="w-6 h-6" /> {title}
                    </h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <main className="p-6 overflow-y-auto">
                    {!analysis || analysis.letterCount === 0 ? (
                        <p className="text-neutral-400 text-center">No alphabetic characters to analyze.</p>
                    ) : (
                        <div>
                            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-violet-400">{analysis.totalChars}</div>
                                    <div className="text-sm text-neutral-400">Total Characters</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-violet-400">{analysis.letterCount}</div>
                                    <div className="text-sm text-neutral-400">Alphabetic</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-violet-400">{analysis.uniqueLetters}</div>
                                    <div className="text-sm text-neutral-400">Unique Letters</div>
                                </div>
                            </div>
                            <div className="w-full h-64 flex items-end gap-1 border-b-2 border-neutral-600 pb-2">
                                {analysis.frequencies.map(({ char, count }) => (
                                    <div key={char} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                        <div 
                                            className="w-full bg-gradient-to-t from-purple-500 to-violet-400 rounded-t-sm hover:opacity-80 transition-opacity"
                                            style={{ height: `${(count / analysis.maxFreq) * 100}%` }}
                                        ></div>
                                        <div className="text-xs text-neutral-400 mt-1">{char}</div>
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-neutral-600 text-white text-xs rounded py-0.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            {count}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};


// --- CRYPTANALYSIS MODAL ---
interface CryptanalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    text: string;
    title: string;
}

export const CryptanalysisModal: React.FC<CryptanalysisModalProps> = ({ isOpen, onClose, text, title }) => {
     useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;
    
    return (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-neutral-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                        <KeyIcon className="w-6 h-6" /> {title}
                    </h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </header>
                 <main className="p-6 overflow-y-auto">
                    { !text ? (
                         <p className="text-neutral-400 text-center">No text provided for analysis.</p>
                    ) : (
                        <CryptanalysisWorkspace text={text} />
                    )}
                 </main>
            </div>
        </div>
    )
}
