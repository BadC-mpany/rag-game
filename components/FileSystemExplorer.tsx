
import React, { useMemo, useState, useRef } from 'react';
import { FiFileText, FiMic, FiSquare, FiLock } from 'react-icons/fi';
import { lineDiff, DiffOp } from '../lib/diff';
import { startRecording } from '../lib/transcriber';

interface File {
    name: string;
    content: string;
    editable?: boolean;
}

interface FileSystemExplorerProps {
    files: File[];
    committedFiles?: File[];
    onFileSelect: (file: File) => void;
    allowsFiles?: boolean;
    onUpload?: (file: File) => void;
    onDelete?: (fileName: string) => void;
    showUpload?: boolean;
    showMakeNewFile?: boolean;
    onCreateNewFile?: (name: string) => void;
    levelId?: string;
    onCommit?: () => void;
    onUploadAndCommit?: (file: File) => void;
}

const FileSystemExplorer: React.FC<FileSystemExplorerProps> = ({ files, committedFiles = [], onFileSelect, allowsFiles = true, onUpload, onDelete, showUpload = true, showMakeNewFile = false, onCreateNewFile, levelId, onUploadAndCommit }) => {
    const [diffOpen, setDiffOpen] = useState(false);
    const [diffOps, setDiffOps] = useState<DiffOp[]>([]);
    const [diffTitle, setDiffTitle] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTranscript, setRecordingTranscript] = useState('');
    const [recordingControl, setRecordingControl] = useState<{ stop: () => void } | null>(null);
    const fullTranscriptRef = useRef<string>('');

    const committedMap = useMemo(() => {
        const m: Record<string, string> = {};
        for (const f of committedFiles) m[f.name] = f.content;
        return m;
    }, [committedFiles]);

    // If the level disallows files, render nothing. This guard must be after
    // hook calls so hooks run in the same order on every render.
    if (!allowsFiles) return null;

    // Inline new file input component
    const NewFileInput: React.FC<{ committedFiles: File[]; onCreate?: (name: string) => void }> = ({ committedFiles, onCreate }) => {
        const [name, setName] = useState('');
        const [error, setError] = useState<string | null>(null);

        const existing = new Set(committedFiles.map(f => f.name).concat(files.map(f => f.name)));

        const create = () => {
            const trimmed = (name || '').trim();
            if (!trimmed) { setError('Name required'); return; }
            if (existing.has(trimmed)) { setError('File already exists'); return; }
            setError(null);
            if (onCreate) onCreate(trimmed);
            setName('');
        }

        return (
            <div className="flex items-center gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="new-file.txt" className="bg-gray-700 text-white px-2 py-1 rounded text-sm" />
                <button onClick={create} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm">Create</button>
                {error && <div className="text-xs text-red-400">{error}</div>}
            </div>
        );
    };

    const computeStatus = (file: File) => {
        // If the file exists in the baseline committedFiles, consider that the "original" file.
        // If it doesn't exist in committedMap then it's a new file added by the user -> Untracked (U).
        // If it exists but content differs -> Modified (M).
        if (!(file.name in committedMap)) {
            // new file added by user
            // consider empty files as not worth marking (but still treat as U if they have content)
            if ((file.content || '').trim().length === 0) return '';
            return 'U'; // untracked
        }
        if (committedMap[file.name] !== file.content) return 'M';
        return '';
    }

    const openDiff = (file: File) => {
        const prev = committedMap[file.name] ?? '';
        const ops = lineDiff(prev, file.content);
        setDiffOps(ops);
        setDiffTitle(file.name);
        setDiffOpen(true);
    }

    const handleStartRecording = () => {
        // Check if audio_transcription.txt already exists
        const existingFile = files.find(f => f.name === 'audio_transcription.txt');
        if (existingFile) {
            const confirmed = window.confirm(
                'A file named "audio_transcription.txt" already exists. Recording will overwrite it. Continue?'
            );
            if (!confirmed) {
                return;
            }
        }

        fullTranscriptRef.current = '';
        setRecordingTranscript('');
        setIsRecording(true);

        const control = startRecording(
            (text, isFinal) => {
                if (isFinal) {
                    fullTranscriptRef.current = (fullTranscriptRef.current + ' ' + text).trim();
                    setRecordingTranscript(fullTranscriptRef.current);
                }
            },
            (error) => {
                alert(error);
                setIsRecording(false);
                setRecordingControl(null);
            }
        );

        setRecordingControl(control);
    };

    const handleStopRecording = () => {
        if (recordingControl) {
            recordingControl.stop();
            
            // Small delay to allow final results to come through
            setTimeout(() => {
                const finalTranscript = fullTranscriptRef.current;
                
                // Create transcription file
                if (finalTranscript.trim()) {
                    const transcriptionFile = {
                        name: 'audio_transcription.txt',
                        content: finalTranscript.trim(),
                        editable: true,
                    };
                    
                    // If file exists, we need to delete it first (or update it)
                    const existingFile = files.find(f => f.name === 'audio_transcription.txt');
                    if (existingFile && onDelete) {
                        onDelete('audio_transcription.txt');
                    }
                    
                    // Use the combined upload-and-commit handler to ensure proper state management
                    if (onUploadAndCommit) {
                        onUploadAndCommit(transcriptionFile);
                        fullTranscriptRef.current = '';
                        setRecordingTranscript('');
                        // Alert is shown by handleCommit in parent
                        setTimeout(() => {
                            alert('Transcription saved and committed as audio_transcription.txt');
                        }, 100);
                    } else if (onUpload) {
                        // Fallback to old behavior if onUploadAndCommit not provided
                        onUpload(transcriptionFile);
                        fullTranscriptRef.current = '';
                        setRecordingTranscript('');
                        alert('Transcription saved as audio_transcription.txt');
                    }
                } else {
                    alert(`No speech detected. Please try again.`);
                }
                
                setRecordingControl(null);
            }, 500); // Wait 500ms for final results
        }
        
        setIsRecording(false);
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg h-full border border-gray-700">
            <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2"> 
                <FiFileText className="text-green-300 neon-green" />
                File Explorer
            </h3>
            <ul className="space-y-2">
                {files.map((file) => {
                    const status = computeStatus(file);
                    return (
                    <li key={file.name} className="flex items-start justify-between">
                        <div className="flex items-start gap-2 w-full">
                            <button onClick={() => onFileSelect(file)} className="w-full text-left px-3 py-2 rounded hover:bg-gray-700 hover:text-green-300 transition-all flex items-start gap-3">
                                {file.editable === false ? <FiLock className="text-gray-500 mt-1" /> : <FiFileText className="text-gray-400 neon mt-1" />}
                                <span className={`break-all ${file.editable === false ? 'text-gray-500' : ''}`}>{file.name}</span>
                            </button>
                            {status && (
                                <div className={`ml-2 px-2 py-1 rounded text-xs ${status === 'U' ? 'bg-green-700 text-green-100' : 'bg-yellow-700 text-yellow-100'}`} title={status === 'U' ? 'Untracked' : 'Modified'}>{status}</div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => openDiff(file)} className="text-xs text-gray-300 hover:text-white">Diff</button>
                            {onDelete && file.editable !== false && (
                                <button onClick={() => onDelete(file.name)} className="ml-2 text-xs text-red-400 hover:text-red-300">Delete</button>
                            )}
                        </div>
                    </li>
                    )
                })}
            </ul>
            <div className="mt-3 flex flex-col gap-2">
                {/* Audio Recording Button for level-007 */}
                {levelId === 'level-007' && onUpload && (
                    <div className="bg-gray-900 p-3 rounded border border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                            {!isRecording ? (
                                <button 
                                    onClick={handleStartRecording}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded text-sm font-semibold"
                                >
                                    <FiMic /> Start Recording
                                </button>
                            ) : (
                                <button 
                                    onClick={handleStopRecording}
                                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded text-sm font-semibold animate-pulse"
                                >
                                    <FiSquare /> Stop Recording
                                </button>
                            )}
                        </div>
                        {isRecording && (
                            <div className="text-xs text-gray-400 mt-2">
                                <div className="mb-1">🎤 Recording... Speak now</div>
                                {recordingTranscript && (
                                    <div className="bg-gray-800 p-2 rounded text-green-300 max-h-20 overflow-y-auto">
                                        {recordingTranscript}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {allowsFiles && onUpload && showUpload && (
                    <label className="inline-block bg-gray-700 hover:bg-gray-600 py-2 px-3 rounded cursor-pointer text-sm">
                        Upload file
                        <input type="file" className="hidden" onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f || !onUpload) return;

                            const reader = new FileReader();
                            reader.onload = () => {
                                const text = reader.result as string;
                                onUpload({ name: f.name, content: text, editable: true });
                            };
                            reader.readAsText(f);
                        }} />
                    </label>
                )}

                {showMakeNewFile && (
                    <NewFileInput committedFiles={committedFiles} onCreate={onCreateNewFile} />
                )}
            </div>

            {/* Diff modal */}
            {diffOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black opacity-50" onClick={() => setDiffOpen(false)} />
                    <div className="relative w-3/4 max-h-3/4 bg-gray-900 p-4 rounded-lg border border-gray-700 overflow-auto">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-bold">Diff — {diffTitle}</h4>
                            <button onClick={() => setDiffOpen(false)} className="text-sm bg-gray-700 px-2 py-1 rounded">Close</button>
                        </div>
                        <pre className="text-sm font-mono whitespace-pre-wrap">
                            {diffOps.map((o, i) => {
                                if (o.op === 'equal') return (<div key={i} className="px-2"> {o.line}</div>);
                                if (o.op === 'add') return (<div key={i} className="px-2 bg-green-900 border-l-2 border-dotted border-green-500 text-green-200">+{o.line}</div>);
                                return (<div key={i} className="px-2 bg-red-900 border-l-2 border-dotted border-red-500 text-red-200">-{o.line}</div>);
                            })}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileSystemExplorer;
