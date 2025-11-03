

import React, { useState, useMemo } from 'react';
import { useKeyVault } from '../hooks/useKeyVault';
// FIX: Corrected import path
import { ciphers } from '../services/ciphers';
// FIX: Corrected import path
import { Cipher, CipherParam, KeyVaultEntry } from '../types';
import { generateRandomKey } from '../utils/helpers';
import { CloseIcon, SparklesIcon, TrashIcon, KeyIcon } from './Icons';

type Tool = 'generator' | 'vault';

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
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
                isActive 
                ? 'border-purple-500 text-white' 
                : 'border-transparent text-neutral-400 hover:bg-neutral-700/50 hover:text-white'
            }`}
        >
            {name}
        </button>
    );
};


const KeyGenerator: React.FC<{ onKeySave: (name: string, cipherKey: string, params: Record<string, any>) => void }> = ({ onKeySave }) => {
    const ciphersWithKeys = useMemo(() => ciphers.filter(c => c.params && c.params.some(p => p.key.toLowerCase().includes('key'))), []);
    
    const [selectedCipherKey, setSelectedCipherKey] = useState(ciphersWithKeys[0]?.key || '');
    const selectedCipher = useMemo(() => ciphers.find(c => c.key === selectedCipherKey), [selectedCipherKey]);
    const keyParams = useMemo(() => selectedCipher?.params?.filter(p => p.key.toLowerCase().includes('key')) || [], [selectedCipher]);
    
    const [selectedParamKey, setSelectedParamKey] = useState(keyParams[0]?.key || '');
    const selectedParam = useMemo(() => keyParams.find(p => p.key === selectedParamKey), [keyParams, selectedParamKey]);
    
    const [keyLength, setKeyLength] = useState(16);
    const [generatedKey, setGeneratedKey] = useState<string | number>('');
    const [keyName, setKeyName] = useState('');

    const handleGenerate = () => {
        if (!selectedCipher || !selectedParam) return;
        const newKey = generateRandomKey(selectedCipher, selectedParam, keyLength);
        setGeneratedKey(newKey);
    };

    const handleSave = () => {
        if (!keyName || !generatedKey || !selectedCipher) return;
        onKeySave(keyName, selectedCipher.key, { [selectedParamKey]: generatedKey });
        setKeyName('');
        setGeneratedKey('');
    };
    
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-neutral-300 mb-1 block">Cipher</label>
                    <select value={selectedCipherKey} onChange={e => setSelectedCipherKey(e.target.value)} className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-2 text-white outline-none transition">
                        {ciphersWithKeys.map(c => <option key={c.key} value={c.key}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-neutral-300 mb-1 block">Key Parameter</label>
                    <select value={selectedParamKey} onChange={e => setSelectedParamKey(e.target.value)} disabled={keyParams.length === 0} className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-2 text-white outline-none transition">
                         {keyParams.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                </div>
            </div>
             {selectedParam?.type === 'text' && (
                <div>
                    <label className="text-sm font-medium text-neutral-300 mb-1 block">Key Length: {keyLength}</label>
                    <input type="range" min="4" max="32" value={keyLength} onChange={e => setKeyLength(parseInt(e.target.value, 10))} className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                </div>
            )}
            <button onClick={handleGenerate} disabled={!selectedParam} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition disabled:bg-neutral-600">
                <SparklesIcon className="w-5 h-5" />
                Generate Key
            </button>

            {generatedKey && (
                <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700 space-y-3 animate-fade-in">
                    <p className="text-sm text-neutral-400">Generated Key:</p>
                    <p className="text-lg font-mono text-green-400 break-all">{generatedKey}</p>
                    <div className="flex gap-2">
                        <input type="text" value={keyName} onChange={e => setKeyName(e.target.value)} placeholder="Enter a name for this key..." className="flex-grow bg-neutral-800 border border-neutral-600 rounded-lg p-2 text-white outline-none transition" />
                        <button onClick={handleSave} disabled={!keyName} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:bg-neutral-600">Save</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const KeyVault: React.FC<{ onUseKey: (entry: KeyVaultEntry) => void }> = ({ onUseKey }) => {
    const { keys, deleteKey } = useKeyVault();

    return (
        <div className="space-y-3">
            {keys.length === 0 ? (
                <p className="text-center text-neutral-500 p-8">Your vault is empty. Generate and save keys to manage them here.</p>
            ) : (
                <div className="max-h-80 overflow-y-auto bg-neutral-900/50 p-2 rounded-lg border border-neutral-700">
                    <ul className="divide-y divide-neutral-700/50">
                        {keys.map(key => {
                            const cipher = ciphers.find(c => c.key === key.cipherKey);
                            const keyParam = Object.keys(key.params)[0];
                            const keyValue = key.params[keyParam];
                            return (
                                <li key={key.id} className="p-3 flex items-center justify-between hover:bg-neutral-700/30">
                                    <div>
                                        <p className="font-semibold text-white">{key.name}</p>
                                        <p className="text-sm text-neutral-400">{cipher?.name || key.cipherKey}</p>
                                        <p className="text-xs font-mono text-violet-400 mt-1">{`${keyParam}: ${keyValue}`}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onUseKey(key)} className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition">Use</button>
                                        <button onClick={() => deleteKey(key.id)} className="p-2 text-neutral-500 hover:text-red-400 transition" title="Delete Key">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};


interface KeyManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUseKey: (entry: KeyVaultEntry) => void;
}

export const KeyManagerModal: React.FC<KeyManagerModalProps> = ({ isOpen, onClose, onUseKey }) => {
    const [activeTool, setActiveTool] = useState<Tool>('generator');
     const { addKey } = useKeyVault();


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl max-w-xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-neutral-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                        <KeyIcon className="w-6 h-6" /> Key Manager & Vault
                    </h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <main className="p-6 overflow-y-auto">
                    <div className="flex items-center border-b border-neutral-700 mb-4">
                        <TabButton name="Key Generator" tool="generator" activeTool={activeTool} onClick={setActiveTool} />
                        <TabButton name="Key Vault" tool="vault" activeTool={activeTool} onClick={setActiveTool} />
                    </div>
                    <div>
                        {activeTool === 'generator' && <KeyGenerator onKeySave={addKey} />}
                        {activeTool === 'vault' && <KeyVault onUseKey={onUseKey} />}
                    </div>
                </main>
            </div>
        </div>
    );
};
