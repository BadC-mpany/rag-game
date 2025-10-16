
import type { NextPage, GetStaticProps } from 'next';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
// RetroLogo is provided in the shared Sidebar; remove local import
import Sidebar from '../components/Sidebar';
import { playClick } from '../lib/sound';
import { FiAlertCircle } from 'react-icons/fi';
import { getAdminMode, setAdminMode } from '../lib/admin';

interface Level {
  id: string;
  title: string;
  description: string;
  goal: string;
  singleTurn?: boolean;
  allowsFiles?: boolean;
  unlockedBy?: string | null;
  gameId?: string;
}

interface HomeProps {
  levels: Level[];
}

const Home: NextPage<HomeProps> = ({ levels }) => {
  // Start with a stable server-safe value to avoid hydration mismatch.
  // `getAdminMode()` reads localStorage and is applied on the client in an effect below.
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [completedLevels, setCompletedLevels] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('completedLevels');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const [levelScores, setLevelScores] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const rawScores = localStorage.getItem('levelScores');
      return rawScores ? JSON.parse(rawScores) : {};
    } catch { return {}; }
  });
  const { data: session } = useSession();

  // Hydration flag: avoid rendering level availability on the server to prevent
  // flicker/hydration mismatch with client-localStorage-derived state.
  const [hydrated, setHydrated] = useState<boolean>(false);
  useEffect(() => { setHydrated(true); }, []);

  // completedLevels and levelScores are initialized synchronously from localStorage to avoid UI flicker.

  // Fetch server progress when user is signed in and merge into localStorage
  useEffect(() => {
    const fetchProgress = async () => {
      if (!session) return;
      try {
        const res = await fetch('/api/progress');
        if (res.ok) {
          const data = await res.json();
          try {
            const rawScores = localStorage.getItem('levelScores');
            const scores = rawScores ? JSON.parse(rawScores) : {};
            const mergedScores = { ...scores, ...(data.levelScores || {}) };
            for (const k of Object.keys(mergedScores)) {
              mergedScores[k] = Math.max(scores[k] || 0, mergedScores[k] || 0);
            }
            localStorage.setItem('levelScores', JSON.stringify(mergedScores));
            setLevelScores(mergedScores);

            const rawCompleted = localStorage.getItem('completedLevels');
            const comp = rawCompleted ? JSON.parse(rawCompleted) : [];
            const mergedCompleted = Array.from(new Set([...(comp || []), ...(data.completedLevels || [])]));
            localStorage.setItem('completedLevels', JSON.stringify(mergedCompleted));
            setCompletedLevels(mergedCompleted);
          } catch {
            // ignore local merge errors
          }
        }
      } catch {
        // ignore network errors
      }
    }
    fetchProgress();
  }, [session]);

  // note: level completion is handled by the judge flow in play/[level].tsx

  useEffect(() => {
    setIsAdmin(getAdminMode());
    const onStorage = () => setIsAdmin(getAdminMode());
    if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage); };
  }, []);

  const toggleAdminMode = () => {
    const newAdminMode = !isAdmin;
    setIsAdmin(newAdminMode);
    setAdminMode(newAdminMode);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      <div className="container mx-auto p-8">
        <div className="flex gap-8">
          <Sidebar />
          

          <main className="flex-1">
            <header className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-4xl font-bold text-green-400">Retro hacking playground</h2>
                <p className="text-sm text-gray-400 mt-1">A game to hack LLM agents and improve AI security.</p>
              </div>
              {/* <div className="hidden md:block text-sm text-gray-400">Play responsibly — for education only</div> */}
            </header>

            <section>
              <div className="grid grid-cols-1 gap-8">
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-[0_6px_20px_rgba(16,185,129,0.06)]">
                  <h2 className="text-2xl font-bold text-green-400 mb-4">Mission</h2>
                  <p className="text-gray-300">
                    We build realistic agent systems and challenge you to break them. Your attacks help us understand and mitigate the risks of advanced AI. This is not just a game; it&apos;s a collaborative effort to make AI safer.
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-10">
              <h2 id="about" className="text-3xl font-bold text-center text-green-400 mb-6">Available Games</h2>
              <div className="grid grid-cols-1 gap-8">
                {/* For now there is a single game: "LLM Agent in a company". Render it as a game card with nested levels. */}
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">LLM Agent in a company</h3>
                      <p className="text-gray-400 mt-2">Simulate a company&apos;s assistant agent and try to find prompt-injection and social engineering vulnerabilities.</p>
                    </div>
                    <div className="text-sm text-gray-400">Game • Cybersecurity</div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-green-400 mb-3">Levels</h4>
                    <div className="space-y-3">
                      {/* Render levels only on the client to ensure availability is computed
                          from synchronous localStorage reads and avoid hydration flips. */}
                      {hydrated ? (() => {
                        // Determine unlocked status per-level deterministically
                        const isUnlocked = (lvl: Level) => lvl.unlockedBy === null || completedLevels.includes(lvl.unlockedBy as string);
                        let lastUnlockedIndex = -1;
                        for (let i = 0; i < levels.length; i++) {
                          if (isUnlocked(levels[i])) lastUnlockedIndex = i;
                        }

                        return levels.map((level, idx) => {
                          const locked = !isAdmin && !isUnlocked(level);
                          const showPlay = isAdmin || idx === lastUnlockedIndex;
                          return (
                            <div key={level.id} className={`flex items-center gap-4 ${locked ? 'opacity-60' : ''} bg-gray-900 p-3 rounded border border-gray-800`}>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm text-gray-300 flex items-center gap-2"><FiAlertCircle className="text-yellow-300" />{level.title} <span className="text-xs text-yellow-300 ml-2">{level.singleTurn ? 'Single-turn' : 'Multi-turn'}</span></div>
                                    <div className="text-xs text-gray-500">{level.description}</div>
                                  </div>
                                  <div className="w-48">
                                    <div className="w-full bg-gray-800 h-2 rounded overflow-hidden">
                                      <div className="bg-green-500 h-2 rounded" style={{ width: `${Math.min(100, levelScores[level.id] || 0)}%` }} />
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">Progress: {levelScores[level.id] ? `${levelScores[level.id]}%` : '0%'}</div>
                              </div>
                              <div>
                                {showPlay ? (
                                  <Link href={`/play/${level.id}`} onClick={() => playClick()} className="inline-block bg-gradient-to-r from-green-500 to-green-400 text-gray-900 font-bold py-2 px-4 rounded hover:brightness-110 transition-all">Play Now</Link>
                                ) : (
                                  <button className="inline-block bg-gray-700 text-gray-300 font-semibold py-2 px-3 rounded cursor-not-allowed">Locked</button>
                                )}
                              </div>
                            </div>
                          )
                        })
                      })() : (
                        // While hydrating, show a neutral loading placeholder to avoid showing
                        // incorrect play/locked states briefly.
                        <div className="text-center text-gray-400 py-8">Loading levels...</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <footer className="text-center mt-12 text-gray-500">
              <p>&copy; 2025 badcompany. All rights reserved.</p>
              <div className="flex justify-center space-x-4 mt-4">
                <a href="#" className="hover:text-green-400">Docs</a>
                <a href="#" className="hover:text-green-400">GitHub</a>
              </div>
              <div className="mt-4">
                <button onClick={toggleAdminMode} className="text-xs text-gray-600 hover:text-gray-400">
                  {isAdmin ? 'Disable Admin Mode' : 'Enable Admin Mode'}
                </button>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const filePath = path.join(process.cwd(), 'config', 'levels.json');
  const jsonData = fs.readFileSync(filePath, 'utf-8');
  const levels = JSON.parse(jsonData);

  return {
    props: {
      levels,
    },
  };
};

export default Home;
