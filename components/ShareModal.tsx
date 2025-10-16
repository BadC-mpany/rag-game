import React from 'react';

const ShareModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  if (!open) return null;
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent('Play badcompany - a retro LLM hacking game')}&url=${encodeURIComponent(url)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative bg-gray-900 border border-gray-700 rounded p-6 w-96">
        <h3 className="text-lg font-bold text-green-400 mb-3">Share badcompany</h3>
        <div className="flex flex-col gap-2">
          <button onClick={() => { navigator.clipboard?.writeText(url); alert('Link copied'); }} className="py-2 px-3 bg-gray-800 rounded hover:bg-gray-700">Copy link</button>
          <a href={twitter} target="_blank" rel="noreferrer" className="py-2 px-3 bg-blue-600 rounded hover:bg-blue-500 text-white inline-block text-center">Share on Twitter</a>
          <div className="text-xs text-gray-400 mt-3">Embed</div>
          <textarea readOnly className="bg-gray-800 p-2 rounded text-xs" value={`<a href="${url}">Play badcompany</a>`} />
        </div>
        <div className="mt-4 text-right">
          <button onClick={onClose} className="text-sm text-gray-300 hover:text-white">Close</button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
