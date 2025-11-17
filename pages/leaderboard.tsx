import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import Auth from '../components/Auth';
import Sidebar from '../components/Sidebar';

interface LeaderboardEntry {
  name: string;
  score: number;
  level_id: string;
  timestamp: string;
  email?: string;
}

const LeaderboardPage: NextPage = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        // Sort by score descending, then by timestamp (most recent first) if scores are equal
        const sorted = (data.leaderboard || []).sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
          if (a.score !== b.score) {
            return b.score - a.score; // Higher score first
          }
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeB - timeA; // Most recent first if same score
        });
        setLeaderboard(sorted);
      } else {
        setError('Failed to fetch leaderboard.');
      }
    } catch {
      setError('An error occurred.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      <div className="container mx-auto p-8">
        <div className="flex gap-8">
          <Sidebar />
          <main className="flex-1 animate-fade-in">
            <header className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-green-400">Leaderboard</h1>
                <p className="text-sm text-gray-400">See top contributors and sign in to submit your scores.</p>
              </div>
              <div>
                <Auth />
              </div>
            </header>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-400">Global Ranking</h2>
            </div>

            {loading ? (
              <div className="bg-gray-800 rounded-lg p-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-green-400">
                      <th className="p-2">Rank</th>
                      <th className="p-2">Player</th>
                      <th className="p-2">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(5)].map((_, index) => (
                      <tr key={index} className="border-t border-gray-700">
                        <td className="p-2">
                          <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                        </td>
                        <td className="p-2">
                          <div className="h-4 bg-gray-700 rounded animate-pulse w-24"></div>
                        </td>
                        <td className="p-2">
                          <div className="h-4 bg-gray-700 rounded animate-pulse w-16"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : (
              <div className="bg-gray-800 rounded-lg p-4 transition-all duration-300 ease-in-out">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-green-400">
                      <th className="p-2">Rank</th>
                      <th className="p-2">Player</th>
                      <th className="p-2">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => {
                      const rank = index + 1;
                      const getTrophyIcon = () => {
                        if (rank === 1) {
                          return (
                            <svg className="w-5 h-5 inline-block mr-2" fill="#FFD700" viewBox="0 0 24 24">
                              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
                            </svg>
                          );
                        }
                        if (rank === 2) {
                          return (
                            <svg className="w-5 h-5 inline-block mr-2" fill="#C0C0C0" viewBox="0 0 24 24">
                              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
                            </svg>
                          );
                        }
                        if (rank === 3) {
                          return (
                            <svg className="w-5 h-5 inline-block mr-2" fill="#CD7F32" viewBox="0 0 24 24">
                              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
                            </svg>
                          );
                        }
                        return null;
                      };
                      const trophyIcon = getTrophyIcon();
                      return (
                        <tr key={index} className="border-t border-gray-700 hover:bg-gray-700 transition-all duration-200">
                          <td className="p-2">
                            {trophyIcon ? (
                              trophyIcon
                            ) : (
                              rank
                            )}
                          </td>
                          <td className="p-2">{entry.name}</td>
                          <td className="p-2">{entry.score}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
