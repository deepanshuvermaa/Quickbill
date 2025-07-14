import React, { createContext, useContext, useState } from 'react';

interface HamburgerMenuContextType {
  isOpen: boolean;
  toggleMenu: () => void;
}

const HamburgerMenuContext = createContext<HamburgerMenuContextType | undefined>(undefined);

export function HamburgerMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsOpen(prev => !prev);
  };
  
  return (
    <HamburgerMenuContext.Provider value={{ isOpen, toggleMenu }}>
      {children}
    </HamburgerMenuContext.Provider>
  );
}

export function useHamburgerMenu() {
  const context = useContext(HamburgerMenuContext);
  if (!context) {
    throw new Error('useHamburgerMenu must be used within HamburgerMenuProvider');
  }
  return context;
}