
// FIX: Corrected import path
import { Cipher } from '../types';

export const transpositionCiphers: Cipher[] = [
    {
        key: 'scytale',
        name: 'Scytale Cipher',
        category: 'Transposition',
        description: 'An ancient Greek transposition cipher that simulates wrapping a message around a cylinder.',
        complexity: 'Low',
        params: [{ 
            key: 'diameter', 
            label: 'Diameter (Sides)', 
            type: 'number', 
            defaultValue: 4, 
            description: 'The number of sides of the cylinder used for transposition. Must be greater than 1.',
            validation: { min: 2, max: 20 } 
        }],
        encode: (text, { diameter = 4 }) => {
            if (diameter <= 1) return text;
            const numRows = Math.ceil(text.length / diameter);
            const grid: (string | null)[][] = Array.from({ length: numRows }, () => Array(diameter).fill(null));

            let textIndex = 0;
            for (let r = 0; r < numRows; r++) {
                for (let c = 0; c < diameter; c++) {
                    if (textIndex < text.length) {
                        grid[r][c] = text[textIndex++];
                    }
                }
            }

            let result = '';
            for (let c = 0; c < diameter; c++) {
                for (let r = 0; r < numRows; r++) {
                    if (grid[r][c]) {
                        result += grid[r][c];
                    }
                }
            }
            return result;
        },
        decode: (text, { diameter = 4 }) => {
            if (diameter <= 1) return text;
            const numRows = Math.ceil(text.length / diameter);
            const numCols = diameter;
            const grid: (string | null)[][] = Array.from({ length: numRows }, () => Array(numCols).fill(null));
            
            let textIndex = 0;
            for (let c = 0; c < numCols; c++) {
                for (let r = 0; r < numRows; r++) {
                    // This logic correctly handles unevenly filled final columns in the ciphertext
                    const numFullCols = text.length % numCols;
                    const threshold = (c < numFullCols || numFullCols === 0) ? numRows : numRows - 1;
                    if (r < threshold) {
                         if (textIndex < text.length) {
                            grid[r][c] = text[textIndex++];
                        }
                    }
                }
            }
            
            let result = '';
            for (let r = 0; r < numRows; r++) {
                for (let c = 0; c < numCols; c++) {
                    if (grid[r][c]) {
                        result += grid[r][c];
                    }
                }
            }
            return result;
        },
    }
];
