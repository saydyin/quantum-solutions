
import React, { useState } from 'react';
import { ciphers } from '../services/ciphers';
import { Cipher, CipherMode } from '../types';
import { ParamControls } from './ParamControls';
import { PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, CopyIcon } from './Icons';

interface PipelineStep {
    id: string;
    cipherKey: string;
    mode: CipherMode;
    params: Record<string, any>;
    preserveCase: boolean;
}

const PipelineStepView: React.FC<{
    step: PipelineStep;
    index: number;
    total: number;
    onUpdate: (id: string, updates: Partial<PipelineStep>) => void;
    onRemove: (id:string) => void;
    onMove: (id: string, direction: 'up' | 'down') => void;
}> = ({ step, index, total, onUpdate, onRemove, onMove }) => {
    const cipher = ciphers.find(c => c.key === step.cipherKey);
    if (!cipher) return null;

    const handleParamChange = (key: string, value: string | number) => {
        onUpdate(step.id, { params: { ...step.params, [key]: value } });
    };

    return (
        <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700 relative animate-fade-in">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-lg text-neutral-200">{index + 1}. {cipher.name}</h4>
                    <p className="text-xs text-neutral-400">{cipher.description}</p>
                </div>
                 <div className="flex items-center gap-1 absolute top-3 right-3">
                    <button onClick={() => onMove(step.id, 'up')} disabled={index === 0} className="p-1 text-neutral-400 hover:text-white disabled:text-neutral-600"><ArrowUpIcon className="w-5 h-5"/></button>
                    <button onClick={() => onMove(step.id, 'down')} disabled={index === total - 1} className="p-1 text-neutral-400 hover:text-white disabled:text-neutral-600"><ArrowDownIcon className="w-5 h-5"/></button>
                    <button onClick={() => onRemove(step.id)} className="p-1 text-neutral-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                </div>
            </div>
            
            <div className="mt-3 flex items-center bg-neutral-900/50 p-1 rounded-lg w-fit">
                <button onClick={() => onUpdate(step.id, { mode: 'encode' })} className={`px-3 py-1 rounded-md text-xs transition ${step.mode === 'encode' ? 'bg-purple-600 text-white' : 'hover:bg-neutral-700'}`}>Encode</button>
                <button onClick={() => onUpdate(step.id, { mode: 'decode' })} disabled={cipher.isOneWay} className={`px-3 py-1 rounded-md text-xs transition ${step.mode === 'decode' ? 'bg-purple-600 text-white' : 'hover:bg-neutral-700'} disabled:text-neutral-500 disabled:cursor-not-allowed`}>Decode</button>
            </div>
            
            {(cipher.params || cipher.supportsCase) && (
                 <div className="mt-2 border-t border-neutral-700/50 pt-3">
                     <ParamControls 
                        selectedCipher={cipher}
                        params={step.params}
                        paramErrors={{}} // Simplified for this tool, no validation display
                        preserveCase={step.preserveCase}
                        onParamChange={handleParamChange}
                        onPreserveCaseChange={(checked) => onUpdate(step.id, { preserveCase: checked })}
                     />
                 </div>
            )}
        </div>
    );
};

export const CipherChainingTool: React.FC = () => {
    const [pipeline, setPipeline] = useState<PipelineStep[]>([]);
    const [selectedCipherToAdd, setSelectedCipherToAdd] = useState<string>(ciphers[0].key);
    const [inputText, setInputText] = useState('');
    const [log, setLog] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    const addCipherToPipeline = () => {
        const cipher = ciphers.find(c => c.key === selectedCipherToAdd);
        if (!cipher) return;

        const defaultParams: Record<string, any> = {};
        cipher.params?.forEach(p => {
            defaultParams[p.key] = p.defaultValue ?? (p.type === 'number' ? 0 : '');
        });

        const newStep: PipelineStep = {
            id: self.crypto.randomUUID(),
            cipherKey: cipher.key,
            mode: 'encode',
            params: defaultParams,
            preserveCase: false,
        };
        setPipeline([...pipeline, newStep]);
    };
    
    const updatePipelineStep = (id: string, updates: Partial<PipelineStep>) => {
        setPipeline(pipeline.map(step => step.id === id ? { ...step, ...updates } : step));
    };

    const removePipelineStep = (id: string) => {
        setPipeline(pipeline.filter(step => step.id !== id));
    };
    
    const movePipelineStep = (id: string, direction: 'up' | 'down') => {
        const index = pipeline.findIndex(step => step.id === id);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= pipeline.length) return;
        
        const newPipeline = [...pipeline];
        [newPipeline[index], newPipeline[newIndex]] = [newPipeline[newIndex], newPipeline[index]]; // Swap
        setPipeline(newPipeline);
    };

    const runPipeline = async () => {
        setError('');
        setLog([]);
        if (!inputText || pipeline.length === 0) {
            return;
        }

        let currentText = inputText;
        const newLog: string[] = [`[Start] Input: "${currentText}"`];

        try {
            for (let i = 0; i < pipeline.length; i++) {
                const step = pipeline[i];
                const cipher = ciphers.find(c => c.key === step.cipherKey);
                if (!cipher) throw new Error(`Cipher ${step.cipherKey} not found.`);

                const func = step.mode === 'encode' ? cipher.encode : cipher.decode;
                currentText = await func(currentText, { ...step.params, preserveCase: step.preserveCase });
                
                const logEntry = `[Step ${i+1}: ${cipher.name} (${step.mode})] Output: "${currentText}"`;
                newLog.push(logEntry);
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            setError(`Error at step ${newLog.length}: ${errorMessage}`);
            setLog(newLog);
            return;
        }
        
        setLog(newLog);
    };
    
    const finalOutput = log.length > 0 && !error ? log[log.length - 1].split('Output: "')[1]?.slice(0, -1) : '';

    const handleCopy = () => {
        if(!finalOutput) return;
        navigator.clipboard.writeText(finalOutput).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    return (
        <div className="bg-neutral-800/50 p-6 rounded-2xl border border-neutral-700">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 mb-4">
                Cipher Chaining Pipeline
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Controls & Pipeline */}
                <div className="space-y-4">
                    <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
                        <label className="text-sm font-medium text-neutral-300 mb-1 block">Add Cipher to Pipeline</label>
                        <div className="flex gap-2">
                             <select
                                value={selectedCipherToAdd}
                                onChange={(e) => setSelectedCipherToAdd(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-2 text-white outline-none transition focus:ring-1 focus:ring-purple-500"
                            >
                                {ciphers.map(cipher => (
                                    <option key={cipher.key} value={cipher.key}>{cipher.name}</option>
                                ))}
                            </select>
                            <button onClick={addCipherToPipeline} className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
                                <PlusIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                         {pipeline.length === 0 && <p className="text-center text-neutral-500 p-4">Your pipeline is empty. Add ciphers to begin.</p>}
                         {pipeline.map((step, index) => (
                             <PipelineStepView 
                                key={step.id}
                                step={step}
                                index={index}
                                total={pipeline.length}
                                onUpdate={updatePipelineStep}
                                onRemove={removePipelineStep}
                                onMove={movePipelineStep}
                             />
                         ))}
                    </div>
                </div>

                {/* IO & Log */}
                <div className="space-y-4">
                     <div>
                        <label className="text-lg font-semibold text-neutral-300">Initial Input</label>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Enter the text to process through the pipeline..."
                            className="w-full h-24 bg-neutral-800 border rounded-xl p-3 resize-y outline-none transition font-mono border-neutral-700 text-neutral-200 focus:ring-2 focus:ring-teal-500"
                        />
                     </div>
                     <button onClick={runPipeline} disabled={!inputText || pipeline.length === 0} className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition disabled:bg-neutral-600 disabled:cursor-not-allowed">
                        Run Pipeline
                     </button>
                    
                     <div>
                        <label className="text-lg font-semibold text-neutral-300">Processing Log & Output</label>
                         <div className="w-full h-48 bg-neutral-900 border border-neutral-700 rounded-xl p-3 font-mono text-xs text-neutral-400 overflow-auto relative">
                             {log.length === 0 && !error && <span className="text-neutral-500">Log will appear here after running.</span>}
                             {log.map((entry, i) => <p key={i} className="whitespace-pre-wrap break-all">{entry}</p>)}
                             {error && <p className="text-red-400 font-bold whitespace-pre-wrap break-all">{error}</p>}

                            {finalOutput && (
                                <button onClick={handleCopy} className="absolute top-3 right-3 text-neutral-400 hover:text-white transition" title="Copy Final Output">
                                    {copySuccess ? <span className="text-xs text-green-400">Copied!</span> : <CopyIcon className="w-5 h-5" />}
                                </button>
                            )}
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};
