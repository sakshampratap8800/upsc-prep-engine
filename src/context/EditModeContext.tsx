'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface EditModeContextType {
  isEditMode: boolean;
  isAuthenticated: boolean;
  authToken: string | null;
  isPasswordModalOpen: boolean;
  toggleEditMode: () => void;
  setEditMode: (enabled: boolean) => void;
  openPasswordModal: () => void;
  closePasswordModal: () => void;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const [isEditMode, setIsEditModeState] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('upsc_admin_token');
    const savedMode = localStorage.getItem('upsc_pyq_edit_mode');

    if (savedToken) {
      setAuthToken(savedToken);
      setIsAuthenticated(true);
      if (savedMode === 'true') {
        setIsEditModeState(true);
      }
    } else {
      setIsEditModeState(false);
      localStorage.removeItem('upsc_pyq_edit_mode');
    }
  }, []);

  const openPasswordModal = () => setIsPasswordModalOpen(true);
  const closePasswordModal = () => setIsPasswordModalOpen(false);

  const login = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/verify-edit-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.success && data.token) {
        setAuthToken(data.token);
        setIsAuthenticated(true);
        setIsEditModeState(true);
        localStorage.setItem('upsc_admin_token', data.token);
        localStorage.setItem('upsc_pyq_edit_mode', 'true');
        setIsPasswordModalOpen(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsEditModeState(false);
    setAuthToken(null);
    localStorage.removeItem('upsc_admin_token');
    localStorage.removeItem('upsc_pyq_edit_mode');
  };

  const setEditMode = (enabled: boolean) => {
    if (enabled && !isAuthenticated) {
      openPasswordModal();
      return;
    }
    setIsEditModeState(enabled);
    localStorage.setItem('upsc_pyq_edit_mode', enabled ? 'true' : 'false');
  };

  const toggleEditMode = () => {
    if (!isEditMode) {
      if (!isAuthenticated) {
        openPasswordModal();
      } else {
        setEditMode(true);
      }
    } else {
      setEditMode(false);
    }
  };

  return (
    <EditModeContext.Provider
      value={{
        isEditMode,
        isAuthenticated,
        authToken,
        isPasswordModalOpen,
        toggleEditMode,
        setEditMode,
        openPasswordModal,
        closePasswordModal,
        login,
        logout,
      }}
    >
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
