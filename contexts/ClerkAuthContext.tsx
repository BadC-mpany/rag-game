import React, { createContext, useContext } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';

interface ClerkAuthContextType {
  user: ReturnType<typeof useUser>['user'];
  isLoaded: ReturnType<typeof useClerkAuth>['isLoaded'];
  isSignedIn: ReturnType<typeof useClerkAuth>['isSignedIn'];
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const ClerkAuthContext = createContext<ClerkAuthContextType | undefined>(undefined);

export const useClerkAuthContext = () => {
  const context = useContext(ClerkAuthContext);
  if (context === undefined) {
    throw new Error('useClerkAuthContext must be used within ClerkAuthProvider');
  }
  return context;
};

/**
 * Hook to use Clerk auth - prefer this over useAuth() from @clerk/nextjs
 * as it provides a consistent interface with typed context
 */
export const useAuth = () => {
  const { user, isLoaded, isSignedIn, signOut, getToken } = useClerkAuth();
  const clerkUser = useUser();

  return {
    user: clerkUser.user,
    isLoaded,
    isSignedIn,
    signOut,
    getToken,
  };
};

export default function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn, signOut, getToken } = useClerkAuth();
  const clerkUser = useUser();

  return (
    <ClerkAuthContext.Provider
      value={{
        user: clerkUser.user,
        isLoaded,
        isSignedIn,
        signOut,
        getToken,
      }}
    >
      {children}
    </ClerkAuthContext.Provider>
  );
}

