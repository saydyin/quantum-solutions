import React, { useState, useEffect } from 'react';
import { HistoryIcon, KeyIcon, QuestionIcon, AIToolkitIcon, CubeIcon, PhotoIcon, SendIcon, LinkIcon, CloseIcon, HamburgerIcon } from './Icons';
import { CipherSuiteTool } from '../App';

interface HeaderProps {
    view: 'cipher' | 'ai';
    onAboutClick: () => void;
    onHistoryClick: () => void;
    onKeyManagerClick: () => void;
    onViewChange: (view: 'cipher' | 'ai') => void;
    activeTool: CipherSuiteTool;
    onToolChange: (tool: CipherSuiteTool) => void;
}

const DesktopNav: React.FC<HeaderProps> = ({ view, onAboutClick, onHistoryClick, onKeyManagerClick, activeTool, onToolChange }) => (
    <div className="hidden md:flex items-center gap-1">
        {view === 'cipher' && (
            <>
                <ToolButton title="Cipher Suite" isActive={activeTool === 'cipher'} onClick={() => onToolChange('cipher')}><CubeIcon className="w-6 h-6" /></ToolButton>
                <ToolButton title="Steganography" isActive={activeTool === 'steganography'} onClick={() => onToolChange('steganography')}><PhotoIcon className="w-6 h-6" /></ToolButton>
                <ToolButton title="Messaging Simulator" isActive={activeTool === 'messaging'} onClick={() => onToolChange('messaging')}><SendIcon className="w-6 h-6" /></ToolButton>
                <ToolButton title="Cipher Chaining" isActive={activeTool === 'chaining'} onClick={() => onToolChange('chaining')}><LinkIcon className="w-6 h-6" /></ToolButton>
            
                <div className="p-1 border-l border-neutral-700 ml-1 flex items-center gap-1">
                     <button onClick={onHistoryClick} className="text-neutral-400 hover:text-purple-400 transition-colors p-2" title="History (Ctrl+Shift+H)">
                        <HistoryIcon className="w-6 h-6" />
                    </button>
                    <button onClick={onKeyManagerClick} className="text-neutral-400 hover:text-purple-400 transition-colors p-2" title="Key Manager & Vault">
                        <KeyIcon className="w-6 h-6" />
                    </button>
                </div>
            </>
        )}
        <button onClick={onAboutClick} className="text-neutral-400 hover:text-purple-400 transition-colors p-2" title="About">
            <QuestionIcon className="w-6 h-6" />
        </button>
    </div>
);

const MobileMenu: React.FC<HeaderProps & { isOpen: boolean; onClose: () => void }> = ({ view, onAboutClick, onHistoryClick, onKeyManagerClick, activeTool, onToolChange, isOpen, onClose }) => {
    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    return (
        <div className={`fixed inset-0 z-30 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`absolute top-0 right-0 h-full w-full max-w-xs bg-neutral-800 border-l border-neutral-700 shadow-2xl flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <header className="p-4 border-b border-neutral-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-purple-400">Menu</h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <nav className="p-4 space-y-6 overflow-y-auto">
                    {view === 'cipher' && (
                        <div>
                            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">Tools</h3>
                            <ul className="space-y-1">
                                <MenuItem icon={<CubeIcon />} title="Cipher Suite" isActive={activeTool === 'cipher'} onClick={() => handleAction(() => onToolChange('cipher'))} />
                                <MenuItem icon={<PhotoIcon />} title="Steganography" isActive={activeTool === 'steganography'} onClick={() => handleAction(() => onToolChange('steganography'))} />
                                <MenuItem icon={<SendIcon />} title="Messaging Sim" isActive={activeTool === 'messaging'} onClick={() => handleAction(() => onToolChange('messaging'))} />
                                <MenuItem icon={<LinkIcon />} title="Cipher Chaining" isActive={activeTool === 'chaining'} onClick={() => handleAction(() => onToolChange('chaining'))} />
                            </ul>
                        </div>
                    )}
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">Actions</h3>
                        <ul className="space-y-1">
                             {view === 'cipher' && (
                                <>
                                <MenuItem icon={<HistoryIcon />} title="History" onClick={() => handleAction(onHistoryClick)} />
                                <MenuItem icon={<KeyIcon />} title="Key Manager" onClick={() => handleAction(onKeyManagerClick)} />
                                </>
                             )}
                            <MenuItem icon={<QuestionIcon />} title="About" onClick={() => handleAction(onAboutClick)} />
                        </ul>
                    </div>
                </nav>
            </div>
        </div>
    );
};

const MenuItem: React.FC<{ icon: React.ReactNode; title: string; isActive?: boolean; onClick: () => void; }> = ({ icon, title, isActive = false, onClick }) => (
    <li>
        <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-base ${
            isActive ? 'bg-purple-600 text-white font-semibold' : 'text-neutral-300 hover:bg-neutral-700'
        }`}>
            <span className="w-6 h-6">{icon}</span>
            {title}
        </button>
    </li>
);

const ToolButton: React.FC<{ title: string; isActive: boolean; onClick: () => void; children: React.ReactNode; }> = ({ title, isActive, onClick, children }) => (
    <button onClick={onClick} className={`p-2 rounded-md transition-colors ${isActive ? "bg-neutral-700 text-purple-400" : "text-neutral-400 hover:bg-neutral-700 hover:text-white"}`} title={title}>
        {children}
    </button>
);


export const Header: React.FC<HeaderProps> = (props) => {
    const { view, onViewChange } = props;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768 && isMenuOpen) {
                setIsMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMenuOpen]);

    return (
        <>
            <header className="bg-neutral-900/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between p-2 sm:p-3">
                <div className="flex items-center">
                     <div className="p-1 border-r border-neutral-700 mr-1">
                        {view === 'cipher' 
                            ? <button onClick={() => onViewChange('ai')} className="text-neutral-400 hover:text-purple-400 transition-colors p-2" title="AI Toolkit"><AIToolkitIcon className="w-6 h-6" /></button>
                            : <button onClick={() => onViewChange('cipher')} className="text-neutral-400 hover:text-purple-400 transition-colors p-2" title="Cipher Suite"><CubeIcon className="w-6 h-6" /></button>
                        }
                    </div>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 text-center">
                    <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-violet-400">
                        Quantum Solutions
                    </h1>
                    <p className="hidden sm:block text-neutral-400 mt-1 text-xs">
                        {view === 'cipher' ? 'Advanced Cryptographic Toolkit' : 'Gemini AI Toolkit'}
                    </p>
                </div>

                <div className="flex items-center">
                    <DesktopNav {...props} />
                    <button onClick={() => setIsMenuOpen(true)} className="md:hidden text-neutral-400 hover:text-purple-400 transition-colors p-2" title="Open Menu">
                        <HamburgerIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>
            <MobileMenu {...props} isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </>
    );
};