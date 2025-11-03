

export type CipherMode = 'encode' | 'decode';

export interface Validator {
    regex: RegExp;
    message: string;
}

export interface CipherParam {
    key: string;
    label: string;
    type: 'text' | 'number';
    defaultValue?: string | number;
    placeholder?: string;
    description?: string;
    validation?: {
        required?: boolean;
        min?: number;
        max?: number;
    };
}

export interface Cipher {
    key: string;
    name: string;
    category: 'Classic' | 'Hashing' | 'Numeric & Positional' | 'Substitution' | 'Esoteric & Language' | 'Technical' | 'Transposition';
    description: string;
    complexity: 'Low' | 'Medium' | 'High' | ((params: Record<string, any>) => 'Low' | 'Medium' | 'High');
    isOneWay?: boolean;
    supportsCase?: boolean;
    params?: CipherParam[];
    inputValidator?: {
        encode?: Validator;
        decode?: Validator;
    };
    placeholders?: {
        encode?: string;
        decode?: string;
    };
    keypad?: {
        decode?: string[];
    };
    encode: (text: string, params?: any) => string | Promise<string>;
    decode: (text: string, params?: any) => string | Promise<string>;
}

export interface HistoryEntry {
    id: string;
    timestamp: number;
    inputText: string;
    outputText: string;
    mode: CipherMode;
    cipherName: string;
    selectedCipherKey: string;
    params: Record<string, any>;
    preserveCase: boolean;
}

export interface KeyVaultEntry {
    id: string;
    name: string;
    cipherKey: string;
    params: Record<string, any>;
    createdAt: number;
}


export interface AICryptanalysisResult {
    suspectedCipherKey: string;
    confidence: 'High' | 'Medium' | 'Low' | 'Uncertain';
    reasoning: string;
    decryptedText: string;
    key?: string;
}

export interface EnigmaRotor {
    name: string;
    wiring: string;
    notch: string;
}

export interface EnigmaReflector {
    name: string;
    wiring: string;
}
