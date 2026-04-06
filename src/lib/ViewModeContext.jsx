import React, { createContext, useContext, useState, useEffect } from 'react';

const ViewModeContext = createContext();

export function ViewModeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('viewMode') || 'desktop');

  const toggle = () => {
    setMode(m => {
      const next = m === 'desktop' ? 'phone' : 'desktop';
      localStorage.setItem('viewMode', next);
      return next;
    });
  };

  return (
    <ViewModeContext.Provider value={{ mode, toggle }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export const useViewMode = () => useContext(ViewModeContext);