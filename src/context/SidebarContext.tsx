'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_open');
    if (saved !== null) {
      setIsOpen(saved === 'true');
    }
  }, []);

  const toggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_open', String(next));
      return next;
    });
  };

  const handleSetOpen = (open: boolean) => {
    setIsOpen(open);
    localStorage.setItem('sidebar_open', String(open));
  };

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen: handleSetOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
