import type { NextPage } from 'next';
import Image from 'next/image';
import Sidebar from '../components/Sidebar';

const About: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      <div className="container mx-auto p-8">
        <div className="flex gap-8">
          <Sidebar />
          <main className="flex-1 max-w-4xl bg-gray-800 p-8 rounded-lg border border-gray-700 animate-fade-in">
            <div className="flex items-center gap-6">
              <Image src="/badcompany_logo1.jpg" alt="BadCompany Logo" width={80} height={80} className="rounded" />
              <div>
                <h1 className="text-3xl font-bold text-green-400">About Badcompany</h1>
                <p className="text-gray-400 mt-2">A retro-themed red-team game to help researchers and enthusiasts find prompt-injection and social engineering flaws in LLM-based agents.</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="text-lg font-semibold text-green-400">Team / Photo</h3>
                <div className="mt-3 h-40 bg-gray-800 rounded flex items-center justify-center text-gray-500">Photo placeholder</div>
              </div>

              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="text-lg font-semibold text-green-400">Mission</h3>
                <p className="text-gray-400 mt-2">We create playful but realistic agent simulations so that vulnerabilities can be discovered in a safe environment.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default About;
