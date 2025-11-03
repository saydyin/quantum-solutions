
import { Cipher } from '../types';
import { classicCiphers } from './ciphers-classic';
import { modernCiphers } from './ciphers-modern';
import { uncommonCiphers } from './ciphers-uncommon';
import { hashingCiphers } from './ciphers-hashing';
import { transpositionCiphers } from './ciphers-transposition';
import { enigmaCipher } from './ciphers-enigma';

export const ciphers: Cipher[] = [
    ...classicCiphers,
    ...enigmaCipher,
    ...modernCiphers,
    ...uncommonCiphers,
    ...transpositionCiphers,
    ...hashingCiphers,
].sort((a, b) => a.name.localeCompare(b.name));
