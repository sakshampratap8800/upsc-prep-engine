'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface EditModeContextType {
  isEditMode: boolean;
  toggleEditMode: () => void;
  setEditMode: (enabled: boolean) => void;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const [isEditMode, setIsEditModeState] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('upsc_pyq_edit_mode');
    if (saved === 'true') {
      setIsEditModeState(true);
    }
  }, []);

  const setEditMode = (enabled: boolean) => {
    setIsEditModeState(enabled);
    localStorage.setItem('upsc_pyq_edit_mode', enabled ? 'true' : 'false');
  };

  const toggleEditMode = () => {
    setEditMode(!isEditMode);
  };

  return (
    <EditModeContext.Provider value={{ isEditMode, toggleEditMode, setEditMode }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  const context = useContext(EditModeContext);
  if (!context) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return context;
}
