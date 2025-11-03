
import { Cipher } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Historical Enigma I, M3, M4 rotor and reflector wirings
const ROTORS: Record<string, { wiring: string; notch: string }> = {
    'I':    { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q' },
    'II':   { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E' },
    'III':  { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V' },
    'IV':   { wiring: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notch: 'J' },
    'V':    { wiring: 'VZBRGITYUPSDNHLXAWMJQOFECK', notch: 'Z' },
};
const REFLECTORS: Record<string, string> = {
    'B': 'YRUHQSLDPXNGOKMIEBFZCWVJAT',
    'C': 'FVPJIAOYEDRZXWGCTKUQSBNMHL',
};

class EnigmaMachine {
    private plugboard: Record<string, string> = {};
    private rotors: { wiring: string; notch: string; position: number; ring: number }[] = [];
    private reflector: string = '';

    constructor(rotorNames: string[], reflectorName: string, ringSettings: number[], initialPositions: number[], plugboardPairs: string) {
        this.setPlugboard(plugboardPairs);
        this.setReflector(reflectorName);
        this.setRotors(rotorNames, ringSettings, initialPositions);
    }

    private setPlugboard(pairs: string) {
        this.plugboard = {};
        const connections = pairs.toUpperCase().split(' ').filter(p => p.length === 2 && p[0] !== p[1]);
        const used = new Set();
        for (const pair of connections) {
            const [a, b] = pair;
            if (used.has(a) || used.has(b)) continue; // Ignore invalid pairs
            this.plugboard[a] = b;
            this.plugboard[b] = a;
            used.add(a);
            used.add(b);
        }
    }

    private setReflector(name: string) {
        if (REFLECTORS[name]) {
            this.reflector = REFLECTORS[name];
        }
    }

    private setRotors(names: string[], rings: number[], positions: number[]) {
        this.rotors = names.map((name, i) => {
            const rotor = ROTORS[name];
            return {
                wiring: rotor.wiring,
                notch: rotor.notch,
                position: positions[i],
                ring: rings[i],
            };
        }).reverse(); // Right-to-left order of operation
    }
    
    private stepRotors() {
        if (this.rotors.length < 3) return;
        const rightRotor = this.rotors[0];
        const middleRotor = this.rotors[1];
        
        // Double-stepping anomaly: middle rotor steps if right rotor is at notch OR if it is at notch itself
        const middleRotorSteps = rightRotor.notch.includes(ALPHABET[(rightRotor.position + 26) % 26]);
        const leftRotorSteps = middleRotor.notch.includes(ALPHABET[(middleRotor.position + 26) % 26]);

        // Always step the rightmost rotor
        rightRotor.position = (rightRotor.position + 1) % 26;

        if (middleRotorSteps) {
            middleRotor.position = (middleRotor.position + 1) % 26;
        }
        
        if (leftRotorSteps && middleRotorSteps) { // Left rotor only steps if middle rotor also steps
            this.rotors[2].position = (this.rotors[2].position + 1) % 26;
        }
    }

    private pass(charIndex: number, rotor: any, forward: boolean): number {
        const effectivePosition = (rotor.position - rotor.ring + 26) % 26;
        const entryIndex = (charIndex + effectivePosition) % 26;
        
        let exitIndex: number;
        if (forward) {
            const exitChar = rotor.wiring[entryIndex];
            exitIndex = (ALPHABET.indexOf(exitChar) - effectivePosition + 26) % 26;
        } else {
            const entryChar = ALPHABET[entryIndex];
            const exitCharIndex = rotor.wiring.indexOf(entryChar);
            exitIndex = (exitCharIndex - effectivePosition + 26) % 26;
        }
        return exitIndex;
    }
    
    processChar(char: string): string {
        this.stepRotors();
        
        let charIndex = ALPHABET.indexOf(char);
        
        // 1. Plugboard
        char = this.plugboard[char] || char;
        charIndex = ALPHABET.indexOf(char);

        // 2. Forward through rotors (right to left)
        for(let i=0; i < this.rotors.length; i++) {
            charIndex = this.pass(charIndex, this.rotors[i], true);
        }

        // 3. Reflector
        char = this.reflector[charIndex];
        charIndex = ALPHABET.indexOf(char);

        // 4. Backward through rotors (left to right)
        for(let i = this.rotors.length - 1; i >= 0; i--) {
            charIndex = this.pass(charIndex, this.rotors[i], false);
        }

        // 5. Final plugboard
        let finalChar = ALPHABET[charIndex];
        finalChar = this.plugboard[finalChar] || finalChar;

        return finalChar;
    }
}


export const enigmaCipher: Cipher[] = [
    {
        key: 'enigma-i',
        name: 'Enigma I',
        category: 'Classic',
        description: 'A simulation of the German Enigma I machine used in WWII. A complex polyalphabetic rotor cipher.',
        complexity: 'High',
        inputValidator: { 
            encode: { regex: /[^a-zA-Z]/g, message: 'Enigma only accepts alphabetic characters.' },
            decode: { regex: /[^a-zA-Z]/g, message: 'Enigma only accepts alphabetic characters.' }
        },
        params: [
            { key: 'rotors', label: 'Rotors (e.g., I II III)', type: 'text', defaultValue: 'I II III', description: 'Select 3 rotors from I, II, III, IV, V in order (left to right).' },
            { key: 'reflector', label: 'Reflector', type: 'text', defaultValue: 'B', description: 'Select reflector B or C.' },
            { key: 'ringSettings', label: 'Ring Settings (e.g., 1 1 1)', type: 'text', defaultValue: '1 1 1', description: 'Set the ring positions (1-26) for each rotor.' },
            { key: 'initialPositions', label: 'Initial Positions (e.g., A A A)', type: 'text', defaultValue: 'A A A', description: 'Set the starting letter for each rotor.' },
            { key: 'plugboard', label: 'Plugboard (e.g., AB CD EF)', type: 'text', defaultValue: '', description: 'Up to 10 letter pairs for the plugboard.' },
        ],
        encode: (text, params) => {
            const { rotors = 'I II III', reflector = 'B', ringSettings = '1 1 1', initialPositions = 'A A A', plugboard = '' } = params;

            const rotorNames = rotors.toUpperCase().split(' ').filter((r: string) => ROTORS[r]);
            if (rotorNames.length !== 3) throw new Error("Invalid rotor selection. Please provide 3 valid rotors (e.g., I II III).");
            
            if (!REFLECTORS[reflector.toUpperCase()]) throw new Error("Invalid reflector. Please use B or C.");

            const rings = ringSettings.split(' ').map((r: string) => parseInt(r, 10) - 1).filter((n: number) => !isNaN(n) && n >= 0 && n < 26);
            if (rings.length !== 3) throw new Error("Invalid ring settings. Please provide 3 numbers from 1-26 (e.g., 1 1 1).");
            
            const positions = initialPositions.toUpperCase().split(' ').map((p: string) => ALPHABET.indexOf(p)).filter((n: number) => n !== -1);
            if (positions.length !== 3) throw new Error("Invalid initial positions. Please provide 3 letters (e.g., A A A).");

            const machine = new EnigmaMachine(rotorNames, reflector.toUpperCase(), rings, positions, plugboard);

            return text.toUpperCase().replace(/[^A-Z]/g, '').split('').map(char => machine.processChar(char)).join('');
        },
        decode: (text, params) => {
            // Enigma is reciprocal
            return enigmaCipher[0].encode(text, params);
        }
    }
];
