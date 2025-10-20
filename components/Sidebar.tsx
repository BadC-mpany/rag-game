import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FaShareAlt } from 'react-icons/fa';
import ShareModal from './ShareModal';
import { playClick } from '../lib/sound';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const { user, session, signOut } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);
  const [sidebarOpen] = useState(true);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<number>(1);

  const handleClearCache = () => {
    if (window.confirm('This will clear locally stored data like file diffs, which might solve storage issues. Are you sure?')) {
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('level-diffs:')) {
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

  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      const res = await fetch('/api/user/stats', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setTotalScore(data.totalScore || 0);
        setCurrentLevel(data.currentLevel || 1);
      } else {
        console.log('[Sidebar] Failed to fetch user stats:', res.status);
        // Fallback to localStorage for existing users
        try {
          const rawScores = localStorage.getItem('levelScores');
          const scores = rawScores ? JSON.parse(rawScores) : {};
          const total = (Object.values(scores) as number[]).reduce((a: number, b: number) => a + (b || 0), 0);
          setTotalScore(total);
        } catch { }
      }
    } catch (error) {
      console.log('[Sidebar] Error fetching user stats:', error);
      // Fallback to localStorage for existing users
      try {
        const rawScores = localStorage.getItem('levelScores');
        const scores = rawScores ? JSON.parse(rawScores) : {};
        const total = (Object.values(scores) as number[]).reduce((a: number, b: number) => a + (b || 0), 0);
        setTotalScore(total);
      } catch { }
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, [user]);

  // Expose refresh function globally so other components can call it
  useEffect(() => {
    (window as any).refreshUserStats = fetchUserStats;
    return () => {
      delete (window as any).refreshUserStats;
    };
  }, [user, session]);

  return (
    <aside className={`w-64 bg-gray-800 bg-opacity-40 backdrop-blur-md p-4 rounded-lg border border-gray-700 flex-col hidden md:flex ${sidebarOpen ? '' : 'hidden'}`}>
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <Image src="/badcompany_logo1.jpg" alt="BadCompany Logo" width={44} height={44} className="rounded" />
          <div>
            <h1 className="text-2xl font-bold text-green-400">badcompany</h1>
            <p className="text-xs text-gray-400">Hone your red-team skills</p>
          </div>
        </div>
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
          {user ? (
            <div className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-center">
              <div className="text-sm font-semibold text-green-400">
                {user.user_metadata?.display_name || user.email?.split('@')[0] || 'Player'}
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
          {user && (
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
