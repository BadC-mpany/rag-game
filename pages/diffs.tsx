import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DiffViewer from '../components/DiffViewer';
import levelsData from '../config/levels.json';

interface LevelMeta {
  id: string;
  title: string;
}

const DiffsPage: React.FC = () => {
  const [levels, setLevels] = useState<LevelMeta[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [diffs, setDiffs] = useState<Array<{ name: string; diff: string; timestamp: string; author: string }>>([]);

  useEffect(() => {
    try {
      const arr = levelsData as LevelMeta[];
      setLevels(arr.map(a => ({ id: a.id, title: a.title })));
    } catch {
      // ignore
    }
  }, []);

  const loadDiffsForLevel = (levelId: string) => {
    try {
      const raw = localStorage.getItem(`level-diffs:${levelId}`);
      const arr = raw ? JSON.parse(raw) : [];
      setDiffs(arr.reverse());
      setSelectedLevel(levelId);
    } catch {
      setDiffs([]);
      setSelectedLevel(levelId);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-mono">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Saved Diffs</h1>
          <Link href="/" className="text-sm bg-gray-700 px-3 py-2 rounded text-green-300">← Home</Link>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 bg-gray-800 p-4 rounded">
            <h3 className="font-bold mb-2">Levels</h3>
            <div className="text-sm">
              {levels.length ? levels.map(l => (
                <div key={l.id} className="flex items-center justify-between py-1">
                  <button className="text-left text-gray-300 hover:text-white" onClick={() => loadDiffsForLevel(l.id)}>{l.title}</button>
                  <span className="text-xs text-gray-500">{l.id}</span>
                </div>
              )) : <p className="text-gray-500">No levels loaded.</p>}
            </div>
          </div>

          <div className="col-span-2 bg-gray-800 p-4 rounded">
            <h3 className="font-bold mb-2">Diffs {selectedLevel ? `for ${selectedLevel}` : ''}</h3>
            {!selectedLevel && <p className="text-gray-400">Select a level to view saved diffs (stored in localStorage).</p>}
            {selectedLevel && (
              <div>
                {diffs.length === 0 && <p className="text-gray-400">No diffs found for this level.</p>}
                {diffs.map((d, i) => (
                  <div key={i} className="mb-4 p-3 bg-gray-900 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-400">{new Date(d.timestamp).toLocaleString()} by <span className="text-gray-200">{d.author}</span></div>
                      <div className="text-xs text-yellow-300">{d.name}</div>
                    </div>
                    <DiffViewer diffText={d.diff} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiffsPage;
