import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import Auth from '../components/Auth';
import Sidebar from '../components/Sidebar';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  timestamp: string;
}

const LeaderboardPage: NextPage = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard?levelId=level-001');
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data);
        } else {
          setError('Failed to fetch leaderboard.');
        }
      } catch {
        setError('An error occurred.');
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      <div className="container mx-auto p-8">
        <div className="flex gap-8">
          <Sidebar />
          <main className="flex-1">
            <header className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-green-400">Leaderboard</h1>
                <p className="text-sm text-gray-400">See top contributors and sign in to submit your scores.</p>
              </div>
              <div>
                <Auth />
              </div>
            </header>

            <h2 className="text-xl font-bold text-gray-400 mb-6">Level 1: Basic Injection</h2>

            {loading ? (
              <p className="text-center">Loading...</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : (
              <div className="bg-gray-800 rounded-lg p-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-green-400">
                      <th className="p-2">Rank</th>
                      <th className="p-2">Player</th>
                      <th className="p-2">Score</th>
                      <th className="p-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => (
                      <tr key={index} className="border-t border-gray-700 hover:bg-gray-700 transition-all">
                        <td className="p-2">{entry.rank}</td>
                        <td className="p-2">{entry.name}</td>
                        <td className="p-2">{entry.score}</td>
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
