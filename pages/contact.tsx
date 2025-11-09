import type { NextPage } from 'next';
import React from 'react';
import Sidebar from '../components/Sidebar';
import NewsletterSignup from '../components/NewsletterSignup';

const Contact: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      <div className="container mx-auto p-8">
        <div className="flex gap-8">
          <Sidebar />
          <div className="flex-1 max-w-3xl bg-gray-800 p-8 rounded-lg border border-gray-700 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-green-400 mb-6">Contact</h1>
            </div>

            <div className="mt-6 text-gray-300 mb-8">
              <p>For inquiries, bug reports, or collaboration, reach out:</p>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center gap-2">
                  <span className="text-green-300">Email:</span>
                  <a href="mailto:janos.mozer@growmesh.io" className="text-green-300 hover:text-green-200">janos.mozer@growmesh.io</a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-300">LinkedIn:</span>
                  <a href="https://www.linkedin.com/company/growmesh-io" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">GrowMesh.io</a>
                </li>
                <li className="flex items-center gap-2">
                  <a href="https://discord.gg/mu5QZ98A" target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300">Join our Discord</a>
                </li>
              </ul>
            </div>

            <div>
              <NewsletterSignup />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact;
