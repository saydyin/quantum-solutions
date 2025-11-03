
import React, { useState, useRef, useCallback } from 'react';
import { encodeMessageInImage, decodeMessageFromImage } from '../utils/steganography';
import { PhotoIcon, DownloadIcon, CopyIcon, TrashIcon, InfoIcon } from './Icons';

type StegoMode = 'encode' | 'decode';

export const SteganographyTool: React.FC = () => {
    const [mode, setMode] = useState<StegoMode>('encode');
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [secretMessage, setSecretMessage] = useState('');
    const [revealedMessage, setRevealedMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    
    const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image file (PNG, JPG, etc.).');
            return;
        }
        setError('');
        setSourceImage(URL.createObjectURL(file));
        setResultImage(null);
        setRevealedMessage('');
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleImageUpload(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    };

    const processImage = useCallback((action: 'encode' | 'decode') => {
        if (!sourceImage || !sourceCanvasRef.current) {
            setError("Please upload an image first.");
            return;
        }
        if (action === 'encode' && !secretMessage) {
            setError("Please enter a secret message to hide.");
            return;
        }

        setIsLoading(true);
        setError('');
        setRevealedMessage('');
        setResultImage(null);

        // Use a timeout to allow the UI to update to the loading state
        setTimeout(() => {
            try {
                const canvas = sourceCanvasRef.current!;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) throw new Error("Could not get canvas context.");
                
                const img = new Image();
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    if (action === 'encode') {
                        const newImageData = encodeMessageInImage(ctx, secretMessage);
                        ctx.putImageData(newImageData, 0, 0);
                        setResultImage(canvas.toDataURL('image/png'));
                    } else {
                        const message = decodeMessageFromImage(ctx);
                        setRevealedMessage(message);
                    }
                };
                img.onerror = () => {
                     throw new Error("Failed to load image onto canvas.");
                };
                img.src = sourceImage;
            } catch (e) {
                setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        }, 50);

    }, [sourceImage, secretMessage]);
    
    const resetAll = () => {
        setSourceImage(null);
        setResultImage(null);
        setSecretMessage('');
        setRevealedMessage('');
        setError('');
        setIsLoading(false);
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(revealedMessage).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    return (
        <div className="bg-neutral-800/50 p-6 rounded-2xl border border-neutral-700">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 mb-4 flex items-center gap-3">
                <PhotoIcon className="w-8 h-8" />
                Image Steganography (LSB)
            </h2>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center bg-neutral-700 p-1 rounded-lg">
                    <button onClick={() => setMode('encode')} className={`px-4 py-1.5 rounded-md text-sm transition ${mode === 'encode' ? 'bg-teal-600 text-white shadow-lg' : 'hover:bg-neutral-600'}`}>Encode</button>
                    <button onClick={() => setMode('decode')} className={`px-4 py-1.5 rounded-md text-sm transition ${mode === 'decode' ? 'bg-teal-600 text-white shadow-lg' : 'hover:bg-neutral-600'}`}>Decode</button>
                </div>
                 <button onClick={resetAll} className="text-sm px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors flex items-center gap-2">
                    <TrashIcon className="w-4 h-4" /> Reset
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Column */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-300">{mode === 'encode' ? '1. Upload Cover Image' : '1. Upload Stego Image'}</h3>
                    <div 
                        className="w-full h-48 bg-neutral-800 border-2 border-dashed border-neutral-600 rounded-lg flex items-center justify-center text-center text-neutral-400 cursor-pointer hover:border-teal-500 hover:bg-neutral-700/50 transition relative"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        {sourceImage ? (
                            <img src={sourceImage} alt="Source" className="max-w-full max-h-full object-contain rounded" />
                        ) : (
                            <div>
                                <PhotoIcon className="w-12 h-12 mx-auto mb-2" />
                                <p>Drop image here or click to upload</p>
                            </div>
                        )}
                    </div>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <canvas ref={sourceCanvasRef} className="hidden"></canvas>

                    {mode === 'encode' && (
                        <>
                            <h3 className="text-lg font-semibold text-neutral-300">2. Enter Secret Message</h3>
                            <textarea
                                value={secretMessage}
                                onChange={(e) => setSecretMessage(e.target.value)}
                                placeholder="Your secret message goes here..."
                                className="w-full h-24 bg-neutral-800 border rounded-xl p-3 resize-y outline-none transition font-mono border-neutral-700 text-neutral-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                disabled={isLoading}
                            />
                        </>
                    )}

                    <button
                        onClick={() => processImage(mode)}
                        disabled={isLoading || !sourceImage}
                        className="w-full px-6 py-2 rounded-lg text-lg font-semibold transition flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white disabled:bg-neutral-600 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Processing...' : (mode === 'encode' ? 'Hide Message' : 'Reveal Message')}
                    </button>
                </div>

                {/* Output Column */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-300">Result</h3>
                    {mode === 'encode' && (
                        <div className="w-full h-48 bg-neutral-800 border border-neutral-700 rounded-lg flex items-center justify-center text-center text-neutral-500 relative">
                            {resultImage ? (
                                <>
                                    <img src={resultImage} alt="Result" className="max-w-full max-h-full object-contain rounded" />
                                    <a href={resultImage} download="stego-image.png" className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-neutral-900/80 hover:bg-teal-600 text-white text-sm rounded-lg transition" title="Download Image">
                                        <DownloadIcon className="w-4 h-4" /> Download
                                    </a>
                                </>
                            ) : (
                                <p>Encoded image will appear here</p>
                            )}
                        </div>
                    )}
                     {mode === 'decode' && (
                         <div className="relative">
                            <textarea
                                value={revealedMessage}
                                readOnly
                                placeholder="Revealed message will appear here..."
                                className="w-full h-48 bg-neutral-800 border rounded-xl p-3 resize-y outline-none transition font-mono border-neutral-700 text-green-300"
                            />
                            {revealedMessage && (
                                 <button onClick={handleCopy} className="absolute top-3 right-3 text-neutral-400 hover:text-white transition" title="Copy message">
                                    {copySuccess ? <span className="text-xs text-green-400">Copied!</span> : <CopyIcon className="w-5 h-5" />}
                                </button>
                            )}
                         </div>
                    )}
                    {error && <p className="text-sm text-red-400 flex items-center gap-1"><InfoIcon className="w-4 h-4" /> {error}</p>}
                </div>
            </div>
        </div>
    );
};
