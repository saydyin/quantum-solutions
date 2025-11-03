
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ciphers } from '../services/ciphers';
import { Cipher, CipherParam } from '../types';
import { SendIcon, LockIcon } from './Icons';

interface Message {
    text: string;
    type: 'sent' | 'received';
    id: number;
}

const ParamInput: React.FC<{
    parameter: CipherParam;
    value: any;
    onChange: (key: string, value: string | number) => void;
    disabled: boolean;
}> = ({ parameter, value, onChange, disabled }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parameter.type === 'number' ? parseInt(e.target.value, 10) || 0 : e.target.value;
        onChange(parameter.key, newValue);
    };

    return (
        <div className="flex-1 min-w-[150px]">
            <label htmlFor={`sim-${parameter.key}`} className="text-xs font-medium text-neutral-400 mb-1 block">{parameter.label}</label>
            <input
                id={`sim-${parameter.key}`}
                type={parameter.type}
                value={value}
                onChange={handleChange}
                placeholder={parameter.placeholder}
                disabled={disabled}
                className="w-full bg-neutral-800 border rounded-lg p-2 text-white outline-none transition border-neutral-600 focus:ring-1 focus:ring-purple-500 disabled:bg-neutral-900 disabled:cursor-not-allowed"
            />
        </div>
    );
};

const ChatWindow: React.FC<{
    title: string;
    messages: Message[];
    inputValue: string;
    onInputChange: (value: string) => void;
    onSendMessage: () => void;
    disabled: boolean;
}> = ({ title, messages, inputValue, onInputChange, onSendMessage, disabled }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !disabled) {
            onSendMessage();
        }
    };

    return (
        <div className="bg-neutral-800 rounded-xl border border-neutral-700 flex flex-col h-96">
            <h3 className="text-lg font-bold text-center py-2 border-b border-neutral-700 text-neutral-300">{title}</h3>
            <div className="flex-grow p-3 space-y-3 overflow-y-auto">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-1.5 rounded-lg text-white ${msg.type === 'sent' ? 'bg-purple-600' : 'bg-neutral-600'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </div>
            <div className="p-2 border-t border-neutral-700 flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={disabled}
                    className="flex-grow bg-neutral-700 border-neutral-600 rounded-lg p-2 text-white outline-none transition disabled:cursor-not-allowed"
                />
                <button
                    onClick={onSendMessage}
                    disabled={disabled || !inputValue}
                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:bg-neutral-600 disabled:cursor-not-allowed"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export const MessagingSimulator: React.FC = () => {
    const ciphersWithParams = useMemo(() => ciphers.filter(c => !c.isOneWay), []);

    const [selectedCipherKey, setSelectedCipherKey] = useState<string>('caesar-cipher');
    const [params, setParams] = useState<Record<string, any>>({});
    const [isConfigLocked, setIsConfigLocked] = useState<boolean>(false);
    
    const [aliceMessages, setAliceMessages] = useState<Message[]>([]);
    const [bobMessages, setBobMessages] = useState<Message[]>([]);
    const [transmissionLog, setTransmissionLog] = useState<string[]>([]);
    
    const [aliceInput, setAliceInput] = useState('');
    const [bobInput, setBobInput] = useState('');

    const logEndRef = useRef<HTMLDivElement>(null);
    const selectedCipher = useMemo(() => ciphers.find(c => c.key === selectedCipherKey), [selectedCipherKey]);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transmissionLog]);

    const resetParams = useCallback((cipher: Cipher | undefined) => {
        const defaultParams: Record<string, any> = {};
        cipher?.params?.forEach(p => {
            defaultParams[p.key] = p.defaultValue ?? (p.type === 'number' ? 0 : '');
        });
        setParams(defaultParams);
    }, []);

    useEffect(() => {
        resetParams(selectedCipher);
    }, [selectedCipherKey, resetParams, selectedCipher]);

    const handleParamChange = (key: string, value: string | number) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    const handleSendMessage = async (sender: 'alice' | 'bob', message: string) => {
        if (!message || !selectedCipher) return;

        const [senderSet, recipientSet] = sender === 'alice' 
            ? [setAliceMessages, setBobMessages] 
            : [setBobMessages, setAliceMessages];
        const recipientName = sender === 'alice' ? 'BOB' : 'ALICE';
        
        senderSet(prev => [...prev, { text: message, type: 'sent', id: Date.now() }]);

        try {
            const ciphertext = await selectedCipher.encode(message, { ...params, preserveCase: true });
            setTransmissionLog(prev => [...prev, `[${sender.toUpperCase()} -> ${recipientName}] Encrypted: ${ciphertext}`]);
            
            // Simulate reception
            setTimeout(async () => {
                try {
                     const plaintext = await selectedCipher.decode(ciphertext, { ...params, preserveCase: true });
                    recipientSet(prev => [...prev, { text: plaintext, type: 'received', id: Date.now() + 1 }]);
                } catch (e) {
                     const errorMsg = e instanceof Error ? e.message : 'Decryption failed.';
                    setTransmissionLog(prev => [...prev, `[DECRYPTION FAILED for ${recipientName}] Error: ${errorMsg}`]);
                }
            }, 300);

        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'Encryption failed.';
            setTransmissionLog(prev => [...prev, `[ENCRYPTION FAILED for ${sender.toUpperCase()}] Error: ${errorMsg}`]);
        }
    };
    
    return (
        <div className="bg-neutral-800/50 p-6 rounded-2xl border border-neutral-700">
             <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-violet-400 mb-4">
                Secure Messaging Simulator
            </h2>
            
            {/* Config Panel */}
            <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700 mb-6">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium text-neutral-300 mb-1 block">Cipher</label>
                        <select
                            value={selectedCipherKey}
                            onChange={(e) => setSelectedCipherKey(e.target.value)}
                            disabled={isConfigLocked}
                            className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-2 text-white outline-none transition focus:ring-1 focus:ring-purple-500 disabled:cursor-not-allowed"
                        >
                            {ciphersWithParams.map(cipher => (
                                <option key={cipher.key} value={cipher.key}>{cipher.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedCipher?.params?.map(param => (
                        <ParamInput 
                            key={param.key} 
                            parameter={param} 
                            value={params[param.key] ?? ''}
                            onChange={handleParamChange}
                            disabled={isConfigLocked}
                        />
                    ))}

                    <button 
                        onClick={() => setIsConfigLocked(!isConfigLocked)}
                        className={`p-2 rounded-lg transition text-white ${isConfigLocked ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                        title={isConfigLocked ? 'Unlock Configuration' : 'Lock Configuration'}
                    >
                        <LockIcon className="w-6 h-6" isLocked={isConfigLocked} />
                    </button>
                </div>
            </div>

            {/* Simulators */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChatWindow 
                    title="Alice's Terminal" 
                    messages={aliceMessages}
                    inputValue={aliceInput}
                    onInputChange={setAliceInput}
                    onSendMessage={() => { handleSendMessage('alice', aliceInput); setAliceInput(''); }}
                    disabled={!isConfigLocked}
                />
                
                <div className="bg-neutral-800 rounded-xl border border-neutral-700 flex flex-col h-96">
                    <h3 className="text-lg font-bold text-center py-2 border-b border-neutral-700 text-neutral-300">Transmission Log</h3>
                    <div className="flex-grow p-3 space-y-2 overflow-y-auto font-mono text-xs">
                        {transmissionLog.map((log, i) => (
                            <p key={i} className={`animate-fade-in ${log.includes('FAILED') ? 'text-red-400' : 'text-neutral-400'}`}>
                                {log.includes('Encrypted:') ? 
                                    <>
                                        <span className="text-neutral-500">{log.split('Encrypted:')[0]}Encrypted:</span>
                                        <span className="text-cyan-400">{log.split('Encrypted:')[1]}</span>
                                    </> 
                                    : log
                                }
                            </p>
                        ))}
                         <div ref={logEndRef} />
                    </div>
                </div>

                <ChatWindow 
                    title="Bob's Terminal"
                    messages={bobMessages}
                    inputValue={bobInput}
                    onInputChange={setBobInput}
                    onSendMessage={() => { handleSendMessage('bob', bobInput); setBobInput(''); }}
                    disabled={!isConfigLocked}
                />
            </div>
        </div>
    );
};
