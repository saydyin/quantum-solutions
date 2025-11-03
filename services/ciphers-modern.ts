
// FIX: Corrected import path
import { Cipher } from '../types';

export const modernCiphers: Cipher[] = [
    // --- NUMERIC & POSITIONAL ---
    {
        key: 'a1z26',
        name: 'A1Z26',
        category: 'Numeric & Positional',
        description: 'Replaces each letter with its corresponding number in the alphabet.',
        complexity: 'Low',
        keypad: { decode: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ' '] },
        inputValidator: { 
            encode: { regex: /[^a-zA-Z]/g, message: 'A1Z26 encoding only accepts alphabetic characters.' },
            decode: { regex: /[^0-9 ]/g, message: 'A1Z26 decoding only accepts numbers and spaces.' }
        },
        placeholders: { decode: '8 5 12 12 15 23 15 18 12 4' },
        encode: (text) => text.toUpperCase().replace(/[^A-Z]/g, '').split('').map(char => char.charCodeAt(0) - 64).join(' '),
        decode: (text) => text.split(' ').filter(num => num).map(num => String.fromCharCode(parseInt(num, 10) + 64)).join(''),
    },
    {
        key: 'ascii',
        name: 'ASCII',
        category: 'Numeric & Positional',
        description: 'Represents each character as its ASCII decimal number.',
        complexity: 'Low',
        keypad: { decode: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ' '] },
        inputValidator: { decode: { regex: /[^0-9 ]/g, message: 'ASCII decoding only accepts numbers and spaces.' } },
        encode: (text) => text.split('').map(char => char.charCodeAt(0)).join(' '),
        decode: (text) => text.split(' ').filter(num => num).map(num => String.fromCharCode(parseInt(num, 10))).join(''),
    },
    {
        key: 'binary',
        name: 'Binary',
        category: 'Numeric & Positional',
        description: 'Represents each character as its 8-bit binary (UTF-8) value.',
        complexity: 'Low',
        keypad: { decode: ['0', '1', ' '] },
        inputValidator: { decode: { regex: /[^01 ]/g, message: 'Binary decoding only accepts "0", "1", and spaces.' } },
        placeholders: { decode: '01001000 01100101 01101100 01101100 01101111' },
        encode: (text) => text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' '),
        decode: (text) => text.split(' ').filter(bin => bin).map(bin => String.fromCharCode(parseInt(bin, 2))).join(''),
    },
    {
        key: 'hex',
        name: 'Hexadecimal',
        category: 'Numeric & Positional',
        description: 'Represents each character as its hexadecimal value.',
        complexity: 'Low',
        keypad: { decode: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', ' '] },
        inputValidator: { decode: { regex: /[^0-9a-fA-F ]/g, message: 'Hexadecimal decoding only accepts hex characters (0-9, a-f) and spaces.' } },
        placeholders: { decode: '48 65 6C 6C 6F' },
        encode: (text) => text.split('').map(char => char.charCodeAt(0).toString(16).toUpperCase()).join(' '),
        decode: (text) => text.split(' ').filter(hex => hex).map(hex => String.fromCharCode(parseInt(hex, 16))).join(''),
    },
    {
        key: 'octal',
        name: 'Octal',
        category: 'Numeric & Positional',
        description: 'Represents each character as its octal value.',
        complexity: 'Low',
        keypad: { decode: ['0', '1', '2', '3', '4', '5', '6', '7', ' '] },
        inputValidator: { decode: { regex: /[^0-7 ]/g, message: 'Octal decoding only accepts octal digits (0-7) and spaces.' } },
        placeholders: { decode: '110 145 154 154 157' },
        encode: (text) => text.split('').map(char => char.charCodeAt(0).toString(8)).join(' '),
        decode: (text) => text.split(' ').filter(oct => oct).map(oct => String.fromCharCode(parseInt(oct, 8))).join(''),
    },
    // --- SUBSTITUTION ---
     {
        key: 'qwerty',
        name: 'Qwerty Cipher',
        category: 'Substitution',
        description: 'Substitutes letters based on their position on a QWERTY keyboard (e.g., Q for A, W for B).',
        complexity: 'Low',
        supportsCase: true,
        encode: (text, { preserveCase = false }) => {
             const map: Record<string, string> = {
                'A': 'Q', 'B': 'W', 'C': 'E', 'D': 'R', 'E': 'T', 'F': 'Y', 'G': 'U', 'H': 'I', 'I': 'O', 'J': 'P',
                'K': 'A', 'L': 'S', 'M': 'D', 'N': 'F', 'O': 'G', 'P': 'H', 'Q': 'J', 'R': 'K', 'S': 'L', 'T': 'Z',
                'U': 'X', 'V': 'C', 'W': 'V', 'X': 'B', 'Y': 'N', 'Z': 'M'
            };
            return text.split('').map(c => {
                const upperC = c.toUpperCase();
                if (map[upperC]) {
                    const result = map[upperC];
                    return preserveCase && c === c.toLowerCase() ? result.toLowerCase() : result;
                }
                return c;
            }).join('');
        },
        decode: (text, { preserveCase = false }) => {
            const map: Record<string, string> = {
                'Q': 'A', 'W': 'B', 'E': 'C', 'R': 'D', 'T': 'E', 'Y': 'F', 'U': 'G', 'I': 'H', 'O': 'I', 'P': 'J',
                'A': 'K', 'S': 'L', 'D': 'M', 'F': 'N', 'G': 'O', 'H': 'P', 'J': 'Q', 'K': 'R', 'L': 'S', 'Z': 'T',
                'X': 'U', 'C': 'V', 'V': 'W', 'B': 'X', 'N': 'Y', 'M': 'Z'
            };
            return text.split('').map(c => {
                 const upperC = c.toUpperCase();
                if (map[upperC]) {
                    const result = map[upperC];
                    return preserveCase && c === c.toLowerCase() ? result.toLowerCase() : result;
                }
                return c;
            }).join('');
        }
    },
    // --- ESOTERIC & LANGUAGE ---
    {
        key: 'pig-latin',
        name: 'Pig Latin',
        category: 'Esoteric & Language',
        description: 'An English language game where words are altered. "pig" becomes "igpay".',
        complexity: 'Low',
        encode: (text) => {
            const vowels = "aeiouAEIOU";
            return text.split(' ').map(word => {
                if (!word || !/^[a-zA-Z]+$/.test(word)) return word;
                let firstVowelIndex = -1;
                for(let i=0; i<word.length; i++) {
                    if(vowels.includes(word[i])) {
                        firstVowelIndex = i;
                        break;
                    }
                }
                if (firstVowelIndex === 0) {
                    return word + 'yay';
                }
                if (firstVowelIndex > 0) {
                    return word.slice(firstVowelIndex) + word.slice(0, firstVowelIndex) + 'ay';
                }
                return word + 'ay'; // No vowels
            }).join(' ');
        },
        decode: (text) => {
             const vowels = "aeiouAEIOU";
            return text.split(' ').map(word => {
                if (!word || !/^[a-zA-Z]+$/.test(word)) return word;
                if(word.endsWith('yay')) {
                    const stem = word.slice(0, -3);
                    if(stem && vowels.includes(stem[0])) {
                        return stem;
                    }
                }
                if(word.endsWith('ay')) {
                    const stem = word.slice(0, -2);
                    if(!stem) return word;
                    
                    let lastConsonantBlockIndex = -1;
                    for (let i = stem.length - 1; i >= 0; i--) {
                        if (vowels.includes(stem[i])) {
                           lastConsonantBlockIndex = i + 1;
                           break;
                        }
                    }
                    if(lastConsonantBlockIndex === -1 && stem.length > 0) { // All consonants
                         // This case is ambiguous, but we can try to guess by moving the last char to front
                         return stem.slice(-1) + stem.slice(0, -1);
                    }

                    if(lastConsonantBlockIndex !== -1 && lastConsonantBlockIndex < stem.length) {
                        const originalPrefix = stem.slice(lastConsonantBlockIndex);
                        const originalStem = stem.slice(0, lastConsonantBlockIndex);
                        return originalPrefix + originalStem;
                    }
                }
                return word;
            }).join(' ');
        },
    },
     {
        key: 'kenny-code',
        name: 'Kenny Code (South Park)',
        category: 'Esoteric & Language',
        description: 'An esoteric cipher based on muffled speech sounds from the character Kenny.',
        complexity: 'Low',
        inputValidator: {
            encode: { regex: /[^a-zA-Z]/g, message: 'Kenny Code encoding only accepts alphabetic characters.' },
            decode: { regex: /[^mpf ]/gi, message: 'Kenny Code decoding only accepts "m", "p", "f", and spaces (case-insensitive).' }
        },
        encode: (text) => {
            const map: Record<string, string> = { 'A': 'mmm', 'B': 'mmp', 'C': 'mmf', 'D': 'mpm', 'E': 'mpp', 'F': 'mpf', 'G': 'mfm', 'H': 'mfp', 'I': 'mff', 'J': 'pmm', 'K': 'pmp', 'L': 'pmf', 'M': 'ppm', 'N': 'ppp', 'O': 'ppf', 'P': 'pfm', 'Q': 'pfp', 'R': 'pff', 'S': 'fmm', 'T': 'fmp', 'U': 'fmf', 'V': 'fpm', 'W': 'fpp', 'X': 'fpf', 'Y': 'ffm', 'Z': 'ffp' };
            return text.toUpperCase().replace(/[^A-Z]/g, '').split('').map(c => map[c]).join(' ');
        },
        decode: (text) => {
            const map: Record<string, string> = { 'mmm': 'A', 'mmp': 'B', 'mmf': 'C', 'mpm': 'D', 'mpp': 'E', 'mpf': 'F', 'mfm': 'G', 'mfp': 'H', 'mff': 'I', 'pmm': 'J', 'pmp': 'K', 'pmf': 'L', 'ppm': 'M', 'ppp': 'N', 'ppf': 'O', 'pfm': 'P', 'pfp': 'Q', 'pff': 'R', 'fmm': 'S', 'fmp': 'T', 'fmf': 'U', 'fpm': 'V', 'fpp': 'W', 'fpf': 'X', 'ffm': 'Y', 'ffp': 'Z' };
            return text.toLowerCase().split(' ').map(c => map[c] || '').join('');
        }
    },
    // --- TECHNICAL ---
    {
        key: 'leet-speak',
        name: 'Leet Speak (1337)',
        category: 'Technical',
        description: 'Replaces letters with visually similar numbers and symbols.',
        complexity: 'Low',
        encode: (text) => {
            const map: Record<string, string> = {
                'A': '4', 'B': '8', 'C': '(', 'E': '3', 'G': '6', 'I': '1',
                'L': '1', 'O': '0', 'S': '5', 'T': '7', 'Z': '2'
            };
            return text.toUpperCase().split('').map(c => map[c] || c).join('');
        },
        decode: (text) => {
             const map: Record<string, string> = {
                '4': 'A', '8': 'B', '(': 'C', '3': 'E', '6': 'G', '1': 'I', // '1' can also be 'L'
                '0': 'O', '5': 'S', '7': 'T', '2': 'Z'
            };
            // Note: Leet decode is ambiguous. This is a best-effort conversion.
            return text.split('').map(c => map[c] || c).join('');
        },
    },
    {
        key: 'base64',
        name: 'Base64',
        category: 'Technical',
        description: 'Encodes data into a 64-character alphabet, commonly used for transmitting binary data over text-based channels.',
        complexity: 'Low',
        encode: (text) => {
            try {
                // Use TextEncoder to handle UTF-8 characters correctly before encoding
                const encoder = new TextEncoder();
                const data = encoder.encode(text);
                let binary = '';
                data.forEach(byte => {
                    binary += String.fromCharCode(byte);
                });
                return btoa(binary);
            } catch (e) {
                console.error(e);
                return 'Error: Input contains characters that cannot be encoded.';
            }
        },
        decode: (text) => {
            try {
                // Remove any non-base64 characters
                const sanitizedText = text.replace(/[^A-Za-z0-9+/=]/g, '');
                const binaryString = atob(sanitizedText);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                // Use TextDecoder to handle UTF-8 characters correctly
                const decoder = new TextDecoder();
                return decoder.decode(bytes);
            } catch (e) {
                console.error(e);
                return 'Error: Invalid Base64 string. The string to be decoded is not correctly encoded.';
            }
        }
    },
    {
        key: 'url-encoding',
        name: 'URL Encoding',
        category: 'Technical',
        description: 'Encodes text for safe inclusion in URLs, replacing special characters with %xx sequences.',
        complexity: 'Low',
        encode: (text) => {
            try {
                return encodeURIComponent(text);
            } catch (e) {
                return 'Error during URL encoding.';
            }
        },
        decode: (text) => {
            try {
                return decodeURIComponent(text);
            } catch (e) {
                return 'Error: Invalid URL-encoded string.';
            }
        }
    }
];
