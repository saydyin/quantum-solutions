
// FIX: Corrected import path
import { Cipher } from '../types';

// --- DICTIONARIES AND CONSTANTS ---

const MORSE_CODE_DICT: { [key: string]: string } = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 
    'Y': '-.--.', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--', 
    '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', 
    '9': '----.', '0': '-----', ',': '--..--', '.': '.-.-.-', '?': '..--..', 
    "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', 
    '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', 
    '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.'
};
const MORSE_CODE_REVERSE_DICT = Object.fromEntries(Object.entries(MORSE_CODE_DICT).map(([k, v]) => [v, k]));

const BACONIAN_ENCODE: Record<string, string> = {
    'A': 'AAAAA', 'B': 'AAAAB', 'C': 'AAABA', 'D': 'AAABB', 'E': 'AABAA', 'F': 'AABAB',
    'G': 'AABBA', 'H': 'AABBB', 'I': 'ABAAA', 'J': 'ABAAA', 'K': 'ABABA', 'L': 'ABABB',
    'M': 'ABBAA', 'N': 'ABBAB', 'O': 'ABBBA', 'P': 'ABBBB', 'Q': 'BAAAA', 'R': 'BAAAB',
    'S': 'BAABA', 'T': 'BAABB', 'U': 'BABAA', 'V': 'BABAA', 'W': 'BABBA', 'X': 'BABBB',
    'Y': 'BBAAA', 'Z': 'BBAAB'
};
const BACONIAN_DECODE = Object.fromEntries(Object.entries(BACONIAN_ENCODE).filter(([k,v]) => !['J','V'].includes(k)).map(([k, v]) => [v, k]));


// --- HELPER FUNCTIONS ---

const generatePolybiusSquare = (keyword: string): { grid: string[][], charToCoord: Record<string, string>, coordToChar: Record<string, string> } => {
    keyword = keyword.toUpperCase().replace(/[^A-Z]/g, '').replace('J', 'I');
    const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
    const keySet = new Set(keyword.split(''));
    const matrixChars = [...keySet, ...alphabet.split('').filter(c => !keySet.has(c))];
    const grid: string[][] = Array.from({ length: 5 }, (_, r) => matrixChars.slice(r * 5, r * 5 + 5));
    const charToCoord: Record<string, string> = {};
    const coordToChar: Record<string, string> = {};

    grid.forEach((row, r) => row.forEach((char, c) => {
        const coord = `${r + 1}${c + 1}`;
        charToCoord[char] = coord;
        coordToChar[coord] = char;
    }));
    charToCoord['J'] = charToCoord['I'];

    return { grid, charToCoord, coordToChar };
};


const generateKeywordCipherDicts = (keyword: string, preserveCase: boolean): [{[key: string]: string}, {[key: string]: string}] => {
    keyword = [...new Set(keyword.toUpperCase().split(''))].join('');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const shiftedAlphabet = keyword + alphabet.split('').filter(char => !keyword.includes(char)).join('');
    const encodeDict = Object.fromEntries(alphabet.split('').map((char, i) => [char, shiftedAlphabet[i]]));
    const decodeDict = Object.fromEntries(shiftedAlphabet.split('').map((char, i) => [char, alphabet[i]]));

    if (preserveCase) {
        const lowerAlphabet = alphabet.toLowerCase();
        const lowerShifted = shiftedAlphabet.toLowerCase();
        lowerAlphabet.split('').forEach((char, i) => {
            encodeDict[char] = lowerShifted[i];
            decodeDict[lowerShifted[i]] = char;
        });
    }

    return [encodeDict, decodeDict];
};

const vigenereCipher = (text: string, keyword: string, decode = false, preserveCase = false): string => {
    if (!keyword) return text;
    if (/[^a-zA-Z]/.test(keyword)) {
        throw new Error('Keyword must only contain alphabetic characters.');
    }
    const key = keyword.toUpperCase().replace(/[^A-Z]/g, '');
    if (!key) return text;
    let keyIndex = 0;
    return text.split('').map(char => {
        if (/[a-zA-Z]/.test(char)) {
            const shift = key[keyIndex % key.length].charCodeAt(0) - 65;
            keyIndex++;
            
            let charToProcess = char;
            if (!preserveCase) {
                charToProcess = char.toUpperCase();
            }

            const base = charToProcess >= 'a' ? 97 : 65;
            const charCode = charToProcess.charCodeAt(0) - base;
            
            const newCharCode = decode 
                ? (charCode - shift + 26) % 26 
                : (charCode + shift) % 26;
            
            return String.fromCharCode(newCharCode + base);
        }
        return char;
    }).join('');
};

const beaufortCipher = (text: string, keyword: string, preserveCase = false): string => {
     if (!keyword) return text;
    if (/[^a-zA-Z]/.test(keyword)) {
        throw new Error('Keyword must only contain alphabetic characters.');
    }
    const key = keyword.toUpperCase().replace(/[^A-Z]/g, '');
    if (!key) return text;
    let keyIndex = 0;
    return text.split('').map(char => {
        if (/[a-zA-Z]/.test(char)) {
            const keyChar = key[keyIndex % key.length].charCodeAt(0) - 65;
            keyIndex++;

            let charToProcess = char;
            if (!preserveCase) {
                charToProcess = char.toUpperCase();
            }
            const base = charToProcess >= 'a' ? 97 : 65;
            const charCode = charToProcess.charCodeAt(0) - base;
            const newCharCode = (keyChar - charCode + 26) % 26;
            return String.fromCharCode(newCharCode + base);
        }
        return char;
    }).join('');
};

const playfairCipher = (text: string, keyword: string, decode = false, preserveCase = false): string => {
    if (!keyword) return text;
    keyword = keyword.toUpperCase().replace(/[^A-Z]/g, '').replace('J', 'I');
    const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
    const keySet = new Set(keyword.split(''));
    const matrixChars = [...keySet, ...alphabet.split('').filter(c => !keySet.has(c))];
    const matrix = Array.from({ length: 5 }, (_, r) => matrixChars.slice(r * 5, r * 5 + 5));
    const charMap: Record<string, { r: number, c: number }> = {};
    matrix.forEach((row, r) => row.forEach((char, c) => charMap[char] = { r, c }));

    let originalText = text.toUpperCase().replace(/[^A-Z]/g, '').replace('J', 'I');
    if (originalText.length === 0) return '';
    
    let digraphs: string[] = [];
    let tempText = originalText;
    while(tempText.length > 0) {
        let d1 = tempText[0];
        let d2 = tempText.length > 1 ? tempText[1] : 'X';
        if (d1 === d2) {
            d2 = 'X';
            tempText = tempText.substring(1);
        } else {
            tempText = tempText.substring(2);
        }
        digraphs.push(d1 + d2);
    }
        
    const dir = decode ? -1 : 1;
    let result = digraphs.map(digraph => {
        const [c1, c2] = digraph.split('');
        const pos1 = charMap[c1];
        const pos2 = charMap[c2];
        if (!pos1 || !pos2) return digraph;
        
        let n1, n2;
        if (pos1.r === pos2.r) { // Same row
            n1 = matrix[pos1.r][(pos1.c + dir + 5) % 5];
            n2 = matrix[pos2.r][(pos2.c + dir + 5) % 5];
        } else if (pos1.c === pos2.c) { // Same column
            n1 = matrix[(pos1.r + dir + 5) % 5][pos1.c];
            n2 = matrix[(pos2.r + dir + 5) % 5][pos2.c];
        } else { // Rectangle
            n1 = matrix[pos1.r][pos2.c];
            n2 = matrix[pos2.r][pos1.c];
        }
        return n1 + n2;
    }).join('');
    
    return preserveCase ? result.toLowerCase() : result;
};

const adfgvxCipher = (text: string, squareKey: string, transposeKey: string, decode = false): string => {
    if (!squareKey || !transposeKey) return text;
    
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const gridChars = 'ADFGVX';
    
    const uniqueSquareKey = [...new Set((squareKey.toUpperCase().replace(/[^A-Z0-9]/g, '') + alphabet).split(''))].join('');
    const grid: string[][] = Array.from({ length: 6 }, () => Array(6).fill(''));
    const charMap: Record<string, string> = {};
    const coordMap: Record<string, string> = {};
    
    for (let i = 0; i < 36; i++) {
        const r = Math.floor(i / 6);
        const c = i % 6;
        const char = uniqueSquareKey[i];
        grid[r][c] = char;
        const coords = gridChars[r] + gridChars[c];
        charMap[char] = coords;
        coordMap[coords] = char;
    }

    if (!decode) {
        // ENCODE
        const sanitizedText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const fractionated = sanitizedText.split('').map(char => charMap[char]).join('');
        const sortedKey = transposeKey.split('').map((char, index) => ({ char, index })).sort((a, b) => a.char.localeCompare(b.char) || a.index - b.index);
        const columns: string[] = Array(transposeKey.length).fill('');
        for (let i = 0; i < fractionated.length; i++) {
            columns[i % transposeKey.length] += fractionated[i];
        }
        let ciphertext = '';
        for (const key of sortedKey) {
            ciphertext += columns[key.index];
        }
        return ciphertext;
    } else {
        // DECODE
        const numCols = transposeKey.length;
        if (numCols === 0) return '';
        const numRows = Math.floor(text.length / numCols);
        const remainder = text.length % numCols;
        const sortedKey = transposeKey.split('').map((char, index) => ({ char, index })).sort((a, b) => a.char.localeCompare(b.char) || a.index - b.index);
        const columns: string[] = Array(numCols).fill('');
        let textIndex = 0;
        
        for (let i = 0; i < numCols; i++) {
            const keyInfo = sortedKey[i];
            let len = numRows + (keyInfo.index < remainder ? 1 : 0);
            columns[keyInfo.index] = text.substring(textIndex, textIndex + len);
            textIndex += len;
        }

        let fractionated = '';
        const maxRows = numRows + (remainder > 0 ? 1 : 0);
        for (let r = 0; r < maxRows; r++) {
            for (let c = 0; c < numCols; c++) {
                if (r < columns[c].length) {
                    fractionated += columns[c][r];
                }
            }
        }
        
        let plaintext = '';
        for (let i = 0; i < fractionated.length; i += 2) {
            const pair = fractionated.substring(i, i + 2);
            if (coordMap[pair]) {
                plaintext += coordMap[pair];
            }
        }
        return plaintext;
    }
};

// --- Hill Cipher Helpers ---
const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
const modInverse = (a: number, m: number): number => {
    a = (a % m + m) % m;
    for (let x = 1; x < m; x++) {
        if ((a * x) % m === 1) return x;
    }
    throw new Error("Modular inverse does not exist.");
};

const hillCipher = (text: string, key: string, decode: boolean): string => {
    key = key.toUpperCase().replace(/[^A-Z]/g, '');
    if (key.length !== 4) throw new Error("Hill Cipher key must be 4 alphabetic characters for a 2x2 matrix.");
    
    const k = key.split('').map(c => c.charCodeAt(0) - 65);
    const keyMatrix = [[k[0], k[1]], [k[2], k[3]]];
    
    let det = keyMatrix[0][0] * keyMatrix[1][1] - keyMatrix[0][1] * keyMatrix[1][0];
    det = (det % 26 + 26) % 26;

    if (det === 0 || gcd(det, 26) !== 1) {
        throw new Error("Invalid key: The key matrix is not invertible modulo 26. Its determinant is a factor of 26.");
    }
    
    let processMatrix = keyMatrix;

    if (decode) {
        const detInv = modInverse(det, 26);
        const adjugate = [
            [keyMatrix[1][1], -keyMatrix[0][1]],
            [-keyMatrix[1][0], keyMatrix[0][0]]
        ];
        processMatrix = adjugate.map(row => row.map(val => (val * detInv % 26 + 26) % 26));
    }

    const sanitizedText = text.toUpperCase().replace(/[^A-Z]/g, '');
    let result = '';
    for (let i = 0; i < sanitizedText.length; i += 2) {
        if (i + 1 >= sanitizedText.length) { // Handle odd length
             result += sanitizedText[i];
             continue;
        }
        const p1 = sanitizedText.charCodeAt(i) - 65;
        const p2 = sanitizedText.charCodeAt(i + 1) - 65;
        const c1 = (processMatrix[0][0] * p1 + processMatrix[0][1] * p2) % 26;
        const c2 = (processMatrix[1][0] * p1 + processMatrix[1][1] * p2) % 26;
        result += String.fromCharCode(c1 + 65) + String.fromCharCode(c2 + 65);
    }
    return result;
};


// --- CIPHER IMPLEMENTATIONS ---

export const classicCiphers: Cipher[] = [
    {
        key: 'morse-code',
        name: 'Morse Code',
        category: 'Classic',
        description: 'Represents letters, digits, and punctuation marks as sequences of dots and dashes.',
        complexity: 'Low',
        inputValidator: { decode: { regex: /[^.\- ]/g, message: 'Decode input for Morse Code only accepts dots (.), dashes (-), and spaces.' } },
        placeholders: { decode: '.... . .-.. .-.. --- / .-- --- .-. .-.. -..' },
        encode: (text) => text.toUpperCase().split('').map(char => {
            if (char === ' ') return ' ';
            return MORSE_CODE_DICT[char] || '';
        }).join(' ').replace(/ +/g, ' ').trim(),
        decode: (text) => text.split('   ').map(word => 
            word.split(' ').map(code => MORSE_CODE_REVERSE_DICT[code] || '').join('')
        ).join(' '),
    },
    {
        key: 'caesar-cipher',
        name: 'Caesar Cipher',
        category: 'Classic',
        description: 'A substitution cipher where each letter is shifted a certain number of places down the alphabet.',
        complexity: 'Low',
        supportsCase: true,
        params: [{ key: 'shift', label: 'Shift', type: 'number', defaultValue: 3, description: 'The number of positions to shift letters in the alphabet.' }],
        encode: (text, { shift = 3, preserveCase = false }) => {
            return text.split('').map(char => {
                if (/[a-zA-Z]/.test(char)) {
                    let charToProcess = preserveCase ? char : char.toUpperCase();
                    const base = charToProcess >= 'a' ? 97 : 65;
                    return String.fromCharCode(((charToProcess.charCodeAt(0) - base + shift) % 26) + base);
                }
                return char;
            }).join('');
        },
        decode: (text, { shift = 3, preserveCase = false }) => {
             return text.split('').map(char => {
                if (/[a-zA-Z]/.test(char)) {
                    let charToProcess = preserveCase ? char : char.toUpperCase();
                    const base = charToProcess >= 'a' ? 97 : 65;
                    let newCode = (charToProcess.charCodeAt(0) - base - shift);
                    while(newCode < 0) newCode += 26;
                    return String.fromCharCode((newCode % 26) + base);
                }
                return char;
            }).join('');
        },
    },
    {
        key: 'atbash',
        name: 'Atbash Cipher',
        category: 'Classic',
        description: 'A substitution cipher where the alphabet is reversed. A becomes Z, B becomes Y, and so on.',
        complexity: 'Low',
        supportsCase: true,
        encode: (text, { preserveCase = false }) => {
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const reversed = 'ZYXWVUTSRQPONMLKJIHGFEDCBA';
            return text.split('').map(char => {
                let upperChar = char.toUpperCase();
                const index = alphabet.indexOf(upperChar);
                if (index !== -1) {
                    let res = reversed[index];
                    return preserveCase && char === char.toLowerCase() ? res.toLowerCase() : res;
                }
                return char;
            }).join('');
        },
        decode: (text, { preserveCase = false }) => {
            // Atbash is reciprocal
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const reversed = 'ZYXWVUTSRQPONMLKJIHGFEDCBA';
            return text.split('').map(char => {
                let upperChar = char.toUpperCase();
                const index = reversed.indexOf(upperChar);
                if (index !== -1) {
                    let res = alphabet[index];
                    return preserveCase && char === char.toLowerCase() ? res.toLowerCase() : res;
                }
                return char;
            }).join('');
        },
    },
     {
        key: 'vigenere-cipher',
        name: 'Vigenère Cipher',
        category: 'Classic',
        description: 'A polyalphabetic substitution cipher using a keyword to shift letters.',
        complexity: 'Medium',
        supportsCase: true,
        params: [{ key: 'keyword', label: 'Keyword', type: 'text', placeholder: 'KEY', description: 'The secret keyword for encryption.' }],
        encode: (text, { keyword = 'KEY', preserveCase = false }) => vigenereCipher(text, keyword, false, preserveCase),
        decode: (text, { keyword = 'KEY', preserveCase = false }) => vigenereCipher(text, keyword, true, preserveCase),
    },
    {
        key: 'autokey-cipher',
        name: 'Autokey Cipher',
        category: 'Classic',
        description: 'A Vigenère variant where the key is the keyword followed by the plaintext itself.',
        complexity: 'Medium',
        supportsCase: true,
        params: [{ key: 'keyword', label: 'Keyword', type: 'text', placeholder: 'SECRET', description: 'The secret initial keyword.' }],
        encode: (text, { keyword = 'SECRET', preserveCase = false }) => {
            const sanitizedText = text.replace(/[^a-zA-Z]/g, '');
            const key = (keyword + sanitizedText).toUpperCase();
            return vigenereCipher(text, key, false, preserveCase);
        },
        decode: (text, { keyword = 'SECRET', preserveCase = false }) => {
            if (!keyword) return text;
             if (/[^a-zA-Z]/.test(keyword)) {
                throw new Error('Keyword must only contain alphabetic characters.');
            }
            let key = keyword.toUpperCase();
            let result = '';
            let keyIndex = 0;
            for(const char of text) {
                if (/[a-zA-Z]/.test(char)) {
                    const shift = key[keyIndex % key.length].charCodeAt(0) - 65;
                    keyIndex++;
                    
                    let charToProcess = preserveCase ? char : char.toUpperCase();
                    const base = charToProcess >= 'a' ? 97 : 65;
                    const charCode = charToProcess.charCodeAt(0) - base;
                    const newCharCode = (charCode - shift + 26) % 26;
                    const decodedChar = String.fromCharCode(newCharCode + base);
                    result += decodedChar;
                    key += preserveCase ? decodedChar.toUpperCase() : decodedChar;
                } else {
                    result += char;
                }
            }
            return result;
        }
    },
     {
        key: 'beaufort-cipher',
        name: 'Beaufort Cipher',
        category: 'Classic',
        description: 'A reciprocal polyalphabetic cipher, similar to Vigenère. Encryption is the same as decryption.',
        complexity: 'Medium',
        supportsCase: true,
        params: [{ key: 'keyword', label: 'Keyword', type: 'text', placeholder: 'KEY', description: 'The secret keyword.' }],
        encode: (text, { keyword = 'KEY', preserveCase = false }) => beaufortCipher(text, keyword, preserveCase),
        decode: (text, { keyword = 'KEY', preserveCase = false }) => beaufortCipher(text, keyword, preserveCase),
    },
    {
        key: 'playfair-cipher',
        name: 'Playfair Cipher',
        category: 'Classic',
        description: 'A digraph substitution cipher using a 5x5 grid based on a keyword. J is treated as I.',
        complexity: 'Medium',
        supportsCase: true,
        inputValidator: { 
            encode: { regex: /[^a-zA-Z]/g, message: 'Playfair Cipher only accepts alphabetic characters (a-z, A-Z).' },
            decode: { regex: /[^a-zA-Z]/g, message: 'Playfair Cipher only accepts alphabetic characters (a-z, A-Z).' }
        },
        params: [{ key: 'keyword', label: 'Keyword', type: 'text', placeholder: 'MONARCHY', description: 'The keyword to generate the 5x5 grid.' }],
        encode: (text, { keyword = 'MONARCHY', preserveCase = false }) => playfairCipher(text, keyword, false, preserveCase),
        decode: (text, { keyword = 'MONARCHY', preserveCase = false }) => playfairCipher(text, keyword, true, preserveCase),
    },
    {
        key: 'hill-cipher',
        name: 'Hill Cipher',
        category: 'Classic',
        description: 'A polygraphic substitution cipher using linear algebra. Encrypts pairs of letters with a 2x2 matrix.',
        complexity: 'High',
        params: [{ key: 'key', label: 'Key (4 letters)', type: 'text', placeholder: 'GYBN', description: 'A 4-letter key that forms an invertible 2x2 matrix (e.g., GYBN).'}],
        inputValidator: { 
            encode: { regex: /[^a-zA-Z]/g, message: 'Hill Cipher only accepts alphabetic characters.' },
            decode: { regex: /[^a-zA-Z]/g, message: 'Hill Cipher only accepts alphabetic characters.' }
        },
        encode: (text, { key = 'GYBN' }) => hillCipher(text, key, false),
        decode: (text, { key = 'GYBN' }) => hillCipher(text, key, true),
    },
    {
        key: 'rot13',
        name: 'ROT13',
        category: 'Classic',
        description: 'A simple letter substitution cipher that replaces a letter with the 13th letter after it in the alphabet.',
        complexity: 'Low',
        supportsCase: true, // It's inherently case-preserving
        encode: (text) => text.replace(/[a-zA-Z]/g, (char) => {
            const base = char <= 'Z' ? 65 : 97;
            return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
        }),
        decode: (text) => text.replace(/[a-zA-Z]/g, (char) => {
            // ROT13 is reciprocal
            const base = char <= 'Z' ? 65 : 97;
            return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
        }),
    },
    {
        key: 'keyword-cipher',
        name: 'Keyword Cipher',
        category: 'Classic',
        description: 'A substitution cipher using a keyword to create a mixed alphabet.',
        complexity: 'Low',
        supportsCase: true,
        params: [{ key: 'keyword', label: 'Keyword', type: 'text', placeholder: 'SECRET', description: 'A secret word used to create the substitution alphabet. Duplicates are removed.' }],
        encode: (text, { keyword = 'SECRET', preserveCase = false }) => {
            const [encodeDict] = generateKeywordCipherDicts(keyword, preserveCase);
            const sourceText = preserveCase ? text : text.toUpperCase();
            return sourceText.split('').map(char => encodeDict[char] || char).join('');
        },
        decode: (text, { keyword = 'SECRET', preserveCase = false }) => {
            const [, decodeDict] = generateKeywordCipherDicts(keyword, preserveCase);
            const sourceText = preserveCase ? text : text.toUpperCase();
            return sourceText.split('').map(char => decodeDict[char] || char).join('');
        },
    },
    {
        key: 'baconian-cipher',
        name: 'Baconian Cipher',
        category: 'Classic',
        description: 'Represents each letter with a 5-character sequence of "A"s and "B"s.',
        complexity: 'Low',
        inputValidator: { 
            encode: { regex: /[^a-zA-Z]/g, message: 'Baconian Cipher encoding only accepts alphabetic characters.' },
            decode: { regex: /[^AB ]/g, message: 'Baconian Cipher decoding only accepts "A", "B", and spaces.' }
        },
        encode: (text) => text.toUpperCase().replace(/[^A-Z]/g, '').split('').map(char => BACONIAN_ENCODE[char]).join(' '),
        decode: (text) => text.toUpperCase().replace(/[^AB ]/g, '').split(' ').map(code => BACONIAN_DECODE[code] || '').join(''),
    },
     {
        key: 'rail-fence-cipher',
        name: 'Rail Fence Cipher',
        category: 'Classic',
        description: 'A transposition cipher that writes message letters in a zigzag pattern across several "rails".',
        params: [{ 
            key: 'rails', 
            label: 'Rails', 
            type: 'number', 
            defaultValue: 3, 
            description: 'The number of "rails" to use for the zigzag pattern. Must be greater than 1.',
            validation: { min: 2 } 
        }],
        complexity: (params) => {
            if (params.rails >= 5) return 'Medium';
            return 'Low';
        },
        encode: (text, { rails = 3 }) => {
            if (rails <= 1) return text;
            const fences = Array.from({ length: rails }, (): string[] => []);
            let rail = 0;
            let direction = 1;
            for (const char of text) {
                fences[rail].push(char);
                rail += direction;
                if (rail === rails - 1 || rail === 0) {
                    direction *= -1;
                }
            }
            return fences.map(rail => rail.join('')).join('');
        },
        decode: (text, { rails = 3 }) => {
            if (rails <= 1) return text;
            const textLen = text.length;
            const fences = Array.from({ length: rails }, (): string[] => []);
            const fenceLengths = Array(rails).fill(0);
            let rail = 0;
            let direction = 1;
            for (let i = 0; i < textLen; i++) {
                fenceLengths[rail]++;
                rail += direction;
                if (rail === rails - 1 || rail === 0) {
                    direction *= -1;
                }
            }
            let textIndex = 0;
            for (let i = 0; i < rails; i++) {
                fences[i] = text.substring(textIndex, textIndex + fenceLengths[i]).split('');
                textIndex += fenceLengths[i];
            }
            let result = '';
            rail = 0;
            direction = 1;
            for (let i = 0; i < textLen; i++) {
                result += fences[rail].shift();
                rail += direction;
                if (rail === rails - 1 || rail === 0) {
                    direction *= -1;
                }
            }
            return result;
        },
    },
    {
        key: 'polybius-square',
        name: 'Polybius Square',
        category: 'Classic',
        description: 'A substitution cipher using a 5x5 grid to represent letters as coordinates. J is treated as I.',
        complexity: 'Low',
        keypad: { decode: ['1', '2', '3', '4', '5', ' '] },
        inputValidator: {
            encode: { regex: /[^a-zA-Z]/g, message: 'Polybius Square encoding only accepts alphabetic characters.' },
            decode: { regex: /[^1-5 ]/g, message: 'Polybius Square decoding only accepts numbers from 1-5 and spaces.' }
        },
        encode: (text) => {
             const { charToCoord } = generatePolybiusSquare('');
            return text.toUpperCase().replace(/[^A-Z]/g, '').split('').map(char => charToCoord[char]).join(' ');
        },
        decode: (text) => {
            const { coordToChar } = generatePolybiusSquare('');
            return text.split(' ').filter(pair => pair.length === 2).map(pair => coordToChar[pair] || '?').join('');
        }
    },
    {
        key: 'nihilist-cipher',
        name: 'Nihilist Cipher',
        category: 'Classic',
        description: 'A cipher combining a Polybius square with a Vigenère-like key addition, resulting in numeric ciphertext.',
        complexity: 'Medium',
        params: [
            { key: 'alphabetKey', label: 'Alphabet Key', type: 'text', placeholder: 'NIHILIST', description: 'Keyword for the Polybius square alphabet.' },
            { key: 'cipherKey', label: 'Cipher Key', type: 'text', placeholder: 'SECRET', description: 'Keyword used for encryption addition.' }
        ],
        keypad: { decode: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ' '] },
        inputValidator: {
            encode: { regex: /[^a-zA-Z]/g, message: 'Nihilist Cipher encoding only accepts alphabetic characters.' },
            decode: { regex: /[^0-9 ]/g, message: 'Nihilist Cipher decoding only accepts numbers and spaces.' }
        },
        encode: (text, { alphabetKey = 'NIHILIST', cipherKey = 'SECRET' }) => {
            const { charToCoord } = generatePolybiusSquare(alphabetKey);
            const plainCoords = text.toUpperCase().replace(/[^A-Z]/g, '').split('').map(c => charToCoord[c]);
            const keyCoords = cipherKey.toUpperCase().replace(/[^A-Z]/g, '').split('').map(c => charToCoord[c]);
            if(keyCoords.length === 0) return plainCoords.join(' ');

            return plainCoords.map((coord, i) => {
                const keyCoord = keyCoords[i % keyCoords.length];
                return parseInt(coord, 10) + parseInt(keyCoord, 10);
            }).join(' ');
        },
        decode: (text, { alphabetKey = 'NIHILIST', cipherKey = 'SECRET' }) => {
            const { coordToChar, charToCoord } = generatePolybiusSquare(alphabetKey);
            const keyCoords = cipherKey.toUpperCase().replace(/[^A-Z]/g, '').split('').map(c => charToCoord[c]);
            if(keyCoords.length === 0) return text;
            
            const cipherNumbers = text.split(' ').map(n => parseInt(n, 10));
            
            return cipherNumbers.map((num, i) => {
                const keyCoord = keyCoords[i % keyCoords.length];
                const plainCoord = (num - parseInt(keyCoord, 10)).toString();
                return coordToChar[plainCoord] || '?';
            }).join('');
        }
    },
    {
        key: 'adfgvx-cipher',
        name: 'ADFGVX Cipher',
        category: 'Classic',
        description: 'A WWI German cipher combining a 6x6 Polybius square (for A-Z, 0-9) with columnar transposition.',
        complexity: 'High',
        inputValidator: {
            encode: { regex: /[^a-zA-Z0-9]/g, message: 'ADFGVX only accepts alphanumeric characters.' },
            decode: { regex: /[^ADFGVX]/gi, message: 'ADFGVX ciphertext only contains the letters A, D, F, G, V, X.' }
        },
        params: [
            { key: 'squareKey', label: 'Square Key', type: 'text', placeholder: 'SECRETKEY', description: 'Keyword to generate the 6x6 substitution square.' },
            { key: 'transposeKey', label: 'Transpose Key', type: 'text', placeholder: 'CIPHER', description: 'Keyword for the columnar transposition.' }
        ],
        encode: (text, { squareKey = 'SECRETKEY', transposeKey = 'CIPHER' }) => adfgvxCipher(text, squareKey, transposeKey, false),
        decode: (text, { squareKey = 'SECRETKEY', transposeKey = 'CIPHER' }) => adfgvxCipher(text, squareKey, transposeKey, true),
    },
];
