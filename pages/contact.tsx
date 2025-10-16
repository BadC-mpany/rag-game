import type { NextPage } from 'next';
import RetroLogo from '../components/RetroLogo';
import Sidebar from '../components/Sidebar';

const Contact: NextPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-900 text-white font-mono p-8">
      <div className="container mx-auto p-8">
        <div className="flex gap-8">
          <Sidebar />
          <div className="flex-1 max-w-3xl mx-auto bg-gray-800 p-8 rounded-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <RetroLogo size={56} />
              <h1 className="text-2xl font-bold text-green-400">Contact</h1>
            </div>

            <div className="mt-6 text-gray-300">
              <p>For inquiries, bug reports, or collaboration, reach out:</p>
              <ul className="mt-4 space-y-2">
                <li>Email: <a href="mailto:contact@badcompany.example" className="text-green-300">contact@badcompany.example</a></li>
                <li>Discord: (placeholder)</li>
                <li>Twitter: <a href="#" className="text-blue-400">@badcompany</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact;
