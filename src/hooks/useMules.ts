import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Mule } from '../types';

const STORAGE_KEY = 'maplestory-mule-tracker';

function loadMules(): Mule[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // ignore
  }
  return [];
}

function saveMules(mules: Mule[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mules));
}

export function useMules() {
  const [mules, setMules] = useState<Mule[]>(loadMules);

  useEffect(() => {
    saveMules(mules);
  }, [mules]);

  const addMule = useCallback(() => {
    const newMule: Mule = {
      id: uuidv4(),
      name: '',
      level: 0,
      muleClass: '',
      selectedBosses: [],
    };
    setMules((prev) => [newMule, ...prev]);
    return newMule.id;
  }, []);

  const updateMule = useCallback((id: string, updates: Partial<Omit<Mule, 'id'>>) => {
    setMules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    );
  }, []);

  const deleteMule = useCallback((id: string) => {
    setMules((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const reorderMules = useCallback((oldIndex: number, newIndex: number) => {
    setMules((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(oldIndex, 1);
      result.splice(newIndex, 0, removed);
      return result;
    });
  }, []);

  const sortedMules = [...mules];

  return { mules: sortedMules, addMule, updateMule, deleteMule, reorderMules };
}