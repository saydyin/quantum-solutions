
import React, { useMemo } from 'react';
// FIX: Corrected import path
import { CipherMode } from '../types';

interface ScytaleVisualizerProps {
    text: string;
    diameter: number;
    mode: CipherMode;
}

export const ScytaleVisualizer: React.FC<ScytaleVisualizerProps> = ({ text, diameter, mode }) => {
    const gridData = useMemo(() => {
        if (!text || diameter <= 1) return { grid: [], numRows: 0, numCols: 0 };

        const numCols = diameter;
        const numRows = Math.ceil(text.length / numCols);
        const grid: (string | null)[][] = Array.from({ length: numRows }, () => Array(numCols).fill(null));

        for (let i = 0; i < text.length; i++) {
            const row = Math.floor(i / numCols);
            const col = i % numCols;
            grid[row][col] = text[i];
        }

        return { grid, numRows, numCols };
    }, [text, diameter]);

    const { grid, numRows, numCols } = gridData;
    
    const ReadingDirectionIndicator = () => (
        <div className="text-xs text-neutral-400 font-sans italic text-center mb-2">
            {mode === 'encode' 
                ? 'Input is written across rows → Ciphertext is read down columns ↓' 
                : 'Ciphertext is written down columns ↓ Plaintext is read across rows →'
            }
        </div>
    );

    return (
        <div className="bg-neutral-800/50 p-4 rounded-2xl border border-neutral-700">
            <h3 className="text-lg font-bold text-violet-400 mb-3 text-center">Scytale Visualization</h3>
            <ReadingDirectionIndicator />
            <div className="overflow-x-auto p-2">
                <div 
                    className="grid gap-1 mx-auto"
                    style={{ 
                        gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`,
                        width: `${numCols * 2.5}rem` // Each cell is approx 2.5rem wide
                    }}
                >
                    {grid.flat().map((char, index) => (
                        <div 
                            key={index}
                            className={`w-8 h-8 flex items-center justify-center font-mono text-lg rounded-md transition-colors duration-300
                                ${char ? 'bg-neutral-700 text-neutral-200' : 'bg-neutral-800 text-neutral-600'}`
                            }
                            title={`Pos: [${Math.floor(index/numCols)}, ${index%numCols}]`}
                        >
                            {char || '•'}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
