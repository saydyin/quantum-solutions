
import React, { useState, useEffect, useRef } from 'react';
import { useCipherState } from './hooks/useCipherState';
import { Header } from './components/Header';
import { CipherControls } from './components/CipherControls';
import { ParamControls } from './components/ParamControls';
import { IOPanels } from './components/IOPanels';
import { AboutModal, HistoryPanel, AdvisorModal, FrequencyAnalysisModal, CryptanalysisModal } from './components/Modals';
import { KeyManagerModal } from './components/KeyManager';
import { SteganographyTool } from './components/SteganographyTool';
import { getAIAdvisorSuggestion } from './services/ai';
// FIX: Corrected import path
import { ciphers } from './services/ciphers';
// FIX: Corrected import path
import { HistoryEntry, KeyVaultEntry } from './types';
import { MessagingSimulator } from './components/MessagingSimulator';
import { CipherChainingTool } from './components/CipherChainingTool';
import { AIToolkit } from './components/AIToolkit';

export type CipherSuiteTool = 'cipher' | 'steganography' | 'messaging' | 'chaining';

const App: React.FC = () => {
    const cipherState = useCipherState();
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // View State
    const [view, setView] = useState<'cipher' | 'ai'>('cipher');
    const [activeTool, setActiveTool] = useState<CipherSuiteTool>('cipher');

    // Modal State
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isKeyManagerOpen, setIsKeyManagerOpen] = useState(false);
    const [analysisModalConfig, setAnalysisModalConfig] = useState<{ isOpen: boolean, text: string, title: string }>({ isOpen: false, text: '', title: '' });
    const [cryptanalysisModalConfig, setCryptanalysisModalConfig] = useState<{ isOpen: boolean, text: string, title: string }>({ isOpen: false, text: '', title: '' });

    // AI Advisor State
    const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
    const [advisorQuery, setAdvisorQuery] = useState('');
    const [advisorResponse, setAdvisorResponse] = useState<{cipherKey: string, explanation: string} | null>(null);
    const [advisorError, setAdvisorError] = useState('');
    const [isAdvising, setIsAdvising] = useState(false);

    // --- AI Advisor Handlers ---
    const handleGetSuggestion = async () => {
        if (!advisorQuery) {
            setAdvisorError('Please describe what you need.');
            return;
        }
        setIsAdvising(true);
        setAdvisorError('');
        setAdvisorResponse(null);

        try {
            const ciphersList = ciphers.map(c => ({
                key: c.key,
                name: c.name,
                description: c.description,
                category: c.category,
                complexity: typeof c.complexity === 'function' ? 'Varies' : c.complexity,
            }));
            
            const result = await getAIAdvisorSuggestion(advisorQuery, ciphersList);
            setAdvisorResponse(result);

        } catch (err) {
            console.error("Cipher Advisor Error:", err);
            let message = 'An AI-powered analysis could not be performed.';
             if (err instanceof Error) {
                if (err.message.includes('API key not valid')) {
                    message = 'Could not connect to the AI analysis service (Invalid API Key).';
                } else if (err.message.includes('429')) {
                    message = 'The AI analysis service is busy. Please wait a moment and try again.';
                }
            }
            setAdvisorError(message);
        } finally {
            setIsAdvising(false);
        }
    };
    
    const handleUseCipher = (cipherKey: string) => {
        cipherState.setSelectedCipherKey(cipherKey);
        setIsAdvisorOpen(false);
    };
    
    const handleLoadHistory = (entry: HistoryEntry) => {
        cipherState.handleLoadHistoryEntry(entry);
        setIsHistoryOpen(false);
    }

    const handleUseKeyFromVault = (entry: KeyVaultEntry) => {
        cipherState.loadKey(entry.cipherKey, entry.params);
        setIsKeyManagerOpen(false);
    };
    
    const handleAnalysisClick = (type: 'input' | 'output') => {
        if (type === 'input') {
             setAnalysisModalConfig({ isOpen: true, text: cipherState.inputText, title: 'Input Text Analysis' });
        } else {
             setAnalysisModalConfig({ isOpen: true, text: cipherState.outputText, title: 'Output Text Analysis' });
        }
    };

     const handleCryptanalysisClick = (type: 'input' | 'output') => {
        if (type === 'input') {
             setCryptanalysisModalConfig({ isOpen: true, text: cipherState.inputText, title: 'Cryptanalysis: Input' });
        } else {
             setCryptanalysisModalConfig({ isOpen: true, text: cipherState.outputText, title: 'Cryptanalysis: Output' });
        }
    };


    // --- Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    cipherState.handleCipherProcessing(true);
                }
                if (event.shiftKey && event.key.toLowerCase() === 's') {
                    event.preventDefault();
                    cipherState.handleSwap();
                }
                if (event.shiftKey && event.key.toLowerCase() === 'c') {
                    event.preventDefault();
                    cipherState.handleClearAll();
                }
                 if (event.shiftKey && event.key.toLowerCase() === 'h') {
                    event.preventDefault();
                    setIsHistoryOpen(prev => !prev);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cipherState.handleCipherProcessing, cipherState.handleSwap, cipherState.handleClearAll]);


    return (
        <div className="min-h-screen bg-neutral-900 text-neutral-200 font-sans">
            <Header 
              view={view}
              onAboutClick={() => setIsAboutModalOpen(true)} 
              onHistoryClick={() => setIsHistoryOpen(true)}
              onKeyManagerClick={() => setIsKeyManagerOpen(true)} 
              onViewChange={setView}
              activeTool={activeTool}
              onToolChange={setActiveTool}
            />

            <main className="p-2 sm:p-4 max-w-7xl mx-auto">
                {view === 'cipher' ? (
                    <div className="animate-fade-in">
                        {activeTool === 'cipher' && (
                             <div className="space-y-4">
                                <div className="bg-neutral-800/50 p-4 rounded-2xl border border-neutral-700">
                                    <CipherControls 
                                        searchQuery={cipherState.searchQuery}
                                        onSearchQueryChange={cipherState.setSearchQuery}
                                        onAdvisorClick={() => setIsAdvisorOpen(true)}
                                        selectedCipher={cipherState.selectedCipher}
                                        onCipherChange={cipherState.setSelectedCipherKey}
                                        filteredCipherCategories={cipherState.filteredCipherCategories}
                                        currentComplexity={cipherState.currentComplexity}
                                        mode={cipherState.mode}
                                        onModeChange={cipherState.setMode}
                                        onLoadSession={cipherState.loadSession}
                                        onClearAll={cipherState.handleClearAll}
                                    />
                                    <ParamControls 
                                        selectedCipher={cipherState.selectedCipher}
                                        params={cipherState.params}
                                        paramErrors={cipherState.paramErrors}
                                        preserveCase={cipherState.preserveCase}
                                        onParamChange={cipherState.handleParamChange}
                                        onPreserveCaseChange={cipherState.setPreserveCase}
                                    />
                                </div>
                                
                                <IOPanels
                                    inputText={cipherState.inputText}
                                    onInputTextChange={cipherState.setInputText}
                                    inputRef={inputRef}
                                    errorSegment={cipherState.errorSegment}
                                    validationHighlights={cipherState.validationHighlights}
                                    validationError={cipherState.validationError}
                                    inputCopySuccess={cipherState.inputCopySuccess}
                                    onCopyInput={cipherState.copyInputToClipboard}
                                    onClearInput={() => cipherState.setInputText('')}
                                    outputText={cipherState.outputText}
                                    error={cipherState.error}
                                    isAnalyzingError={cipherState.isAnalyzingError}
                                    hasParamErrors={cipherState.hasParamErrors}
                                    hasValidationErrors={cipherState.hasValidationErrors}
                                    copySuccess={cipherState.copySuccess}
                                    onCopyOutput={cipherState.copyToClipboard}
                                    selectedCipher={cipherState.selectedCipher}
                                    mode={cipherState.mode}
                                    params={cipherState.params}
                                    onSwap={cipherState.handleSwap}
                                    onAnalysisClick={handleAnalysisClick}
                                    onCryptanalysisClick={handleCryptanalysisClick}
                                />
                             </div>
                        )}
                        {activeTool === 'steganography' && <SteganographyTool />}
                        {activeTool === 'messaging' && <MessagingSimulator />}
                        {activeTool === 'chaining' && <CipherChainingTool />}
                    </div>
                ) : (
                    <AIToolkit />
                )}
            </main>
            
            <KeyManagerModal 
                isOpen={isKeyManagerOpen} 
                onClose={() => setIsKeyManagerOpen(false)}
                onUseKey={handleUseKeyFromVault}
            />
            <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} cipherCategories={cipherState.cipherCategories} />
            <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={cipherState.history} onLoadEntry={handleLoadHistory} onClearHistory={cipherState.handleClearHistory} />
            <AdvisorModal
                isOpen={isAdvisorOpen}
                onClose={() => setIsAdvisorOpen(false)}
                query={advisorQuery}
                onQueryChange={setAdvisorQuery}
                onGetSuggestion={handleGetSuggestion}
                isLoading={isAdvising}
                error={advisorError}
                response={advisorResponse}
                onUseCipher={handleUseCipher}
            />
            <FrequencyAnalysisModal 
                isOpen={analysisModalConfig.isOpen}
                onClose={() => setAnalysisModalConfig(prev => ({ ...prev, isOpen: false }))}
                text={analysisModalConfig.text}
                title={analysisModalConfig.title}
            />
            <CryptanalysisModal
                isOpen={cryptanalysisModalConfig.isOpen}
                onClose={() => setCryptanalysisModalConfig(prev => ({...prev, isOpen: false}))}
                text={cryptanalysisModalConfig.text}
                title={cryptanalysisModalConfig.title}
            />
        </div>
    );
};

export default App;
