import React from 'react';

interface DiffViewerProps {
  diffText: string;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ diffText }) => {
  // Render unified diff with simple coloring: lines starting with + green, - red, @@ muted
  const lines = diffText.split('\n');

  return (
    <div className="bg-gray-900 text-sm rounded-md p-3 overflow-auto max-h-96 font-mono">
      {lines.map((line, idx) => {
        const cls = line.startsWith('+') ? 'bg-green-900 text-green-300' : line.startsWith('-') ? 'bg-red-900 text-red-300' : line.startsWith('@@') ? 'text-yellow-300' : 'text-gray-300';
        return (
          <pre key={idx} className={`px-2 py-0.5 my-px rounded-l-md border-l-4 ${line.startsWith('+') ? 'border-green-600' : line.startsWith('-') ? 'border-red-600' : 'border-gray-700'} ${cls}`}>
            {line}
          </pre>
        );
      })}
    </div>
  );
}

export default DiffViewer;
