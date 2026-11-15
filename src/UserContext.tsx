import React, { createContext, useContext } from 'react';

interface UserContextType {
  userId: string | null;
  sessionToken: string | null;
  onLogout: () => void;
  onSwitchToCompany: () => void;
}

const UserContext = createContext<UserContextType>({
  userId: null,
  sessionToken: null,
  onLogout: () => {},
  onSwitchToCompany: () => {},
});

export function UserProvider({
  userId,
  sessionToken,
  onLogout,
  onSwitchToCompany,
  children,
}: {
  userId: string | null;
  sessionToken: string | null;
  onLogout: () => void;
  onSwitchToCompany: () => void;
  children: React.ReactNode;
}) {
  return (
    <UserContext.Provider value={{ userId, sessionToken, onLogout, onSwitchToCompany }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
