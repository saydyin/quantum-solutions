import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getAIErrorAnalysis } from '../services/ai';
// FIX: Corrected import path
import { ciphers } from '../services/ciphers';
// FIX: Corrected import path
import { Cipher, CipherMode, Validator, HistoryEntry } from '../types';

const LOCAL_STORAGE_KEY = 'quantumCipherStateV1';
const HISTORY_STORAGE_KEY = 'quantumCipherHistoryV1';
const MAX_HISTORY_ITEMS = 20;

export const useCipherState = () => {
    // Core State
    const [inputText, setInputText] = useState<string>('Hello World');
    const [outputText, setOutputText] = useState<string>('');
    const [selectedCipherKey, setSelectedCipherKey] = useState<string>(ciphers[0].key);
    const [mode, setMode] = useState<CipherMode>('encode');
    const [params, setParams] = useState<Record<string, any>>({});
    const [preserveCase, setPreserveCase] = useState<boolean>(false);

    // Error & Validation State
    const [paramErrors, setParamErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState<string>('');
    const [errorSegment, setErrorSegment] = useState<string>('');
    const [validationHighlights, setValidationHighlights] = useState<string[]>([]);
    const [validationError, setValidationError] = useState<string>('');
    
    // UI & Status State
    const [isAnalyzingError, setIsAnalyzingError] = useState(false);
    const [copySuccess, setCopySuccess] = useState<string>('');
    const [inputCopySuccess, setInputCopySuccess] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    
    // History State
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    const saveTimeoutRef = useRef<number | null>(null);

    // --- Derived State & Memos ---
    const filteredCiphers = useMemo(() => {
        if (!searchQuery) return ciphers;
        const lowercasedQuery = searchQuery.toLowerCase();
        return ciphers.filter(cipher =>
            cipher.name.toLowerCase().includes(lowercasedQuery) ||
            cipher.description.toLowerCase().includes(lowercasedQuery) ||
            cipher.category.toLowerCase().includes(lowercasedQuery)
        );
    }, [searchQuery]);

    const selectedCipher = useMemo(() => {
        const found = ciphers.find(c => c.key === selectedCipherKey);
        return found && filteredCiphers.some(fc => fc.key === found.key) ? found : filteredCiphers[0] || ciphers[0];
    }, [selectedCipherKey, filteredCiphers]);
    
    const filteredCipherCategories = useMemo(() => filteredCiphers.reduce((acc, cipher) => {
        if (!acc[cipher.category]) acc[cipher.category] = [];
        acc[cipher.category].push(cipher);
        return acc;
    }, {} as Record<string, Cipher[]>), [filteredCiphers]);

    const cipherCategories = useMemo(() => ciphers.reduce((acc, cipher) => {
        if (!acc[cipher.category]) acc[cipher.category] = [];
        acc[cipher.category].push(cipher);
        return acc;
    }, {} as Record<string, Cipher[]>), []);

    const hasParamErrors = useMemo(() => Object.values(paramErrors).some(e => e), [paramErrors]);
    const hasValidationErrors = useMemo(() => !!validationError, [validationError]);

    const currentComplexity = useMemo(() => {
        if (!selectedCipher) return 'Low';
        if (typeof selectedCipher.complexity === 'function') {
            return selectedCipher.complexity(params);
        }
        return selectedCipher.complexity;
    }, [selectedCipher, params]);


    // --- Core Logic Callbacks ---
    const resetParams = useCallback((cipher: Cipher | undefined) => {
        const defaultParams: Record<string, any> = {};
        cipher?.params?.forEach(p => {
            defaultParams[p.key] = p.defaultValue ?? (p.type === 'number' ? 0 : '');
        });
        setParams(defaultParams);
        setParamErrors({});
    }, []);

    const handleCipherProcessing = useCallback(async (isTriggeredByUser = false) => {
        if (hasParamErrors || hasValidationErrors) {
            setOutputText('');
            setError('');
            setErrorSegment('');
            return;
        }
        if (!inputText) {
            setOutputText('');
            setError('');
            setErrorSegment('');
            return;
        }
        if (!selectedCipher) {
            setError('No cipher selected or available.');
            setOutputText('');
            return;
        }
        try {
            const func = mode === 'encode' ? selectedCipher.encode : selectedCipher.decode;
            const result = await func(inputText, { ...params, preserveCase });
            setOutputText(result);
            setError('');
            setErrorSegment('');
            setIsAnalyzingError(false);

            if ((isTriggeredByUser || result !== outputText) && result) {
                const newEntry: HistoryEntry = {
                    id: `${Date.now()}-${selectedCipher.key}`,
                    timestamp: Date.now(),
                    inputText,
                    outputText: result,
                    mode,
                    cipherName: selectedCipher.name,
                    selectedCipherKey: selectedCipher.key,
                    params,
                    preserveCase,
                };
                setHistory(prev => [newEntry, ...prev.filter(e => e.inputText !== inputText || e.selectedCipherKey !== selectedCipher.key)].slice(0, MAX_HISTORY_ITEMS));
            }

        } catch (e) {
            console.error(e);
            setOutputText('');
            setIsAnalyzingError(true);
            setError('');
            setErrorSegment('');
            
            try {
                const analysis = await getAIErrorAnalysis(mode, selectedCipher.name, inputText, e as Error);
                setError(analysis.explanation);
                setErrorSegment(analysis.errorSegment || '');

            } catch (geminiError) {
                console.error("Gemini API error:", geminiError);
                let userMessage = 'An AI-powered analysis of the error could not be performed.';
                if (geminiError instanceof Error) {
                    if (geminiError.message.includes('API key not valid')) {
                        userMessage = 'Could not connect to the AI analysis service (Invalid API Key).';
                    } else if (geminiError.message.includes('429')) {
                        userMessage = 'The AI analysis service is busy. Please wait a moment and try again.';
                    }
                }
                setError(userMessage + `\n\nOriginal error: ${e instanceof Error ? e.message : String(e)}`);
                setErrorSegment('');
            } finally {
                setIsAnalyzingError(false);
            }
        }
    }, [inputText, outputText, mode, selectedCipher, params, hasParamErrors, preserveCase, hasValidationErrors]);

    const loadKey = useCallback((cipherKey: string, keyParams: Record<string, any>) => {
        setSelectedCipherKey(cipherKey);
        
        const cipher = ciphers.find(c => c.key === cipherKey);
        const defaultParams: Record<string, any> = {};
        cipher?.params?.forEach(p => {
            defaultParams[p.key] = p.defaultValue ?? (p.type === 'number' ? 0 : '');
        });

        setParams({ ...defaultParams, ...keyParams });
    }, []);

    // --- Handlers ---
    const handleParamChange = (key: string, value: string | number) => {
        setParams(prev => ({ ...prev, [key]: value }));
        
        const paramDef = selectedCipher?.params?.find(p => p.key === key);
        if (paramDef?.validation) {
            let errorMessage = '';
            if (paramDef.validation.required && (value === '' || value === null || value === undefined)) {
                errorMessage = 'This field is required.';
            } else if (paramDef.validation.min !== undefined && (value as number) < paramDef.validation.min) {
                errorMessage = `Must be ${paramDef.validation.min} or greater.`;
            } else if (paramDef.validation.max !== undefined && (value as number) > paramDef.validation.max) {
                 errorMessage = `Must be ${paramDef.validation.max} or less.`;
            }
            setParamErrors(prev => ({...prev, [key]: errorMessage}));
        }
    };

    const handleClearAll = useCallback(() => {
        setInputText('');
        setOutputText('');
        setError('');
        setErrorSegment('');
        resetParams(selectedCipher);
    }, [resetParams, selectedCipher]);

    const handleSwap = useCallback(() => {
        if (error || isAnalyzingError || hasParamErrors || hasValidationErrors || selectedCipher?.isOneWay) return;
        setInputText(outputText);
        setMode(prevMode => prevMode === 'encode' ? 'decode' : 'encode');
    }, [error, isAnalyzingError, hasParamErrors, hasValidationErrors, outputText, selectedCipher]);

    const handleLoadHistoryEntry = (entry: HistoryEntry) => {
        setInputText(entry.inputText);
        setSelectedCipherKey(entry.selectedCipherKey);
        setMode(entry.mode);
        setParams(entry.params);
        setPreserveCase(entry.preserveCase);
    };

    const handleClearHistory = () => {
        setHistory([]);
    };
    
    const copyToClipboard = () => {
        if (error || isAnalyzingError || !outputText) return;
        navigator.clipboard.writeText(outputText).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => setCopySuccess('Failed to copy'));
    };

    const copyInputToClipboard = () => {
        if (!inputText) return;
        navigator.clipboard.writeText(inputText).then(() => {
            setInputCopySuccess('Copied!');
            setTimeout(() => setInputCopySuccess(''), 2000);
        }, () => setInputCopySuccess('Failed to copy'));
    };
    
    const loadSession = useCallback(() => {
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedState) {
            const { inputText, outputText, selectedCipherKey, mode, params, preserveCase } = JSON.parse(savedState);
            setInputText(inputText);
            setOutputText(outputText);
            setSelectedCipherKey(selectedCipherKey);
            setMode(mode);
            setParams(params);
            setPreserveCase(preserveCase ?? false);
        }
    }, []);

    // --- Effects ---
    useEffect(() => {
      if (filteredCiphers.length > 0 && !filteredCiphers.some(c => c.key === selectedCipherKey)) {
        setSelectedCipherKey(filteredCiphers[0].key);
      }
    }, [filteredCiphers, selectedCipherKey]);
    
    useEffect(() => {
        resetParams(selectedCipher);
    }, [selectedCipher, resetParams]);

    // Force encode mode for one-way ciphers
    useEffect(() => {
        if (selectedCipher?.isOneWay && mode !== 'encode') {
            setMode('encode');
        }
    }, [selectedCipher, mode]);


    // Local storage persistence
    useEffect(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = window.setTimeout(() => {
            const stateToSave = { inputText, outputText, selectedCipherKey, mode, params, preserveCase };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
        }, 500);
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [inputText, outputText, selectedCipherKey, mode, params, preserveCase]);

    // Load from local storage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
        loadSession();
    }, [loadSession]);
    
    // Save history when it changes
    useEffect(() => {
        if (history.length > 0) {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        } else {
            localStorage.removeItem(HISTORY_STORAGE_KEY);
        }
    }, [history]);

    // Real-time input validation
    useEffect(() => {
        const validator: Validator | undefined = mode === 'encode' 
            ? selectedCipher?.inputValidator?.encode
            : selectedCipher?.inputValidator?.decode;
    
        if (validator && inputText) {
            const invalidChars = [...new Set(inputText.match(validator.regex) || [])];
            if (invalidChars.length > 0) {
                setValidationHighlights(invalidChars);
                setValidationError(validator.message);
            } else {
                setValidationHighlights([]);
                setValidationError('');
            }
        } else {
            setValidationHighlights([]);
            setValidationError('');
        }
    }, [inputText, selectedCipher, mode]);

    // Auto-process on input change
    useEffect(() => {
        const timer = setTimeout(() => {
            handleCipherProcessing();
        }, 300);
        return () => clearTimeout(timer);
    }, [handleCipherProcessing]);
    
    
    return {
        // State
        inputText, setInputText,
        outputText,
        selectedCipherKey, setSelectedCipherKey,
        mode, setMode,
        params,
        preserveCase, setPreserveCase,
        paramErrors,
        error,
        errorSegment,
        validationHighlights,
        validationError,
        isAnalyzingError,
        copySuccess,
        inputCopySuccess,
        searchQuery, setSearchQuery,
        history,
        // Derived State
        filteredCiphers,
        selectedCipher,
        filteredCipherCategories,
        cipherCategories,
        hasParamErrors,
        hasValidationErrors,
        currentComplexity,
        // Handlers
        handleCipherProcessing,
        handleParamChange,
        handleClearAll,
        handleSwap,
        handleLoadHistoryEntry,
        handleClearHistory,
        copyToClipboard,
        copyInputToClipboard,
        loadSession,
        loadKey,
    };
};
