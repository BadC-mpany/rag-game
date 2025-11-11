import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { FaShareAlt } from 'react-icons/fa';
import { useAuth, useClerk, useUser } from '@clerk/nextjs';
import ShareModal from './ShareModal';
import { playClick } from '../lib/sound';

export default function Sidebar() {
  const { userId, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const [sidebarOpen] = useState(true);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [isClient, setIsClient] = useState(false);

  // Determine if sign out button should be shown based on current route
  const shouldShowSignOut = () => {
    const currentPath = router.pathname;
    const hideSignOutPages = ['/', '/leaderboard', '/about', '/contact'];
    return !hideSignOutPages.includes(currentPath);
  };

  const handleClearCache = () => {
    if (window.confirm('This will clear locally stored data like file diffs, which might solve storage issues. Are you sure?')) {
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('level-diffs:') || key === 'cachedTotalScore' || key === 'cachedCurrentLevel') {
            localStorage.removeItem(key);
          }
        });
        alert('Local cache cleared. The page will now reload.');
        window.location.reload();
      } catch (e) {
        alert('Failed to clear cache.');
        console.error(e);
      }
    }
  };

  const fetchUserStats = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    // Check if we have cached data and don't need to refresh
    if (!forceRefresh) {
      const cachedScore = localStorage.getItem('cachedTotalScore');
      const cachedLevel = localStorage.getItem('cachedCurrentLevel');
      if (cachedScore && cachedLevel) {
        setTotalScore(parseInt(cachedScore));
        setCurrentLevel(parseInt(cachedLevel));
        return;
      }
    }
    
    try {
      const res = await fetch('/api/user/stats-clerk', {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        const newScore = data.totalScore || 0;
        const newLevel = data.currentLevel || 1;
        
        // Only update if score increased (new level completed)
        const currentCachedScore = parseInt(localStorage.getItem('cachedTotalScore') || '0');
        if (newScore > currentCachedScore || forceRefresh) {
          setTotalScore(newScore);
          setCurrentLevel(newLevel);
          localStorage.setItem('cachedTotalScore', newScore.toString());
          localStorage.setItem('cachedCurrentLevel', newLevel.toString());
        }
      } else {
        // Fallback to localStorage for existing users
        try {
          const rawScores = localStorage.getItem('levelScores');
          const scores = rawScores ? JSON.parse(rawScores) : {};
          const total = (Object.values(scores) as number[]).reduce((a: number, b: number) => a + (b || 0), 0);
          setTotalScore(total);
        } catch { }
      }
    } catch {
      // Fallback to localStorage for existing users
      try {
        const rawScores = localStorage.getItem('levelScores');
        const scores = rawScores ? JSON.parse(rawScores) : {};
        const total = (Object.values(scores) as number[]).reduce((a: number, b: number) => a + (b || 0), 0);
        setTotalScore(total);
      } catch { }
    }
  }, [user, session?.access_token]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      // Load cached values on client side
      try {
        const cachedScore = localStorage.getItem('cachedTotalScore');
        const cachedLevel = localStorage.getItem('cachedCurrentLevel');
        if (cachedScore) setTotalScore(parseInt(cachedScore));
        if (cachedLevel) setCurrentLevel(parseInt(cachedLevel));
      } catch { }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient && isSignedIn) {
      fetchUserStats();
    }
  }, [user, isClient, fetchUserStats]);

  // Expose refresh function globally so other components can call it
  useEffect(() => {
    (window as { refreshUserStats?: () => void }).refreshUserStats = () => fetchUserStats(true); // Force refresh when called from other components
    return () => {
      delete (window as { refreshUserStats?: () => void }).refreshUserStats;
    };
  }, [fetchUserStats]);

  return (
    <aside className={`w-64 bg-gray-800 bg-opacity-40 backdrop-blur-md p-4 rounded-lg border border-gray-700 flex-col hidden md:flex ${sidebarOpen ? '' : 'hidden'}`}>
      <div className="mb-6">
        <a href="https://www.badcompany.xyz/" target="_blank" rel="noreferrer" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <Image src="/badcompany_logo1_nobkg.png" alt="BadCompany Logo" width={44} height={44} />
          <div>
            <h1 className="text-2xl font-bold text-green-400">Badcompany</h1>
            <p className="text-xs text-gray-400">Hone your red-team skills</p>
          </div>
        </a>
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-400">Total score:</div>
        <div className="text-lg font-bold text-green-300">{totalScore}</div>
      </div>

      <nav className="flex flex-col gap-2">
        <Link href="/" className="px-3 py-2 rounded hover:bg-gray-700 transition-all duration-200 ease-in-out transform hover:translate-x-1">Home</Link>
        <Link href="/leaderboard" className="px-3 py-2 rounded hover:bg-gray-700 transition-all duration-200 ease-in-out transform hover:translate-x-1">Global Ranking</Link>
        <Link href="/about" className="px-3 py-2 rounded hover:bg-gray-700 transition-all duration-200 ease-in-out transform hover:translate-x-1">About</Link>
        <Link href="/contact" className="px-3 py-2 rounded hover:bg-gray-700 transition-all duration-200 ease-in-out transform hover:translate-x-1">Contact</Link>
      </nav>

      <div className="mt-auto pt-4">
        <div className="flex flex-col gap-2">
          {user && isSignedIn ? (
            <div className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-center">
              <div className="text-sm font-semibold text-green-400">
                {user.username || user.firstName || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Player'}
              </div>
              <div className="text-xs text-gray-400">Level {currentLevel}</div>
            </div>
          ) : null}

          <div className="mt-3">
            <button onClick={() => { playClick(); setShareOpen(!shareOpen); }} className="w-full bg-gradient-to-r from-green-500 to-green-400 text-gray-900 font-bold py-2 px-3 rounded hover:brightness-110 transition-all inline-flex items-center gap-2 btn-press">
              <FaShareAlt />
              {shareOpen ? 'Close' : 'Share'}
            </button>
          </div>
          <ShareModal open={shareOpen} onClose={() => { playClick(); setShareOpen(false); }} />
          {isSignedIn && shouldShowSignOut() && (
            <div className="mt-3">
              <button onClick={() => signOut()} className="w-full text-sm bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded btn-press">Sign out</button>
            </div>
          )}
          <div className="mt-3 border-t border-gray-700 pt-3">
            <button 
                onClick={handleClearCache} 
                className="w-full text-sm bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded btn-press"
            >
                Clear Local Cache
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
