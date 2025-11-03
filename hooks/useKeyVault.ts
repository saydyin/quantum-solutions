

import { useState, useEffect } from 'react';
// FIX: Corrected import path
import { KeyVaultEntry } from '../types';

const VAULT_STORAGE_KEY = 'quantumKeyVaultV1';

export const useKeyVault = () => {
    const [keys, setKeys] = useState<KeyVaultEntry[]>([]);

    useEffect(() => {
        try {
            const savedKeys = localStorage.getItem(VAULT_STORAGE_KEY);
            if (savedKeys) {
                setKeys(JSON.parse(savedKeys));
            }
        } catch (error) {
            console.error("Failed to load keys from local storage:", error);
        }
    }, []);

    const saveKeys = (newKeys: KeyVaultEntry[]) => {
        try {
            localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(newKeys));
            setKeys(newKeys);
        } catch (error) {
            console.error("Failed to save keys to local storage:", error);
        }
    };

    const addKey = (name: string, cipherKey: string, params: Record<string, any>) => {
        const newKey: KeyVaultEntry = {
            id: self.crypto.randomUUID(),
            name,
            cipherKey,
            params,
            createdAt: Date.now(),
        };
        const updatedKeys = [newKey, ...keys];
        saveKeys(updatedKeys);
    };

    const deleteKey = (id: string) => {
        const updatedKeys = keys.filter(key => key.id !== id);
        saveKeys(updatedKeys);
    };

    return { keys, addKey, deleteKey };
};
