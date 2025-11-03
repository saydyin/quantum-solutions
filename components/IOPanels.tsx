
import React, { useMemo } from 'react';
import { Cipher, CipherMode } from '../types';
import { CopyIcon, SwapIcon, TrashIcon, ChartBarIcon, SparklesIcon } from './Icons';
import { ScytaleVisualizer } from './ScytaleVisualizer';
import { EnigmaVisualizer } from './EnigmaVisualizer';

interface IOPanelsProps {
    inputText: string;
    onInputTextChange: (value: string) => void;
    inputRef: React.RefObject<HTMLTextAreaElement>;
    errorSegment: string;
    validationHighlights: string[];
    validationError: string;
    inputCopySuccess: string;
    onCopyInput: () => void;
    onClearInput: () => void;
    
    outputText: string;
    error: string;
    isAnalyzingError: boolean;
    hasParamErrors: boolean;
    hasValidationErrors: boolean;
    copySuccess: string;
    onCopyOutput: () => void;

    selectedCipher: Cipher;
    mode: CipherMode;
    params: Record<string, any>;
    onSwap: () => void;
    onAnalysisClick: (type: 'input' | 'output') => void;
    onCryptanalysisClick: (type: 'input' | 'output') => void;
}

const HighlightedText: React.FC<{ text: string; highlights: string[] }> = ({ text, highlights }) => {
    if (highlights.length === 0) return <>{text}</>;
    
    const regex = new RegExp(`(${highlights.map(h => h.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})`, 'g');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, index) => 
                highlights.includes(part) ? 
                <span key={index} className="bg-red-500/30">{part}</span> : 
                <span key={index}>{part}</span>
            )}
        </>
    );
};


export const IOPanels: React.FC<IOPanelsProps> = ({
    inputText, onInputTextChange, inputRef, errorSegment, validationHighlights, validationError,
    inputCopySuccess, onCopyInput, onClearInput, outputText, error, isAnalyzingError,
    hasParamErrors, hasValidationErrors, copySuccess, onCopyOutput, selectedCipher,
    mode, params, onSwap, onAnalysisClick, onCryptanalysisClick
}) => {

    const renderCipherVisualizer = () => {
        if (selectedCipher.key === 'scytale') {
            return <ScytaleVisualizer text={inputText} diameter={params.diameter || 4} mode={mode} />;
        }
        if (selectedCipher.key === 'enigma-i') {
            return <EnigmaVisualizer params={params} />;
        }
        return null;
    };

    const visualizer = useMemo(renderCipherVisualizer, [selectedCipher, inputText, params, mode]);

    return (
        <div className="mt-4 flex flex-col md:flex-row gap-4 items-center md:items-start">
            {/* Input Panel */}
            <div className="w-full md:flex-1 space-y-2">
                <label className="text-lg font-semibold text-neutral-300">Input</label>
                <div className="relative">
                    <div className="absolute top-0 left-0 w-full h-full p-3 pointer-events-none whitespace-pre-wrap font-mono leading-relaxed text-transparent">
                         <HighlightedText text={inputText} highlights={validationHighlights} />
                    </div>
                    <textarea
                        ref={inputRef}
                        value={inputText}
                        onChange={(e) => onInputTextChange(e.target.value)}
                        placeholder="Type or paste your text here..."
                        className="w-full h-48 bg-neutral-800 border rounded-xl p-3 resize-y outline-none transition font-mono leading-relaxed caret-white
                        border-neutral-700 text-neutral-200 
                        focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                        {inputCopySuccess ? (
                             <span className="text-sm text-green-400">{inputCopySuccess}</span>
                        ) : (
                            <button onClick={onCopyInput} className="text-neutral-400 hover:text-white transition" title="Copy Input"><CopyIcon className="w-5 h-5" /></button>
                        )}
                         <button onClick={onClearInput} className="text-neutral-400 hover:text-white transition" title="Clear Input"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                </div>
                {validationError && <p className="text-sm text-red-400">{validationError}</p>}
                <div className="flex gap-2">
                    <button onClick={() => onAnalysisClick('input')} disabled={!inputText} className="text-sm px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                        <ChartBarIcon className="w-4 h-4" /> Analysis
                    </button>
                    <button onClick={() => onCryptanalysisClick('input')} disabled={!inputText} className="text-sm px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                        <SparklesIcon className="w-4 h-4" /> Cryptanalysis
                    </button>
                </div>
            </div>

            {/* Swap Button and Visualizer */}
            <div className="flex-shrink-0 flex flex-col items-center gap-4 w-full md:w-auto">
                <button 
                    onClick={onSwap} 
                    title="Swap Input/Output (Ctrl+Shift+S)" 
                    className="mt-8 text-neutral-400 hover:text-purple-400 disabled:text-neutral-600 disabled:cursor-not-allowed transition-colors"
                    disabled={!!error || isAnalyzingError || hasParamErrors || hasValidationErrors || !!selectedCipher?.isOneWay}
                >
                    <SwapIcon className="w-8 h-8" />
                </button>
                {visualizer}
            </div>

            {/* Output Panel */}
            <div className="w-full md:flex-1 space-y-2">
                 <label className="text-lg font-semibold text-neutral-300">Output</label>
                <div className="relative">
                     <div className="w-full h-48 bg-neutral-800 border border-neutral-700 rounded-xl p-3 resize-y font-mono leading-relaxed text-neutral-200 overflow-auto">
                        {isAnalyzingError && (
                            <div className="flex items-center justify-center h-full text-neutral-400">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                                <span className="ml-2">Analyzing error...</span>
                            </div>
                        )}
                        {error && !isAnalyzingError && (
                             <p className="text-red-400 whitespace-pre-wrap">
                                <HighlightedText text={error} highlights={errorSegment ? [errorSegment] : []} />
                            </p>
                        )}
                        {!error && !isAnalyzingError && outputText && (
                            <p className="whitespace-pre-wrap break-all">{outputText}</p>
                        )}
                         {!error && !isAnalyzingError && !outputText && (hasParamErrors || hasValidationErrors) && (
                            <p className="text-neutral-500">Fix errors to see output.</p>
                        )}
                    </div>
                    <div className="absolute bottom-3 right-3 flex gap-2">
                        {copySuccess ? (
                            <span className="text-sm text-green-400">{copySuccess}</span>
                        ) : (
                             <button onClick={onCopyOutput} className="text-neutral-400 hover:text-white transition" title="Copy Output"><CopyIcon className="w-5 h-5" /></button>
                        )}
                    </div>
                </div>
                 <div className="flex gap-2">
                    <button onClick={() => onAnalysisClick('output')} disabled={!outputText || !!error} className="text-sm px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                        <ChartBarIcon className="w-4 h-4" /> Analysis
                    </button>
                    <button onClick={() => onCryptanalysisClick('output')} disabled={!outputText || !!error} className="text-sm px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                        <SparklesIcon className="w-4 h-4" /> Cryptanalysis
                    </button>
                </div>
            </div>
        </div>
    );
};
