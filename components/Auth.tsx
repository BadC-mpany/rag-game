
import { useSession, signIn, signOut } from "next-auth/react"

export default function Auth() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-300">Signed in as</div>
        <div className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm">{session.user?.name ?? session.user?.email}</div>
        <button onClick={() => signOut()} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded transition-all shadow-sm">
          Sign out
        </button>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => signIn('github')} className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-semibold py-2 px-3 rounded transition-all shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.866-.014-1.699-2.782.605-3.369-1.341-3.369-1.341-.455-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.607.069-.607 1.004.071 1.532 1.033 1.532 1.033.893 1.53 2.341 1.088 2.91.833.091-.647.35-1.088.636-1.339-2.22-.252-4.555-1.11-4.555-4.944 0-1.09.39-1.98 1.03-2.678-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.748-1.025 2.748-1.025.546 1.376.202 2.393.1 2.646.64.698 1.028 1.588 1.028 2.678 0 3.842-2.337 4.688-4.565 4.935.36.309.68.919.68 1.852 0 1.337-.012 2.419-.012 2.748 0 .268.18.58.688.482A10.003 10.003 0 0022 12c0-5.523-4.477-10-10-10z" fill="#fff"/></svg>
        GitHub
      </button>
      <button onClick={() => signIn('google')} className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold py-2 px-3 rounded transition-all shadow-sm">
        Google
      </button>
    </div>
  )
}
