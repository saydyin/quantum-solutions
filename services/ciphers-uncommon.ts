


// FIX: Corrected import path
import { Cipher } from '../types';

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


const bifidCipher = (text: string, keyword: string, decode = false): string => {
    if (!keyword) return text;
    const { charToCoord, coordToChar } = generatePolybiusSquare(keyword);
    const sanitizedText = text.toUpperCase().replace(/[^A-Z]/g, '').replace('J', 'I');

    if (!decode) { // ENCODE
        if (!sanitizedText) return '';
        let rows = '';
        let cols = '';
        for (const char of sanitizedText) {
            const coords = charToCoord[char];
            if (coords) {
                rows += coords[0];
                cols += coords[1];
            }
        }
        const combined = rows + cols;
        let result = '';
        for (let i = 0; i < combined.length; i += 2) {
            const coord = combined.substring(i, i + 2);
            result += coordToChar[coord] || '';
        }
        return result;
    } else { // DECODE
        if (!sanitizedText) return '';
        let coords = '';
        for (const char of sanitizedText) {
            coords += charToCoord[char] || '';
        }
        const len = Math.floor(coords.length / 2);
        const rows = coords.substring(0, len);
        const cols = coords.substring(len);
        let result = '';
        for (let i = 0; i < len; i++) {
            const coord = rows[i] + cols[i];
            result += coordToChar[coord] || '';
        }
        return result;
    }
};

const fourSquareCipher = (text: string, key1: string, key2: string, decode = false): string => {
    if (!key1 || !key2) return text;
    const { grid: grid1 } = generatePolybiusSquare(key1);
    const { grid: grid2 } = generatePolybiusSquare(key2);
    const { grid: plainGrid, charToCoord: plainCharToCoord } = generatePolybiusSquare('');

    const sanitizedText = text.toUpperCase().replace(/[^A-Z]/g, '').replace('J', 'I');
    let digraphs = sanitizedText.match(/.{1,2}/g) || [];
    if (digraphs.length > 0 && digraphs[digraphs.length - 1].length === 1) {
        digraphs[digraphs.length - 1] += 'X';
    }

    let result = '';
    for (const digraph of digraphs) {
        const c1 = digraph[0];
        const c2 = digraph[1];
        if(!c1 || !c2) continue;

        if (!decode) { // ENCODE
            const coord1 = plainCharToCoord[c1];
            const coord2 = plainCharToCoord[c2];
            if (!coord1 || !coord2) continue;

            const r1 = parseInt(coord1[0], 10) - 1;
            const c1_grid = parseInt(coord1[1], 10) - 1;
            const r2 = parseInt(coord2[0], 10) - 1;
            const c2_grid = parseInt(coord2[1], 10) - 1;
            result += grid1[r1][c2_grid];
            result += grid2[r2][c1_grid];
        } else { // DECODE
            let r_cipher1 = -1, c_cipher1 = -1, r_cipher2 = -1, c_cipher2 = -1;
            for(let r=0; r<5; r++){
                for(let c=0; c<5; c++){
                    if(grid1[r][c] === c1) { r_cipher1 = r; c_cipher1 = c; }
                    if(grid2[r][c] === c2) { r_cipher2 = r; c_cipher2 = c; }
                }
            }
            if(r_cipher1 !== -1 && r_cipher2 !== -1){
                result += plainGrid[r_cipher1][c_cipher2];
                result += plainGrid[r_cipher2][c_cipher1];
            }
        }
    }
    return result;
};


const createSymbolSubstitutionCipher = (
    key: string, name: string, description: string, category: Cipher['category'],
    encodeMap: Record<string, string>, separator: string = ' '
): Cipher => {
    const decodeMap = Object.fromEntries(Object.entries(encodeMap).map(([k, v]) => [v, k]));
    return {
        key, name, category, description,
        complexity: 'Low',
        supportsCase: false,
        inputValidator: {
            encode: { regex: new RegExp(`[^${Object.keys(encodeMap).join('')}a-zA-Z\\s]`, 'gi'), message: `This cipher only accepts the characters in its alphabet.` }
        },
        encode: (text) => text.toUpperCase().split('').map(char => encodeMap[char] || char).join(separator),
        decode: (text) => {
            const splitSeparator = separator ? new RegExp(separator === ' ' ? '\\s+' : separator) : '';
            if (!splitSeparator) { // Handle character-by-character substitution
                 return text.split('').map(item => decodeMap[item] || item).join('');
            }
            const items = text.split(splitSeparator);
            return items.map(item => decodeMap[item] || item).join('');
        }
    };
};

const columnarTransposition = (text: string, key: string, decode = false): string => {
    key = key.toUpperCase().replace(/[^A-Z]/g, '');
    if (!key) return text;
    
    const sortedKey = key.split('').map((char, index) => ({ char, index })).sort((a, b) => a.char.localeCompare(b.char) || a.index - b.index);
    const keyOrder = sortedKey.map(k => k.index);
    
    if (!decode) {
        const numCols = key.length;
        const numRows = Math.ceil(text.length / numCols);
        const grid: (string | null)[][] = Array.from({ length: numRows }, () => Array(numCols).fill(null));
        let textIndex = 0;
        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
                if (textIndex < text.length) {
                    grid[r][c] = text[textIndex++];
                }
            }
        }
        
        let result = '';
        for (const k_index of keyOrder) {
            for (let r = 0; r < numRows; r++) {
                if(grid[r][k_index]) {
                    result += grid[r][k_index];
                }
            }
        }
        return result;
    } else {
        const numCols = key.length;
        const numRows = Math.floor(text.length / numCols);
        const remainder = text.length % numCols;
        
        const cols: string[] = Array(numCols);
        let textIndex = 0;
        for(let i=0; i < numCols; i++){
            const originalIndex = keyOrder[i];
            const len = numRows + (originalIndex < remainder ? 1 : 0);
            cols[originalIndex] = text.substring(textIndex, textIndex + len);
            textIndex += len;
        }

        let result = '';
        for (let r = 0; r < numRows + 1; r++) {
            for (let c = 0; c < numCols; c++) {
                if (r < cols[c]?.length) {
                    result += cols[c][r];
                }
            }
        }
        return result;
    }
};

const myszkowskiTransposition = (text: string, key: string, decode: boolean): string => {
    key = key.toUpperCase().replace(/[^A-Z]/g, '');
    if (!key) return text;

    const keyChars = [...new Set(key.split(''))].sort();
    const keyMap = keyChars.map((char, index) => {
        let indices = [];
        for (let i = 0; i < key.length; i++) {
            if (key[i] === char) indices.push(i);
        }
        return { char, indices, numeric: index + 1 };
    });

    if (!decode) {
        let result = '';
        for (const k of keyMap) {
            if (k.indices.length === 1) { // Normal columnar transposition for unique letters
                for (let i = k.indices[0]; i < text.length; i += key.length) {
                    result += text[i];
                }
            } else { // Special handling for repeated letters
                let block = '';
                for (let i = 0; i < text.length; i++) {
                    if (k.indices.includes(i % key.length)) {
                        block += text[i];
                    }
                }
                result += block;
            }
        }
        return result;
    } else {
        // Decoding is complex and can be ambiguous, providing a best-effort implementation
        const numCols = key.length;
        const numRows = Math.floor(text.length / numCols);
        const remainder = text.length % numCols;
        
        let grid = Array.from({ length: numRows + 1 }, () => Array(numCols).fill(''));
        let textIndex = 0;

        for (const k of keyMap) {
            if (k.indices.length === 1) {
                const colIndex = k.indices[0];
                const colLength = numRows + (colIndex < remainder ? 1 : 0);
                for (let i = 0; i < colLength; i++) {
                    grid[i][colIndex] = text[textIndex++];
                }
            } else {
                const blockCols = k.indices.length;
                let blockText = '';
                let blockLength = 0;
                 k.indices.forEach(idx => blockLength += numRows + (idx < remainder ? 1 : 0));
                
                blockText = text.substring(textIndex, textIndex + blockLength);
                textIndex += blockLength;
                
                let blockTextIndex = 0;
                 for(let i=0; i < blockText.length; i++){
                    const targetCol = k.indices[i % blockCols];
                    const targetRow = Math.floor(i / blockCols);
                    if(targetRow < grid.length && targetCol < grid[0].length)
                    grid[targetRow][targetCol] = blockText[blockTextIndex++];
                 }
            }
        }

        let result = '';
        for(let r=0; r < numRows + 1; r++){
            for(let c=0; c < numCols; c++){
                result += grid[r][c];
            }
        }
        return result.trim();
    }
};

// --- CIPHER DEFINITIONS ---

export const uncommonCiphers: Cipher[] = [
    // --- FRACTIONATED CIPHERS ---
    {
        key: 'bifid-cipher',
        name: 'Bifid Cipher',
        category: 'Technical',
        description: 'A fractionating cipher combining the Polybius square with transposition, encrypting characters based on their grid coordinates.',
        complexity: 'Medium',
        params: [{ key: 'keyword', label: 'Keyword', type: 'text', placeholder: 'CIPHER', description: 'Keyword to generate the 5x5 substitution square.' }],
        inputValidator: { 
            encode: { regex: /[^a-zA-Z]/g, message: 'Bifid Cipher only accepts alphabetic characters.' },
            decode: { regex: /[^a-zA-Z]/g, message: 'Bifid Cipher only accepts alphabetic characters.' }
        },
        encode: (text, { keyword = 'CIPHER' }) => bifidCipher(text, keyword, false),
        decode: (text, { keyword = 'CIPHER' }) => bifidCipher(text, keyword, true),
    },
    // --- POLYGRAPHIC SUBSTITUTION ---
    {
        key: 'four-square-cipher',
        name: 'Four-Square Cipher',
        category: 'Classic',
        description: 'A digraph substitution cipher using four 5x5 grids to encrypt pairs of letters.',
        complexity: 'High',
        params: [
            { key: 'key1', label: 'Keyword 1', type: 'text', placeholder: 'KEYWORD', description: 'Keyword for the top-right grid.' },
            { key: 'key2', label: 'Keyword 2', type: 'text', placeholder: 'SECRET', description: 'Keyword for the bottom-left grid.' }
        ],
        inputValidator: { 
            encode: { regex: /[^a-zA-Z]/g, message: 'Four-Square Cipher only accepts alphabetic characters.' },
            decode: { regex: /[^a-zA-Z]/g, message: 'Four-Square Cipher only accepts alphabetic characters.' }
        },
        encode: (text, { key1 = 'KEYWORD', key2 = 'SECRET' }) => fourSquareCipher(text, key1, key2, false),
        decode: (text, { key1 = 'KEYWORD', key2 = 'SECRET' }) => fourSquareCipher(text, key1, key2, true),
    },
     {
        key: 'columnar-transposition',
        name: 'Columnar Transposition',
        category: 'Classic',
        description: 'A transposition cipher that rearranges plaintext into columns, then reads them out in an order determined by a keyword.',
        complexity: 'Medium',
        params: [{ key: 'key', label: 'Keyword', type: 'text', placeholder: 'ZEBRA', description: 'The keyword used to determine column order. (Decoding is unreliable with repeated letters in key).' }],
        encode: (text, { key = 'ZEBRA' }) => columnarTransposition(text, key, false),
        decode: (text, { key = 'ZEBRA' }) => columnarTransposition(text, key, true),
    },
    {
        key: 'myszkowski-transposition',
        name: 'Myszkowski Transposition',
        category: 'Technical',
        description: 'A Columnar Transposition variant that handles repeated letters in the keyword differently.',
        complexity: 'Medium',
        params: [{ key: 'key', label: 'Keyword', type: 'text', placeholder: 'TOMATO', description: 'Keyword for column order. Repeated letters are handled specially.' }],
        encode: (text, { key = 'TOMATO' }) => myszkowskiTransposition(text, key, false),
        decode: (text, { key = 'TOMATO' }) => myszkowskiTransposition(text, key, true),
    },
    // --- NUMERIC & POSITIONAL ---
    {
        key: 'tap-code',
        name: 'Tap Code',
        category: 'Numeric & Positional',
        description: 'A simple cipher based on a 5x5 grid, used by prisoners to communicate by tapping sounds. K is replaced by C.',
        complexity: 'Low',
        keypad: { decode: ['.', ' '] },
        inputValidator: {
            encode: { regex: /[^a-zA-Z]/g, message: 'Tap Code only accepts alphabetic characters.' },
            decode: { regex: /[^. ]/g, message: 'Tap Code decoding only accepts dots and spaces.' }
        },
        encode: (text) => {
            const grid = [['A', 'B', 'C', 'D', 'E'], ['F', 'G', 'H', 'I', 'L'], ['M', 'N', 'O', 'P', 'Q'], ['R', 'S', 'T', 'U', 'V'], ['W', 'X', 'Y', 'Z', '']];
            const charMap: Record<string, string> = {};
            grid.forEach((row, r) => row.forEach((char, c) => {
                if (char) charMap[char] = '.'.repeat(r + 1) + ' ' + '.'.repeat(c + 1);
            }));
            charMap['K'] = charMap['C'];
            return text.toUpperCase().replace(/[^A-Z]/g, '').split('').map(c => charMap[c]).join('   ');
        },
        decode: (text) => {
            const grid = [['A', 'B', 'C', 'D', 'E'], ['F', 'G', 'H', 'I', 'L'], ['M', 'N', 'O', 'P', 'Q'], ['R', 'S', 'T', 'U', 'V'], ['W', 'X', 'Y', 'Z', '']];
            return text.split(/   |  /g).map(pair => {
                const parts = pair.split(' ');
                if (parts.length !== 2) return '';
                const r = parts[0].length - 1;
                const c = parts[1].length - 1;
                if (r >= 0 && r < 5 && c >= 0 && c < 5) return grid[r][c];
                return '';
            }).join('');
        }
    },
    // --- CLASSIC & HISTORICAL ---
    {
        key: 'gronsfeld-cipher',
        name: 'Gronsfeld Cipher',
        category: 'Classic',
        description: 'A variation of the Vigenère cipher that uses a numeric key for shifts instead of a keyword.',
        complexity: 'Medium',
        supportsCase: true,
        params: [{ key: 'key', label: 'Numeric Key', type: 'text', placeholder: '31415', description: 'A sequence of digits for the shifting pattern.' }],
        encode: (text, { key = '31415', preserveCase = false }) => {
            if (/[^0-9]/.test(key)) throw new Error("Gronsfeld key must be numeric.");
            const shifts = key.toString().split('').map(Number);
            if (shifts.length === 0) return text;
            let keyIndex = 0;
            return text.split('').map(char => {
                if (/[a-zA-Z]/.test(char)) {
                    const shift = shifts[keyIndex % shifts.length];
                    keyIndex++;
                    let charToProcess = preserveCase ? char : char.toUpperCase();
                    const base = charToProcess >= 'a' ? 97 : 65;
                    return String.fromCharCode(((charToProcess.charCodeAt(0) - base + shift) % 26) + base);
                }
                return char;
            }).join('');
        },
        decode: (text, { key = '31415', preserveCase = false }) => {
            if (/[^0-9]/.test(key)) throw new Error("Gronsfeld key must be numeric.");
            const shifts = key.toString().split('').map(Number);
            if (shifts.length === 0) return text;
            let keyIndex = 0;
            return text.split('').map(char => {
                if (/[a-zA-Z]/.test(char)) {
                    const shift = shifts[keyIndex % shifts.length];
                    keyIndex++;
                    let charToProcess = preserveCase ? char : char.toUpperCase();
                    const base = charToProcess >= 'a' ? 97 : 65;
                    return String.fromCharCode(((charToProcess.charCodeAt(0) - base - shift + 26*10) % 26) + base);
                }
                return char;
            }).join('');
        }
    },
    {
        key: 'porta-cipher',
        name: 'Porta Cipher',
        category: 'Classic',
        description: 'A reciprocal polyalphabetic cipher where the keyword selects one of several substitution alphabets.',
        complexity: 'Medium',
        params: [{ key: 'keyword', label: 'Keyword', type: 'text', placeholder: 'SECRET', description: 'The keyword for encryption.' }],
        encode: (text, { keyword = 'SECRET' }) => {
            const key = keyword.toUpperCase().replace(/[^A-Z]/g, '');
            if (!key) return text;
            const portaTables: Record<string, string> = {
                'AB': 'NOPQRSTUVWXYZABCDEFGHIJKLM', 'CD': 'OPQRSTUVWXYZNABCDEFGHIJKLM', 'EF': 'PQRSTUVWXYZNOABCDEFGHIJKLM',
                'GH': 'QRSTUVWXYZNOPABCDEFGHIJKLM', 'IJ': 'RSTUVWXYZNOPQABCDEFGHIJKLM', 'KL': 'STUVWXYZNOPQRABCDEFGHIJKLM',
                'MN': 'TUVWXYZNOPQRSABCDEFGHIJKLM', 'OP': 'UVWXYZNOPQRSTABCDEFGHIJKLM', 'QR': 'VWXYZNOPQRSTUABCDEFGHIJKLM',
                'ST': 'WXYZNOPQRSTUVABCDEFGHIJKLM', 'UV': 'XYZNOPQRSTUVWABCDEFGHIJKLM', 'WX': 'YZNOPQRSTUVWXABCDEFGHIJKLM',
                'YZ': 'ZNOPQRSTUVWXYABCDEFGHIJKLM'
            };
            let keyIndex = 0;
            return text.toUpperCase().replace(/[^A-Z]/g, '').split('').map(char => {
                const keyChar = key[keyIndex % key.length];
                keyIndex++;
                const keyNum = keyChar.charCodeAt(0) - 65;
                const tableKey = Object.keys(portaTables).find(k => k.includes(String.fromCharCode(Math.floor(keyNum / 2) * 2 + 65))) || 'AB';
                const table = portaTables[tableKey];
                const charIndex = char.charCodeAt(0) - 65;
                return table[charIndex];
            }).join('');
        },
        decode: (text, { keyword = 'SECRET' }) => {
            // It's a reciprocal cipher, so encoding is the same as decoding.
            return uncommonCiphers.find(c => c.key === 'porta-cipher')?.encode(text, { keyword }) || '';
        },
    },

    // --- ESOTERIC & SYMBOLIC ---
    createSymbolSubstitutionCipher('aurebesh', 'Aurebesh (Star Wars)', 'The writing system of the Star Wars galaxy, represented by their names.', 'Esoteric & Language', { 'A': 'Aurek', 'B': 'Besh', 'C': 'Cresh', 'D': 'Dorn', 'E': 'Esk', 'F': 'Forn', 'G': 'Grek', 'H': 'Herf', 'I': 'Isk', 'J': 'Jenth', 'K': 'Krill', 'L': 'Leth', 'M': 'Mern', 'N': 'Nern', 'O': 'Osk', 'P': 'Peth', 'Q': 'Qek', 'R': 'Resh', 'S': 'Senth', 'T': 'Trill', 'U': 'Usk', 'V': 'Vev', 'W': 'Wesk', 'X': 'Xesh', 'Y': 'Yirt', 'Z': 'Zerek' }),
    createSymbolSubstitutionCipher('sga', 'Standard Galactic (Minecraft)', "The writing system from Commander Keen, used for Minecraft's enchanting table.", 'Esoteric & Language', { 'A': '⏃', 'B': '⊏', 'C': '☊', 'D': '⎅', 'E': '⟒', 'F': '⎎', 'G': '☌', 'H': '⊑', 'I': '⟟', 'J': '⟊', 'K': '☍', 'L': '⌰', 'M': '⋔', 'N': '⋏', 'O': '⍜', 'P': '⌿', 'Q': '☌⎍', 'R': '⍀', 'S': '⌇', 'T': '⏁', 'U': '⎍', 'V': '⎐', 'W': '⍙', 'X': '⌖', 'Y': '⊬', 'Z': '⋉' }),
    createSymbolSubstitutionCipher('klingon-piqad', 'Klingon pIqaD (Star Trek)', 'The alphabet for the Klingon language from Star Trek.', 'Esoteric & Language', {'A':'','B':'','C':'','D':'','E':'','F':'','G':'','H':'','I':'','J':'','K':'','L':'','M':'','N':'','O':'','P':'','Q':'','R':'','S':'','T':'','U':'','V':'','W':'','X':'','Y':'','Z':''}, ''),
    createSymbolSubstitutionCipher('daedric', 'Daedric (Elder Scrolls)', 'The runic alphabet of the Daedra from The Elder Scrolls series.', 'Esoteric & Language', {'A':'⇂','B':'⊏','C':'⎓','D':'⎅','E':'⎇','F':'⎎','G':'☌','H':'⊑','I':'⟟','J':'⟊','K':'☍','L':'⌰','M':'⋔','N':'⋏','O':'⍜','P':'⌿','Q':'☌⎍','R':'⍀','S':'⌇','T':'⏁','U':'⎍','V':'⎐','W':'⍙','X':'⌖','Y':'⊬','Z':'⋉'}, ''),
    createSymbolSubstitutionCipher('hylian', 'Ancient Hylian (Zelda)', 'The ancient script of Hyrule from The Legend of Zelda series.', 'Esoteric & Language', {'A':'𐂂','B':'𐂃','C':'𐂄','D':'𐂅','E':'𐂆','F':'𐂇','G':'𐂈','H':'𐂉','I':'𐂊','J':'𐂋','K':'𐂌','L':'𐂍','M':'𐂎','N':'𐂏','O':'𐂐','P':'𐂑','Q':'𐂒','R':'𐂓','S':'𐂔','T':'𐂕','U':'𐂖','V':'𐂗','W':'𐂘','X':'𐂙','Y':'𐂚','Z':'𐂛'}, ''),
    createSymbolSubstitutionCipher('futurama-alien', 'Alien Language 1 (Futurama)', 'The first alien language featured in the show Futurama, a simple substitution cipher.', 'Esoteric & Language', {'A':'@','B':'=','C':'(','D':')','E':'[','F':']','G':'{','H':'}','I':'<','J':'>','K':'/','L':'\\','M':'1','N':'2','O':'3','P':'4','Q':'5','R':'6','S':'7','T':'8','U':'9','V':'0','W':'*','X':'#','Y':'+','Z':'-'}, ''),
    createSymbolSubstitutionCipher('utopian', 'Utopian Alphabet (Thomas More)', 'An alphabet created by Thomas More for his book Utopia.', 'Esoteric & Language', {'A':'⨅','B':'⨆','C':'⨇','D':'⨈','E':'⨉','F':'⨊','G':'⨋','H':'⨌','I':'⨍','J':'⨎','K':'⨏','L':'⨐','M':'⨑','N':'⨒','O':'⨓','P':'⨔','Q':'⨕','R':'⨖','S':'⨗','T':'⨘','U':'⨙','V':'⨚','W':'⨛','X':'⨜','Y':'⨝','Z':'⨞'}, ' '),
    createSymbolSubstitutionCipher('theban-alphabet', "Theban Alphabet (Witches')", "An alphabet used in modern Wicca, of unknown origin but first published in the 16th century.", 'Esoteric & Language', {'A':'𐹠','B':'𐹡','C':'𐹢','D':'𐹣','E':'𐹤','F':'𐹥','G':'𐹦','H':'𐹧','I':'𐹨','J':'𐹩','K':'𐹪','L':'𐹫','M':'𐹬','N':'𐹭','O':'𐹮','P':'𐹯','Q':'𐹰','R':'𐹱','S':'𐹲','T':'𐹳','U':'𐹴','V':'𐹴','W':'𐹵','X':'𐹶','Y':'𐹷','Z':'𐹸'}, ' '),
    createSymbolSubstitutionCipher('elder-futhark', 'Elder Futhark Runes', 'The oldest form of the runic alphabets, used by Germanic tribes.', 'Esoteric & Language', {'A':'ᚨ','B':'ᛒ','C':'ᚲ','D':'ᛞ','E':'ᛖ','F':'ᚠ','G':'ᚷ','H':'ᚺ','I':'ᛁ','J':'ᛃ','K':'ᚲ','L':'ᛚ','M':'ᛗ','N':'ᚾ','O':'ᛟ','P':'ᛈ','Q':'ᚲ','R':'ᚱ','S':'ᛊ','T':'ᛏ','U':'ᚢ','V':'ᚹ','W':'ᚹ','X':'ᛪ','Y':'ᛃ','Z':'ᛉ'}, ' '),
    createSymbolSubstitutionCipher('dovahzul', 'Dovahzul (Skyrim)', 'The language of dragons from Skyrim, represented by their names.', 'Esoteric & Language', {'A':'Ah','B':'Bex','C':'Cah','D':'Dov','E':'Eyl','F':'Fey','G':'Gah','H':'Hev','I':'Iiz','J':'Joor','K':'Kaan','L':'Los','M':'Mey','N':'Naan','O':'Ook','P':'Paar','Q':'Qah','R':'Rah','S':'Slen','T':'Tah','U':'Unslaad','V':'Viir','W':'Wah','X':'Xyl','Y':'Yol','Z':'Zey'}),
    createSymbolSubstitutionCipher('atlantean', 'Atlantean (Disney)', 'The language created for Disney\'s film Atlantis: The Lost Empire.', 'Esoteric & Language', {'A':'🄰','B':'🄱','C':'🄲','D':'🄳','E':'🄴','F':'🄵','G':'🄶','H':'🄷','I':'🄸','J':'🄹','K':'🄺','L':'🄻','M':'🄼','N':'🄽','O':'🄾','P':'🄿','Q':'🅀','R':'🅁','S':'🅂','T':'🅃','U':'🅄','V':'🅅','W':'🅆','X':'🅇','Y':'🅈','Z':'🅉'}, ''),
    createSymbolSubstitutionCipher('matoran', 'Matoran (Bionicle)', 'The primary written language of the Matoran universe in LEGO\'s Bionicle series.', 'Esoteric & Language', {'A':'⫯','B':'⫰','C':'⫱','D':'⫲','E':'⫳','F':'⫴','G':'⫵','H':'⫶','I':'⫷','J':'⫸','K':'⫹','L':'⫺','M':'⫻','N':'⫼','O':'⫽','P':'⫾','Q':'⫿','R':'⬀','S':'⬁','T':'⬂','U':'⬃','V':'⬄','W':'⬅','X':'⬆','Y':'⬇','Z':'⬈'}, ''),
    createSymbolSubstitutionCipher('dancing-men', 'Dancing Men Cipher', 'A cipher from a Sherlock Holmes story, using stick figures (emoji) to represent letters.', 'Esoteric & Language', {'A':'🕺','B':'💃','C':'🕴️','D':'🤸','E':'🧘','F':'🚶','G':'🏃','H':'🧗','I':'🏊','J':'🏄','K':'🚣','L':'🚴','M':'🚵','N':'🤹','O':'🎭','P':'🎨','Q':'🎬','R':'🎤','S':'🎧','T':'🎼','U':'🎹','V':'🎻','W':'🎺','X':'🎷','Y':'🎸','Z':'🥁'}, ''),
    createSymbolSubstitutionCipher('zodiac-signs', 'Zodiac Symbols', 'Replaces letters with the 12 zodiac symbols, repeating as needed.', 'Esoteric & Language', {'A':'♈','B':'♉','C':'♊','D':'♋','E':'♌','F':'♍','G':'♎','H':'♏','I':'♐','J':'♑','K':'♒','L':'♓','M':'♈','N':'♉','O':'♊','P':'♋','Q':'♌','R':'♍','S':'♎','T':'♏','U':'♐','V':'♑','W':'♒','X':'♓','Y':'♈','Z':'♉'}, ''),
    createSymbolSubstitutionCipher('pigpen-cipher', 'Pigpen Cipher', 'A geometric simple substitution cipher which exchanges letters for symbols located in a grid.', 'Esoteric & Language', {'A':'▖','B':'▗','C':'▘','D':'▗','E':'▘','F':'▙','G':'▚','H':'▛','I':'▜','J':'▝','K':'▖','L':'▗','M':'▘','N':'▙','O':'▚','P':'▛','Q':'▜','R':'▝','S':'◰','T':'◱','U':'◲','V':'◳','W':'◴','X':'◵','Y':'◶','Z':'◷'}, ''),
];
