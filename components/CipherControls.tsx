
import React from 'react';
// FIX: Corrected import path
import { Cipher, CipherMode } from '../types';
import { AdvisorIcon } from './Icons';

const ComplexityIndicator: React.FC<{ level: 'Low' | 'Medium' | 'High' }> = ({ level }) => {
    const levelMap = {
        Low: { text: 'Low', color: 'bg-teal-500', width: 'w-1/3' },
        Medium: { text: 'Medium', color: 'bg-amber-500', width: 'w-2/3' },
        High: { text: 'High', color: 'bg-rose-500', width: 'w-full' },
    };
    const { text, color, width } = levelMap[level];

    return (
        <div className="flex items-center gap-2" title={`Complexity: ${text}`}>
            <span className="text-sm text-neutral-400">Complexity:</span>
            <div className="w-24 h-2 bg-neutral-700 rounded-full overflow-hidden">
                <div className={`h-full ${color} ${width} transition-all`}></div>
            </div>
            <span className="text-xs font-semibold text-neutral-300">{text}</span>
        </div>
    );
};

interface CipherControlsProps {
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    onAdvisorClick: () => void;
    selectedCipher: Cipher;
    onCipherChange: (key: string) => void;
    filteredCipherCategories: Record<string, Cipher[]>;
    currentComplexity: 'Low' | 'Medium' | 'High';
    mode: CipherMode;
    onModeChange: (mode: CipherMode) => void;
    onLoadSession: () => void;
    onClearAll: () => void;
}

export const CipherControls: React.FC<CipherControlsProps> = ({
    searchQuery, onSearchQueryChange, onAdvisorClick, selectedCipher, onCipherChange,
    filteredCipherCategories, currentComplexity, mode, onModeChange, onLoadSession, onClearAll
}) => {
    const hasFilteredCiphers = Object.keys(filteredCipherCategories).length > 0;

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                 <div className="grid grid-cols-1 gap-4">
                     <div>
                        <label htmlFor="cipher-search" className="text-sm font-medium text-neutral-300 mb-1 block">Search Ciphers</label>
                        <div className="flex gap-2">
                            <input
                                id="cipher-search"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => onSearchQueryChange(e.target.value)}
                                placeholder="e.g., Vigenère, Classic, binary..."
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                            />
                             <button
                                onClick={onAdvisorClick}
                                className="flex-shrink-0 bg-neutral-700 hover:bg-purple-600 text-neutral-300 hover:text-white px-3 rounded-lg transition-colors"
                                title="AI Cipher Advisor"
                            >
                                <AdvisorIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="cipher-select" className="text-sm font-medium text-neutral-300 mb-1 block">Cipher</label>
                        <select
                            id="cipher-select"
                            value={selectedCipher?.key || ''}
                            onChange={(e) => onCipherChange(e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                            disabled={!hasFilteredCiphers}
                        >
                            {hasFilteredCiphers ? (
                                // FIX: Refactored to use Object.keys for more stable type inference.
                                // The previous `Object.entries` with destructuring caused `ciphersInCategory` to be inferred as `unknown`.
                                // This approach ensures that `filteredCipherCategories[category]` is correctly typed as `Cipher[]`.
                                Object.keys(filteredCipherCategories).map(category => (
                                    <optgroup key={category} label={category}>
                                        {filteredCipherCategories[category].map(cipher => (
                                            <option key={cipher.key} value={cipher.key}>{cipher.name}</option>
                                        ))}
                                    </optgroup>
                                ))
                            ) : (
                                <option disabled>No ciphers found</option>
                            )}
                        </select>
                    </div>
                </div>
                <div className="flex flex-col items-start md:items-end gap-4">
                     <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full justify-start md:justify-end">
                        <ComplexityIndicator level={currentComplexity} />
                        <div className="flex items-center bg-neutral-700 p-1 rounded-lg">
                            <button onClick={() => onModeChange('encode')} className={`px-4 py-1.5 rounded-md text-sm transition ${mode === 'encode' ? 'bg-purple-600 text-white shadow-lg' : 'hover:bg-neutral-600'}`}>Encode</button>
                            <button 
                                onClick={() => onModeChange('decode')} 
                                className={`px-4 py-1.5 rounded-md text-sm transition ${mode === 'decode' ? 'bg-purple-600 text-white shadow-lg' : 'hover:bg-neutral-600'} disabled:text-neutral-500 disabled:hover:bg-neutral-700 disabled:cursor-not-allowed`}
                                disabled={selectedCipher?.isOneWay}
                            >
                                Decode
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-neutral-400 text-left md:text-right">{selectedCipher?.description || 'Select a cipher'}</p>
                    <div className="flex items-center gap-2">
                        <button onClick={onLoadSession} className="text-sm px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors">Load Session</button>
                        <button onClick={onClearAll} title="Clear All (Ctrl+Shift+C)" className="text-sm px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors">Clear All</button>
                    </div>
                </div>
            </div>
        </>
    );
};
