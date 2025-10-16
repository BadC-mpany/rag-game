
import React, { useMemo, useState } from 'react';
import { FiFileText } from 'react-icons/fi';
import { lineDiff, DiffOp } from '../lib/diff';

interface File {
    name: string;
    content: string;
}

interface FileSystemExplorerProps {
    files: File[];
    committedFiles?: File[]; // previous committed state to compute status/diffs
    onFileSelect: (file: File) => void;
    allowsFiles?: boolean;
    onUpload?: (file: File) => void;
    onDelete?: (fileName: string) => void;
    showUpload?: boolean;
    showMakeNewFile?: boolean;
    onCreateNewFile?: (name: string) => void;
}

const FileSystemExplorer: React.FC<FileSystemExplorerProps> = ({ files, committedFiles = [], onFileSelect, allowsFiles = true, onUpload, onDelete, showUpload = true, showMakeNewFile = false, onCreateNewFile }) => {
    const [diffOpen, setDiffOpen] = useState(false);
    const [diffOps, setDiffOps] = useState<DiffOp[]>([]);
    const [diffTitle, setDiffTitle] = useState('');

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
                    <li key={file.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 w-full">
                            <button onClick={() => onFileSelect(file)} className="w-full text-left px-3 py-2 rounded hover:bg-gray-700 hover:text-green-300 transition-all flex items-center gap-3">
                                <FiFileText className="text-gray-400 neon" />
                                <span className="truncate">{file.name}</span>
                            </button>
                            {status && (
                                <div className={`ml-2 px-2 py-1 rounded text-xs ${status === 'U' ? 'bg-green-700 text-green-100' : 'bg-yellow-700 text-yellow-100'}`} title={status === 'U' ? 'Untracked' : 'Modified'}>{status}</div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => openDiff(file)} className="text-xs text-gray-300 hover:text-white">Diff</button>
                            {onDelete && (
                                <button onClick={() => onDelete(file.name)} className="ml-2 text-xs text-red-400 hover:text-red-300">Delete</button>
                            )}
                        </div>
                    </li>
                    )
                })}
            </ul>
            <div className="mt-3 flex flex-col gap-2">
                {allowsFiles && onUpload && showUpload && (
                    <label className="inline-block bg-gray-700 hover:bg-gray-600 py-2 px-3 rounded cursor-pointer text-sm">
                        Upload file
                        <input type="file" className="hidden" onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                                const text = reader.result as string;
                                onUpload({ name: f.name, content: text });
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
