

// FIX: Corrected import path
import { Cipher, CipherParam } from '../types';

export function escapeRegex(string: string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export const generateRandomKey = (cipher: Cipher, parameter: CipherParam, length: number = 8): string | number => {
    if (cipher.key === 'hill-cipher' && parameter.key === 'key') {
        // Generate an invertible 2x2 matrix key for Hill Cipher
        const validDeterminants = new Set([1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25]);
        while (true) {
            const a = Math.floor(Math.random() * 26);
            const b = Math.floor(Math.random() * 26);
            const c = Math.floor(Math.random() * 26);
            const d = Math.floor(Math.random() * 26);
            let det = (a * d - b * c);
            det = (det % 26 + 26) % 26; // Ensure positive modulo
            if (validDeterminants.has(det)) {
                return [a,b,c,d].map(n => String.fromCharCode(n + 65)).join('');
            }
        }
    }
    if (parameter.type === 'number') {
        const min = parameter.validation?.min ?? 1;
        const max = parameter.validation?.max ?? 99999;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // Improved default for text keys
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    // Use more restricted character sets for specific ciphers
    if (['vigenere-cipher', 'beaufort-cipher', 'autokey-cipher', 'keyword-cipher', 'playfair-cipher'].includes(cipher.key)) {
        characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    if (cipher.key === 'gronsfeld-cipher') {
        characters = '0123456789';
    }

    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove `data:mime/type;base64,` prefix
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
};
