
// FIX: Corrected import path
import { Cipher } from '../types';

// --- HASHING HELPERS ---

/**
 * A generic helper function to compute SHA hashes using the Web Crypto API.
 * @param algorithm The SHA algorithm to use.
 * @param text The input text to hash.
 * @returns A promise that resolves to the hexadecimal hash string.
 */
async function shaDigest(algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512', text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Self-contained MD5 implementation.
 * The Web Crypto API does not support MD5 due to its insecurity for cryptographic purposes,
 * but it's included here for legacy and checksum applications.
 * Based on the work of Joseph Myers.
 */
function md5(str: string): string {
    let s = unescape(encodeURIComponent(str));
    let n = s.length,
        i;
    let words: number[] = [];
    for (i = 0; i < n; i++) {
        words[i >> 2] |= s.charCodeAt(i) << ((i % 4) * 8);
    }
    words[n >> 2] |= 0x80 << ((n % 4) * 8);
    words[(((n + 8) >> 6) + 1) * 16 - 2] = n * 8;
    
    const K = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
    const F = [
        (b: number, c: number, d: number) => (b & c) | (~b & d),
        (b: number, c: number, d: number) => (b & d) | (c & ~d),
        (b: number, c: number, d: number) => b ^ c ^ d,
        (b: number, c: number, d: number) => c ^ (b | ~d)
    ];
    const M = [i => i, i => (1 + 5 * i) % 16, i => (5 + 3 * i) % 16, i => (7 * i) % 16];
    const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
    let T: number[] = [];
    for (i = 0; i < 64; i++) {
        T[i] = (0x100000000 * Math.abs(Math.sin(i + 1))) | 0;
    }

    for (i = 0; i < words.length; i += 16) {
        let a = K[0], b = K[1], c = K[2], d = K[3];
        for (let j = 0; j < 64; j++) {
            let k = j >> 4, m = M[k](j);
            let t = a + F[k](b, c, d) + words[i + m] + T[j];
            a = d; d = c; c = b;
            b += (t << S[(k << 2) | (j & 3)]) | (t >>> (32 - S[(k << 2) | (j & 3)]));
        }
        K[0] += a; K[1] += b; K[2] += c; K[3] += d;
    }
    return K.map(x => (x + 0x100000000).toString(16).substr(-8)).join('');
}


// --- HASHING "CIPHER" DEFINITIONS ---
const oneWayError = () => { throw new Error('Hashing is a one-way function and cannot be decoded.'); };

export const hashingCiphers: Cipher[] = [
    {
        key: 'md5',
        name: 'MD5',
        category: 'Hashing',
        description: 'A widely used though cryptographically broken hash function that produces a 128-bit (32-character hex) hash value.',
        complexity: 'Medium',
        isOneWay: true,
        encode: (text) => md5(text),
        decode: oneWayError,
    },
    {
        key: 'sha1',
        name: 'SHA-1',
        category: 'Hashing',
        description: 'A cryptographic hash function that produces a 160-bit (40-character hex) hash value. Considered insecure for most cryptographic uses.',
        complexity: 'Medium',
        isOneWay: true,
        encode: (text) => shaDigest('SHA-1', text),
        decode: oneWayError,
    },
    {
        key: 'sha256',
        name: 'SHA-256',
        category: 'Hashing',
        description: 'A member of the SHA-2 family, producing a 256-bit (64-character hex) hash. Widely used in security applications.',
        complexity: 'Medium',
        isOneWay: true,
        encode: (text) => shaDigest('SHA-256', text),
        decode: oneWayError,
    },
    {
        key: 'sha384',
        name: 'SHA-384',
        category: 'Hashing',
        description: 'A member of the SHA-2 family, producing a 384-bit (96-character hex) hash. A truncated version of SHA-512.',
        complexity: 'Medium',
        isOneWay: true,
        encode: (text) => shaDigest('SHA-384', text),
        decode: oneWayError,
    },
    {
        key: 'sha512',
        name: 'SHA-512',
        category: 'Hashing',
        description: 'A member of the SHA-2 family, producing a 512-bit (128-character hex) hash. Offers a higher level of security.',
        complexity: 'Medium',
        isOneWay: true,
        encode: (text) => shaDigest('SHA-512', text),
        decode: oneWayError,
    },
];
