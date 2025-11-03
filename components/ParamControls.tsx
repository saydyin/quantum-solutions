

import React from 'react';
// FIX: Corrected import path
import { Cipher, CipherParam } from '../types';
import { InfoIcon, SparklesIcon } from './Icons';
import { generateRandomKey } from '../utils/helpers';

interface ParamInputProps {
    parameter: CipherParam;
    cipher: Cipher;
    value: any;
    onChange: (key: string, value: string | number) => void;
    error?: string;
}

const ParamInput: React.FC<ParamInputProps> = ({ parameter, cipher, value, onChange, error }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parameter.type === 'number' ? parseInt(e.target.value, 10) || 0 : e.target.value;
        onChange(parameter.key, newValue);
    };

    const handleGenerateKey = () => {
        const newKey = generateRandomKey(cipher, parameter);
        onChange(parameter.key, newKey);
    };

    return (
        <div className="flex flex-col">
            <div className="flex items-center space-x-2 mb-1">
                <label htmlFor={parameter.key} className="text-sm font-medium text-neutral-300">{parameter.label}</label>
                {parameter.description && (
                    <div className="group relative">
                        <InfoIcon className="w-4 h-4 text-neutral-500" />
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-xs bg-neutral-600 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {parameter.description}
                        </div>
                    </div>
                )}
            </div>
            <div className="relative flex items-center">
                 <input
                    id={parameter.key}
                    type={parameter.type}
                    value={value}
                    onChange={handleChange}
                    placeholder={parameter.placeholder}
                    className={`w-full bg-neutral-800 border rounded-lg p-2 text-white outline-none transition ${error ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-neutral-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'}`}
                />
                {parameter.key.toLowerCase().includes('key') && (
                    <button onClick={handleGenerateKey} className="absolute right-2 text-neutral-400 hover:text-purple-400 transition-colors" title="Generate Random Key">
                        <SparklesIcon className="w-5 h-5"/>
                    </button>
                )}
            </div>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
    );
};

interface ParamControlsProps {
    selectedCipher: Cipher;
    params: Record<string, any>;
    paramErrors: Record<string, string>;
    preserveCase: boolean;
    onParamChange: (key: string, value: string | number) => void;
    onPreserveCaseChange: (checked: boolean) => void;
}

export const ParamControls: React.FC<ParamControlsProps> = ({
    selectedCipher,
    params,
    paramErrors,
    preserveCase,
    onParamChange,
    onPreserveCaseChange
}) => {
    const hasParams = selectedCipher?.params && selectedCipher.params.length > 0;
    const hasCaseSupport = selectedCipher?.supportsCase;

    if (!hasParams && !hasCaseSupport) {
        return null;
    }

    return (
        <div className="mt-4 border-t border-neutral-700 pt-4 flex flex-wrap gap-4 items-center">
            {hasParams && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-grow">
                    {selectedCipher.params.map(param => (
                        <ParamInput
                            key={param.key}
                            parameter={param}
                            cipher={selectedCipher}
                            value={params[param.key] ?? ''}
                            onChange={onParamChange}
                            error={paramErrors[param.key]}
                        />
                    ))}
                </div>
            )}
            {hasCaseSupport && (
                <label className="flex items-center space-x-2 cursor-pointer text-sm text-neutral-300">
                    <input
                        type="checkbox"
                        checked={preserveCase}
                        onChange={(e) => onPreserveCaseChange(e.target.checked)}
                        className="w-4 h-4 rounded bg-neutral-700 border-neutral-600 text-purple-500 focus:ring-purple-600"
                    />
                    <span>Preserve Case</span>
                </label>
            )}
        </div>
    );
};
