import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        router.push('/');
        return;
      }

      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          console.error('Auth callback error:', error);
        }
      } catch (err) {
        console.error('Auth callback error:', err);
      } finally {
        // Redirect to home page
        router.push('/');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold text-green-400 mb-4">
          Confirming your account...
        </div>
        <div className="text-gray-400">
          Please wait while we verify your email.
        </div>
      </div>
    </div>
  );
}
