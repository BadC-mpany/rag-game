
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const { user, signOut, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-300">Loading...</div>
      </div>
    );
  }

  if (user) {
    const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
    
    return (
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-300">
          {displayName}
        </div>
        <button 
          onClick={() => signOut()} 
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded transition-all shadow-sm btn-press"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setShowAuthModal(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold py-2 px-3 rounded transition-all shadow-[0_4px_10px_rgba(0,0,0,0.5)] btn-press"
        >
          Sign In
        </button>
      </div>
      
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
}

function AuthModal({ onClose }: { onClose: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (isSignUp && !displayName.trim()) {
      setError('Display name is required');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName.trim());
        if (error) {
          setError(error.message);
        } else {
          setMessage('Check your email for a confirmation link!');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          onClose();
        }
      }
    } catch {
      setError('An unexpected error occurred');
    }
    
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for a password reset link!');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-green-400">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-green-500"
                placeholder="How others will see you"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-green-500"
              required
              minLength={6}
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-green-500"
                required
                minLength={6}
              />
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          {message && (
            <div className="text-green-400 text-sm">{message}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold py-2 px-4 rounded transition-all disabled:opacity-50 btn-press"
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setMessage('');
              setDisplayName('');
            }}
            className="text-green-400 hover:text-green-300 text-sm"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>

        {!isSignUp && (
          <div className="mt-2 text-center">
            <button
              onClick={handleResetPassword}
              className="text-gray-400 hover:text-gray-300 text-sm"
            >
              Forgot your password?
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
