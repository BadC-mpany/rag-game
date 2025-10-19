import type { NextPage } from 'next';
import Image from 'next/image';
import Sidebar from '../components/Sidebar';

const Contact: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      <div className="container mx-auto p-8">
        <div className="flex gap-8">
          <Sidebar />
          <div className="flex-1 max-w-3xl bg-gray-800 p-8 rounded-lg border border-gray-700 animate-fade-in">
            <div className="flex items-center gap-4">
              <Image src="/badcompany_logo1.jpg" alt="BadCompany Logo" width={56} height={56} className="rounded" />
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
