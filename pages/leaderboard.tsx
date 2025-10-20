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
  const [showAllLevels, setShowAllLevels] = useState(false);

  const fetchLeaderboard = async (showAll: boolean = false) => {
    setLoading(true);
    try {
      const url = showAll ? '/api/leaderboard' : '/api/leaderboard?levelId=1';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      } else {
        setError('Failed to fetch leaderboard.');
      }
    } catch {
      setError('An error occurred.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard(showAllLevels);
  }, [showAllLevels]);

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

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-400">
                {showAllLevels ? 'All Levels' : 'Level 1: Competitor Leak'}
              </h2>
              <button
                onClick={() => setShowAllLevels(!showAllLevels)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-all"
              >
                {showAllLevels ? 'Show Level 1 Only' : 'Show All Levels'}
              </button>
            </div>

            {loading ? (
              <div className="bg-gray-800 rounded-lg p-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-green-400">
                      <th className="p-2">Rank</th>
                      <th className="p-2">Player</th>
                      <th className="p-2">Score</th>
                      {showAllLevels && <th className="p-2">Level</th>}
                      <th className="p-2">Timestamp</th>
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
                        {showAllLevels && (
                          <td className="p-2">
                            <div className="h-4 bg-gray-700 rounded animate-pulse w-20"></div>
                          </td>
                        )}
                        <td className="p-2">
                          <div className="h-4 bg-gray-700 rounded animate-pulse w-32"></div>
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
                      {showAllLevels && <th className="p-2">Level</th>}
                      <th className="p-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => (
                      <tr key={index} className="border-t border-gray-700 hover:bg-gray-700 transition-all duration-200">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">{entry.name}</td>
                        <td className="p-2">{entry.score}</td>
                        {showAllLevels && <td className="p-2">{entry.level_id.startsWith('level-') ? entry.level_id.replace('level-', '') : entry.level_id}</td>}
                        <td className="p-2">{new Date(entry.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
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
