import React, { createContext, useContext, useState, useCallback } from 'react';

const GUEST_KEY = 'guest_mode';

interface GuestContextType {
  guestMode: boolean;
  enterGuest: () => void;
  exitGuest: () => void;
}

const GuestCtx = createContext<GuestContextType | null>(null);

export const GuestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guestMode, setGuestMode] = useState(() => localStorage.getItem(GUEST_KEY) === 'true');

  const enterGuest = useCallback(() => {
    localStorage.setItem(GUEST_KEY, 'true');
    setGuestMode(true);
  }, []);

  const exitGuest = useCallback(() => {
    localStorage.removeItem(GUEST_KEY);
    setGuestMode(false);
  }, []);

  return (
    <GuestCtx.Provider value={{ guestMode, enterGuest, exitGuest }}>
      {children}
    </GuestCtx.Provider>
  );
};

export const useGuest = (): GuestContextType => {
  const ctx = useContext(GuestCtx);
  if (!ctx) throw new Error('useGuest must be used within GuestProvider');
  return ctx;
};
