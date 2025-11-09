import type { NextPage } from 'next';
import Sidebar from '../components/Sidebar';
import NewsletterSignup from '../components/NewsletterSignup';

const About: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      <div className="container mx-auto p-8">
        <div className="flex gap-8">
          <Sidebar />
          <main className="flex-1 max-w-4xl bg-gray-800 p-8 rounded-lg border border-gray-700 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-green-400 mb-4">About Badcompany</h1>
              <p className="text-gray-400 mb-6">A realistic red-team game to help researchers and enthusiasts find prompt-injection and social engineering flaws in LLM-based agents.</p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="text-lg font-semibold text-green-400">Mission</h3>
                <p className="text-gray-400 mt-2">We create playful but realistic agent simulations so that vulnerabilities can be discovered in a safe environment.</p>
              </div>

              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="text-lg font-semibold text-green-400">Our Vision</h3>
                <p className="text-gray-400 mt-2">Securing the future of AI by understanding and mitigating real-world attack vectors on autonomous agent systems.</p>
              </div>
            </div>

            <div className="mt-8">
              <NewsletterSignup />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default About;
