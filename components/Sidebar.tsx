import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FaShareAlt } from 'react-icons/fa';
import ShareModal from './ShareModal';
import { playClick } from '../lib/sound';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [totalScore, setTotalScore] = useState<number>(0);

  useEffect(() => {
    if (user?.user_metadata?.total_score !== undefined) {
      setTotalScore(user.user_metadata.total_score);
    } else {
      // Fallback to localStorage for existing users
      try {
        const rawScores = localStorage.getItem('levelScores');
        const scores = rawScores ? JSON.parse(rawScores) : {};
        const total = (Object.values(scores) as number[]).reduce((a: number, b: number) => a + (b || 0), 0);
        setTotalScore(total);
      } catch { }
    }
  }, [user]);

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
        <Link href="/" className="px-3 py-2 rounded hover:bg-gray-700 transition-all">Home</Link>
        <Link href="/leaderboard" className="px-3 py-2 rounded hover:bg-gray-700 transition-all">Global Ranking</Link>
        <Link href="/about" className="px-3 py-2 rounded hover:bg-gray-700 transition-all">About</Link>
        <Link href="/contact" className="px-3 py-2 rounded hover:bg-gray-700 transition-all">Contact</Link>
      </nav>

      <div className="mt-auto pt-4">
        <div className="flex flex-col gap-2">
          {user ? (
            <div className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-center">
              <div className="text-sm font-semibold text-green-400">
                {user.user_metadata?.display_name || user.email?.split('@')[0] || 'Player'}
              </div>
              <div className="text-xs text-gray-400">Level {user.user_metadata?.current_level || 1}</div>
            </div>
          ) : null}

          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => { playClick(); setShareOpen(!shareOpen); }} className="flex-1 w-full bg-gradient-to-r from-green-500 to-green-400 text-gray-900 font-bold py-2 px-3 rounded hover:brightness-110 transition-all inline-flex items-center gap-2">
              <FaShareAlt />
              {shareOpen ? 'Close' : 'Share'}
            </button>
            <button onClick={() => setSidebarOpen(false)} title="Collapse sidebar" className="bg-gray-700 text-gray-200 p-2 rounded hover:bg-gray-600">✕</button>
          </div>
          <ShareModal open={shareOpen} onClose={() => { playClick(); setShareOpen(false); }} />
          {user && (
            <div className="mt-3">
              <button onClick={() => signOut()} className="w-full text-sm bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded">Sign out</button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
