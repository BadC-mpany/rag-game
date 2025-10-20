import React from 'react';

const ShareModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  if (!open) return null;
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = encodeURIComponent('Play Badcompany - a retro LLM hacking game');
  const xShare = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(url)}`;
  const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative bg-gray-900 border border-gray-700 rounded p-6 w-96">
        <h3 className="text-lg font-bold text-green-400 mb-3">Share Badcompany</h3>
        <div className="flex flex-col gap-2">
          <a href={xShare} target="_blank" rel="noreferrer" className="py-2 px-3 bg-black rounded hover:bg-gray-800 text-white inline-block text-center btn-press flex items-center justify-center gap-2">
            <span className="font-bold">𝕏</span>
          </a>
          <a href={linkedinShare} target="_blank" rel="noreferrer" className="py-2 px-3 bg-blue-700 rounded hover:bg-blue-600 text-white inline-block text-center btn-press">LinkedIn</a>
          <button onClick={() => { navigator.clipboard?.writeText(url); alert('Link copied'); }} className="py-2 px-3 bg-gray-800 rounded hover:bg-gray-700 btn-press">Copy link</button>
        </div>
        <div className="mt-4 text-right">
          <button onClick={onClose} className="text-sm text-gray-300 hover:text-white btn-press">Close</button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
