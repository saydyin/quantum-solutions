

/**
 * Calculates the Index of Coincidence (IoC) for a given text.
 * The IoC is a measure of how similar a frequency distribution is to the English language.
 * ~0.067 for standard English, ~0.038 for random text/polyalphabetic ciphers.
 * @param text The input string to analyze.
 * @returns The calculated Index of Coincidence.
 */
export const calculateIOC = (text: string): number => {
    const sanitizedText = text.toUpperCase().replace(/[^A-Z]/g, '');
    const n = sanitizedText.length;

    if (n < 2) {
        return 0;
    }

    const frequencies: Record<string, number> = {};
    for (const char of sanitizedText) {
        frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let sum = 0;
    for (const char in frequencies) {
        const count = frequencies[char];
        sum += count * (count - 1);
    }

    return sum / (n * (n - 1));
};


/**
 * A helper function that applies a Caesar cipher shift to decode text.
 * It preserves the case of the original letters.
 * @param text The text to be shifted.
 * @param shift The number of positions to shift left.
 * @returns The resulting text after the shift.
 */
const applyCaesarShift = (text: string, shift: number): string => {
    return text.split('').map(char => {
        if (/[a-zA-Z]/.test(char)) {
            const isUpperCase = char === char.toUpperCase();
            const base = isUpperCase ? 65 : 97;
            // Using a large multiple of 26 handles negative results from subtraction gracefully
            const newCode = (char.charCodeAt(0) - base - shift + 26 * 10) % 26;
            return String.fromCharCode(newCode + base);
        }
        return char;
    }).join('');
};

/**
 * Brute-forces a Caesar cipher by generating all 26 possible shift decryptions.
 * @param text The ciphertext to solve.
 * @returns An array of objects, each containing a shift and the corresponding result.
 */
export const solveCaesar = (text: string): { shift: number; result: string }[] => {
    const results = [];
    for (let i = 0; i <= 25; i++) {
        results.push({
            shift: i,
            result: applyCaesarShift(text, i)
        });
    }
    return results;
};

/**
 * Finds all factors of a given number.
 * @param num The number to factor.
 * @returns An array of its factors (excluding 1).
 */
const findFactors = (num: number): number[] => {
    const factors = new Set<number>();
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) {
            factors.add(i);
            factors.add(num / i);
        }
    }
    if (num > 1) {
      factors.add(num);
    }
    return Array.from(factors);
};

interface KasiskiResult {
    likelyLengths: { length: number; count: number }[];
    sequences: { sequence: string; positions: number[]; distances: number[] }[];
}

/**
 * Performs Kasiski examination to find the likely key length of a polyalphabetic cipher.
 * @param text The ciphertext to analyze.
 * @returns An object containing likely key lengths and the sequences found.
 */
export const performKasiskiExamination = (text: string): KasiskiResult => {
    const sanitizedText = text.toUpperCase().replace(/[^A-Z]/g, '');
    const sequences = new Map<string, number[]>();

    // Find repeated sequences (3 to 6 characters long)
    for (let len = 6; len >= 3; len--) {
        for (let i = 0; i <= sanitizedText.length - len; i++) {
            const seq = sanitizedText.substring(i, i + len);
            if (!sequences.has(seq)) {
                sequences.set(seq, []);
                // Find all occurrences of this sequence
                let pos = sanitizedText.indexOf(seq, 0);
                while (pos !== -1) {
                    sequences.get(seq)!.push(pos);
                    pos = sanitizedText.indexOf(seq, pos + 1);
                }
                // If only one occurrence, remove it
                if (sequences.get(seq)!.length < 2) {
                    sequences.delete(seq);
                }
            }
        }
    }

    const factorCounts = new Map<number, number>();
    const sequenceDetails: KasiskiResult['sequences'] = [];

    sequences.forEach((positions, sequence) => {
        const distances: number[] = [];
        for (let i = 0; i < positions.length - 1; i++) {
            distances.push(positions[i + 1] - positions[i]);
        }
        sequenceDetails.push({ sequence, positions, distances });

        distances.forEach(dist => {
            const factors = findFactors(dist);
            factors.forEach(factor => {
                factorCounts.set(factor, (factorCounts.get(factor) || 0) + 1);
            });
        });
    });

    const likelyLengths = Array.from(factorCounts.entries())
        .map(([length, count]) => ({ length, count }))
        .sort((a, b) => b.count - a.count || a.length - b.length)
        .slice(0, 5); // Return top 5 likely lengths

    return {
        likelyLengths,
        sequences: sequenceDetails,
    };
};
