import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';

export default function Auth() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-300">Loading...</div>
      </div>
    );
  }

  if (isSignedIn) {
    const displayName = user.username || user.firstName || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User';
    
    return (
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-300">
          {displayName}
        </div>
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <button className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold py-2 px-3 rounded transition-all shadow-[0_4px_10px_rgba(0,0,0,0.5)] btn-press">
          Sign In
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded transition-all btn-press">
          Sign Up
        </button>
      </SignUpButton>
    </div>
  );
}
