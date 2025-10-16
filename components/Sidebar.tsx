import Link from 'next/link';
import { useEffect, useState } from 'react';
import RetroLogo from './RetroLogo';
import { FaShareAlt } from 'react-icons/fa';
import ShareModal from './ShareModal';
import { playClick } from '../lib/sound';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Sidebar() {
  const { data: session } = useSession();
  const [shareOpen, setShareOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [signupOpen, setSignupOpen] = useState(false);

  useEffect(() => {
    try {
      const rawScores = localStorage.getItem('levelScores');
      const scores = rawScores ? JSON.parse(rawScores) : {};
      const total = (Object.values(scores) as number[]).reduce((a: number, b: number) => a + (b || 0), 0);
      setTotalScore(total);
    } catch { }
  }, []);

  return (
    <aside className={`w-64 bg-gray-800 bg-opacity-40 backdrop-blur-md p-4 rounded-lg border border-gray-700 flex-col hidden md:flex ${sidebarOpen ? '' : 'hidden'}`}>
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <RetroLogo size={44} />
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
          {session ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">Signed in as</div>
              <div className="px-3 py-1 bg-gray-900 border border-gray-700 rounded text-sm">{session.user?.name ?? session.user?.email}</div>
            </div>
          ) : (
            <div>
              <button onClick={() => setSignupOpen(s => !s)} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold py-2 px-3 rounded hover:brightness-105">Sign up</button>
              {signupOpen && (
                <div className="mt-2 flex flex-col gap-2">
                  <button onClick={() => signIn('github')} className="text-sm px-2 py-1 bg-gray-700 rounded">Sign up with GitHub</button>
                  <button onClick={() => signIn('google')} className="text-sm px-2 py-1 bg-gray-700 rounded">Sign up with Google</button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => { playClick(); setShareOpen(!shareOpen); }} className="flex-1 w-full bg-gradient-to-r from-green-500 to-green-400 text-gray-900 font-bold py-2 px-3 rounded hover:brightness-110 transition-all inline-flex items-center gap-2">
              <FaShareAlt />
              {shareOpen ? 'Close' : 'Share'}
            </button>
            <button onClick={() => setSidebarOpen(false)} title="Collapse sidebar" className="bg-gray-700 text-gray-200 p-2 rounded hover:bg-gray-600">✕</button>
          </div>
          <ShareModal open={shareOpen} onClose={() => { playClick(); setShareOpen(false); }} />
          {session && (
            <div className="mt-3">
              <button onClick={() => signOut()} className="w-full text-sm bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded">Sign out</button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
