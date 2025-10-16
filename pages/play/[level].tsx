import type { NextPage, GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { getSessionId } from '../../lib/session';
import { playClick } from '../../lib/sound';
import fs from 'fs';
import path from 'path';
import FileSystemExplorer from '../../components/FileSystemExplorer';
import { lineDiff, formatUnifiedDiff } from '../../lib/diff';
import { useSession } from 'next-auth/react';
import { getAdminMode } from '../../lib/admin';

interface Message {
  role: 'attacker' | 'assistant';
  content: string;
  internalLogs?: string[];
}

interface FileData {
    name: string;
    content: string;
}

interface Level {
    id: string;
    title: string;
    description: string;
    goal: string;
    files: FileData[];
  singleTurn?: boolean;
  allowsFiles?: boolean;
  unlockedBy?: string | null;
  gameId?: string;
  upload_files?: boolean;
  make_new_file?: boolean;
  attack_goal?: string;
  scenario?: string;
  attack_capabilities?: string;
}

interface GameConfig {
  agent_system_description: string;
  tools: string[];
}

interface LevelPageProps {
    level: Level;
    gameConfig: GameConfig;
}

const LevelPage: NextPage<LevelPageProps> = ({ level: initialLevel = { id: '', title: '', description: '', goal: '', files: [] }, gameConfig: initialGameConfig }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [level, setLevel] = useState(initialLevel);
  const [gameCfg] = useState<GameConfig>(initialGameConfig || { agent_system_description: 'The agent is a sandboxed assistant that can read provided files, summarize content, and call a small set of simulated tools when enabled by the level.', tools: [] });
  // Initialize admin mode synchronously from localStorage to avoid render-time
  // mismatches and flicker when getAdminMode() is called inline during render.
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return getAdminMode(); } catch { return false; }
  });
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [view, setView] = useState('chat'); // chat or files
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [committedState, setCommittedState] = useState<FileData[]>(initialLevel.files || []);
  const [internalLogs, setInternalLogs] = useState<string[]>([]);
  interface Stats {
    tokens?: number;
    latency?: number;
    [k: string]: unknown;
  }
  const [stats, setStats] = useState<Stats | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    if (view === 'chat') {
      scrollToBottom();
    }
  }, [messages, view]);

  // Auto-focus editor when selected file changes
  useEffect(() => {
    if (selectedFile && editorRef.current) {
      // small timeout to ensure textarea is rendered
      setTimeout(() => editorRef.current?.focus(), 50);
    }
  }, [selectedFile]);


  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  // Sync server-side progress for authenticated users
  useEffect(() => {
    const fetchProgress = async () => {
      if (!session) return;
      try {
        const res = await fetch('/api/progress');
        if (res.ok) {
          const data = await res.json();
          // merge completed levels and scores locally
          try {
            const rawScores = localStorage.getItem('levelScores');
            const scores = rawScores ? JSON.parse(rawScores) : {};
            const mergedScores = { ...scores, ...(data.levelScores || {}) };
            // prefer max values
            for (const k of Object.keys(mergedScores)) {
              mergedScores[k] = Math.max(scores[k] || 0, mergedScores[k] || 0);
            }
            localStorage.setItem('levelScores', JSON.stringify(mergedScores));

            const rawCompleted = localStorage.getItem('completedLevels');
            const comp = rawCompleted ? JSON.parse(rawCompleted) : [];
            const mergedCompleted = Array.from(new Set([...(comp || []), ...(data.completedLevels || [])]));
            localStorage.setItem('completedLevels', JSON.stringify(mergedCompleted));
          } catch {}
        }
      } catch { }
    }
    fetchProgress();
  }, [session]);

  // Keep isAdmin in sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'adminMode') {
        setIsAdmin(getAdminMode());
      }
    };
    if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage); };
  }, []);

  const handleFileSelect = (file: FileData) => {
    setSelectedFile(file);
    setEditingContent(file.content);
  }

  const handleUploadFile = (file: FileData) => {
    // Add file to current working files. Don't mark as committed — it's a new untracked file until commit.
    setLevel(prev => ({ ...prev, files: [...(prev.files || []), file] }));
  }

  const handleCreateNewFile = (name: string) => {
    const newFile: FileData = { name, content: '' };
    setLevel(prev => ({ ...prev, files: [...(prev.files || []), newFile] }));
    setSelectedFile(newFile);
    setEditingContent('');
    setHasUnsavedChanges(true);
  }

  const handleDeleteFile = (fileName: string) => {
    // Remove from working files. Keep committedState untouched until user commits so deletion is shown as a change.
    setLevel(prev => ({ ...prev, files: (prev.files || []).filter(f => f.name !== fileName) }));
    if (selectedFile?.name === fileName) {
      setSelectedFile(null);
      setEditingContent('');
    }
  }

  const handleSaveFile = () => {
    if (!selectedFile) return;

    const updatedFiles = level.files.map(f => 
      f.name === selectedFile.name ? { ...f, content: editingContent } : f
    );

    setLevel(prevLevel => ({
      ...prevLevel,
      files: updatedFiles,
    }));
    setHasUnsavedChanges(true);

    alert('File saved! Click "Commit" to make it available to the agent.');
  }

  const handleCommit = () => {
    // compute diffs between previous committedState and current level.files
    try {
      const prevMap: Record<string, string> = {};
      for (const f of committedState) prevMap[f.name] = f.content;
      const diffs: { name: string; diff: string; timestamp: string; author: string }[] = [];
      const currentMap: Record<string, string> = {};
      for (const f of level.files) currentMap[f.name] = f.content;
      for (const f of level.files) {
        const prev = prevMap[f.name] ?? '';
        if (prev !== f.content) {
          const ops = lineDiff(prev, f.content);
          const diffText = formatUnifiedDiff(ops, f.name);
          diffs.push({ name: f.name, diff: diffText, timestamp: new Date().toISOString(), author: sessionId });
        }
      }
      // detect deletions: files present in prevMap but missing now
      for (const name of Object.keys(prevMap)) {
        if (!(name in currentMap)) {
          const prev = prevMap[name] ?? '';
          const ops = lineDiff(prev, '');
          const diffText = formatUnifiedDiff(ops, name);
          diffs.push({ name, diff: diffText, timestamp: new Date().toISOString(), author: sessionId });
        }
      }
      // store diffs in localStorage under a per-level key
      if (diffs.length) {
        const raw = localStorage.getItem(`level-diffs:${level.id}`);
        const arr = raw ? JSON.parse(raw) : [];
        arr.push(...diffs);
        localStorage.setItem(`level-diffs:${level.id}`, JSON.stringify(arr));
      }
    } catch { }
    setCommittedState(level.files);
    setHasUnsavedChanges(false);
    alert('Changes committed! (diffs saved locally)');
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'attacker', content: input };
    // For single-turn levels: restart the conversation by removing previous attacker/assistant messages
    if (level.singleTurn) {
      const preserved = messages.filter(m => m.role !== 'attacker' && m.role !== 'assistant');
      setMessages([...preserved, userMessage]);
    } else {
      setMessages((prev) => [...prev, userMessage]);
    }

    // For multi-turn clear input; for single-turn keep it (user may want to edit their single move)
    if (!level.singleTurn) setInput('');

    const res = await fetch('/api/agent/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        levelId: level.id,
        message: userMessage,
        files: committedState,
  isAdmin: isAdmin,
        singleTurn: !!level.singleTurn,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const agentMessage: Message = { role: 'assistant', content: data.reply, internalLogs: data.internalLogs };
      if (level.singleTurn) {
        // replace attacker/assistant messages with preserved + user + agent
        const preserved = messages.filter(m => m.role !== 'attacker' && m.role !== 'assistant');
        setMessages([...preserved, userMessage, agentMessage]);
      } else {
        setMessages((prev) => [...prev, agentMessage]);
      }
      // backend may include inference stats (tokens, latency, etc.) in response
      if (data.stats) setStats(data.stats);
      if (data.internalLogs) {
        setInternalLogs(prev => [...prev, ...data.internalLogs]);
      }
    }
  };

  const handleSubmitToLeaderboard = async (score: number) => {
  let name = undefined as string | undefined;
  if (!session) {
    // prompt for display name when anonymous
    // eslint-disable-next-line no-alert
    name = window.prompt('Enter display name for leaderboard (or leave blank to stay anonymous):') || undefined;
  }

  const body: { levelId: string; score: number; name?: string } = { levelId: level.id, score };
  if (name) body.name = name;

  const res = await fetch('/api/leaderboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

    if (res.ok) {
        alert('Score submitted to leaderboard!');
    } else {
        alert('Failed to submit score. Are you signed in?');
    }
  }

  const handleJudge = async () => {
    const res = await fetch('/api/judge/evaluate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sessionId,
            levelId: level.id,
            recordedTranscript: messages,
            artifacts: { files: committedState },
        }),
    });

    if (res.ok) {
        const result = await res.json();
        const submitMessage = `Judging complete!\nScore: ${result.score}\nVerdict: ${result.verdict}`;
    // store per-level score locally
    try {
      const rawScores = localStorage.getItem('levelScores');
      const scores = rawScores ? JSON.parse(rawScores) : {};
      scores[level.id] = Math.max(scores[level.id] || 0, result.score);
      localStorage.setItem('levelScores', JSON.stringify(scores));
    } catch {}

    if (session) {
      // auto-submit to global leaderboard if signed in
      handleSubmitToLeaderboard(result.score);
    } else {
      alert(`${submitMessage}\n\nSign in to submit your score to the leaderboard.`);
    }
        // If judged successful, mark level complete so next level unlocks (client-side)
        if (result.verdict === 'success') {
          try {
            const raw = localStorage.getItem('completedLevels');
            const arr = raw ? JSON.parse(raw) : [];
            if (!arr.includes(level.id)) {
              arr.push(level.id);
              localStorage.setItem('completedLevels', JSON.stringify(arr));
            }
          } catch {}
              // Also post progress to server so it's persisted
              try {
                const rawScores = localStorage.getItem('levelScores');
                const scores = rawScores ? JSON.parse(rawScores) : {};
                const rawCompleted = localStorage.getItem('completedLevels');
                const completed = rawCompleted ? JSON.parse(rawCompleted) : [];
                if (session) {
                  await fetch('/api/progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ completedLevels: completed, levelScores: scores }),
                  });
                }
      } catch { }
        }
    }
  }

  if (router.isFallback) {
    return <div>Loading...</div>
  }

  return (
  <div className="flex h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-900 text-white font-mono">
    {/* Left Panel */}
  <div className="w-1/4 bg-gray-800 p-4 border-r border-gray-700 flex flex-col">
        <div className="mb-2">
          <Link href="/" className="inline-block text-sm bg-gray-700 hover:bg-gray-600 text-green-300 px-3 py-2 rounded" onClick={() => playClick()}>← Go back</Link>
        </div>
        <h2 className="text-xl font-bold mb-2 text-green-400">{level.title}</h2>
        <div className="text-xs text-yellow-300 mb-3">{level.singleTurn ? 'Single-turn' : 'Multi-turn'}</div>

        <div className="mb-3">
          <h3 className="font-bold text-green-300">Attack goal</h3>
          <p className="text-sm text-gray-300">{level.attack_goal || level.goal}</p>
        </div>

        <div className="mb-3">
          <h3 className="font-bold text-green-300">Scenario</h3>
          <p className="text-sm text-gray-300">{level.scenario || level.description}</p>
        </div>

        <div className="mb-3">
          <h3 className="font-bold text-green-300">Agent & system (summary)</h3>
          <p className="text-sm text-gray-300">{gameCfg.agent_system_description || 'No agent description available.'}</p>
          <details className="mt-2 text-xs text-gray-400">
            <summary className="cursor-pointer">More info</summary>
            <div className="mt-2">
              <p className="text-xs">Tools: {(gameCfg.tools || []).length ? (gameCfg.tools || []).join(', ') : 'None'}</p>
              <p className="text-xs">Permissions: Agent follows access controls; file reads are limited to provided files.</p>
            </div>
          </details>
        </div>

        <div className="mb-3">
          <h3 className="font-bold text-green-300">Attack capabilities</h3>
          <p className="text-sm text-gray-300">{level.attack_capabilities || ''}</p>
        </div>

        <div className='flex-grow' />
      </div>

      {/* Center Panel */}
      <div className="flex-1 flex flex-col p-4">
    <div className="mb-4">
      <button onClick={() => setView('chat')} className={`mr-2 py-2 px-4 rounded ${view === 'chat' ? 'bg-gradient-to-r from-green-500 to-green-400 text-gray-900 shadow-sm' : 'bg-gray-700 hover:bg-gray-600'}`}>💬 Chat</button>
      {level.allowsFiles && (
        <button onClick={() => setView('files')} className={`py-2 px-4 rounded ${view === 'files' ? 'bg-gradient-to-r from-green-500 to-green-400 text-gray-900 shadow-sm' : 'bg-gray-700 hover:bg-gray-600'}`}>📁 File Explorer</button>
      )}
    </div>
    {view === 'chat' ? (
            <>
                <div className="flex-1 mb-4 overflow-y-auto pr-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'attacker' ? 'justify-end' : 'justify-start'} mb-4`}>
              <div className={`p-3 rounded-lg max-w-prose ${msg.role === 'attacker' ? 'bg-gradient-to-r from-green-900 to-green-800 text-gray-100' : 'bg-gray-700'}`}>
                <p className='whitespace-pre-wrap'>{msg.content}</p>
              </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
                </div>
                <div className="flex">
        <input
          type="text"
          className="flex-1 bg-gray-800 rounded-l-md p-2 focus:outline-none text-white focus:ring-2 focus:ring-green-400 border border-gray-700"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
                <button
          className="bg-gradient-to-r from-green-500 to-green-400 hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded-r-md shadow-sm"
                  onClick={() => { playClick(); handleSendMessage(); }}
        >
          ➤ Send
        </button>
                </div>
            </>
        ) : level.allowsFiles ? (
            <div className="flex-1 flex">
          <div className="w-1/3">
          <FileSystemExplorer
            files={level.files}
            committedFiles={committedState}
            onFileSelect={handleFileSelect}
            allowsFiles={!!level.allowsFiles}
            onUpload={handleUploadFile}
            onDelete={handleDeleteFile}
            showUpload={!!level.upload_files}
            showMakeNewFile={!!level.make_new_file}
            onCreateNewFile={handleCreateNewFile}
          />
        </div>
                <div className="w-2/3 bg-gray-800 rounded-lg p-4 ml-4 flex flex-col">
                    {selectedFile ? (
                        <>
                            <h3 className="text-lg font-bold text-green-400 mb-4">{selectedFile.name}</h3>
              <textarea 
                ref={editorRef}
                className="flex-grow bg-gray-900 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={editingContent}
                onChange={(e) => {
                  setEditingContent(e.target.value);
                  setHasUnsavedChanges(true);
                }}
              />
                            <div className="mt-4">
                                <button onClick={() => { playClick(); handleSaveFile(); }} className="bg-green-500 hover:bg-green-600 text-gray-900 font-bold py-2 px-4 rounded mr-2">Save</button>
                                <button onClick={() => { playClick(); handleCommit(); }} disabled={!hasUnsavedChanges} className={`font-bold py-2 px-4 rounded ${hasUnsavedChanges ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}>Commit</button>
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-400">Select a file to view or edit its content.</p>
                    )}
                </div>
            </div>
        ) : null}
      </div>

      {/* Right Panel */}
      <div className="w-1/4 bg-gray-800 p-4 border-l border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-green-400">Stats</h2>
        <div className="text-sm">
          <p>Session ID: <span className="text-gray-400 break-all">{sessionId}</span></p>
          <p>Attacker messages: <span className="text-gray-400">{messages.filter(m => m.role === 'attacker').length}</span></p>
          {stats && (
            <div className="mt-3 text-xs text-gray-300">
              <div>Tokens used: {stats.tokens ?? '—'}</div>
              <div>Latency: {stats.latency ?? '—'} ms</div>
            </div>
          )}
        </div>
                {/* Start Attack button for multi-action levels */}
                {(level.singleTurn || level.allowsFiles) && (
                  <div className="mt-3">
                    <button onClick={async () => {
                      const userMessage: Message = { role: 'attacker', content: input };
                      // prepare action payload
                      const actionPayload = { sessionId, levelId: level.id, message: userMessage, files: committedState, isAdmin: isAdmin, action: 'startAttack', singleTurn: !!level.singleTurn };

                      // update messages for single-turn: restart conversation
                      if (level.singleTurn) {
                        const preserved = messages.filter(m => m.role !== 'attacker' && m.role !== 'assistant');
                        setMessages([...preserved, userMessage]);
                      } else {
                        setMessages(prev => [...prev, userMessage]);
                      }

                      const res = await fetch('/api/agent/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(actionPayload) });
                      if (res.ok) {
                        const data = await res.json();
                        const agentMessage: Message = { role: 'assistant', content: data.reply, internalLogs: data.internalLogs };
                        if (level.singleTurn) {
                          const preserved = messages.filter(m => m.role !== 'attacker' && m.role !== 'assistant');
                          setMessages([...preserved, userMessage, agentMessage]);
                        } else {
                          setMessages(prev => [...prev, agentMessage]);
                        }
                        if (data.stats) setStats(data.stats);
                        if (data.score) {
                          try {
                            const rawScores = localStorage.getItem('levelScores');
                            const scores = rawScores ? JSON.parse(rawScores) : {};
                            scores[level.id] = Math.max(scores[level.id] || 0, data.score);
                            localStorage.setItem('levelScores', JSON.stringify(scores));
                          } catch {}
                        }
                      }
                    }} className="mt-2 bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded">{level.singleTurn ? 'Submit move' : 'Start Attack'}</button>
                  </div>
                )}
        <div className="mt-8">
            <button onClick={handleJudge} className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded">Submit for Judging</button>
        </div>
        {isAdmin && (
            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4 text-green-400">Internal Logs</h2>
                <div className="text-xs bg-gray-900 p-2 rounded-md h-64 overflow-y-auto">
                    {internalLogs.map((log, i) => <p key={i}>{log}</p>)}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
    const filePath = path.join(process.cwd(), 'config', 'levels.json');
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    const levelsData: Level[] = JSON.parse(jsonData);

    const paths = levelsData.map((level) => ({
        params: { level: level.id },
    }));

    return { paths, fallback: true };
}

export const getStaticProps: GetStaticProps = async (context) => {
    const { params } = context;
    const levelId = params?.level as string;

    const levelsFilePath = path.join(process.cwd(), 'config', 'levels.json');
    const levelsJsonData = fs.readFileSync(levelsFilePath, 'utf-8');
    const levels: Level[] = JSON.parse(levelsJsonData);

    const fsFilePath = path.join(process.cwd(), 'config', 'filesystem.json');
    const fsJsonData = fs.readFileSync(fsFilePath, 'utf-8');
    const filesystems = JSON.parse(fsJsonData);

  const level = levels.find((l) => l.id === levelId);
  if (!level) {
    return { notFound: true };
  }

  level.files = filesystems[level.id]?.files || [];

  // load shared game config
  const gameConfigPath = path.join(process.cwd(), 'config', 'game.json');
  let gameCfg = null;
  try {
    const raw = fs.readFileSync(gameConfigPath, 'utf-8');
    gameCfg = JSON.parse(raw);
  } catch { }

  return {
    props: {
      level,
      gameConfig: gameCfg,
    },
  };
}

export default LevelPage;