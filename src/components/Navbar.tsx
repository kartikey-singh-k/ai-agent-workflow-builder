'use client';

import Link from 'next/link';
import { useSignOut, useUserData } from '@nhost/nextjs';
import QuotaBadge from './QuotaBadge';

export default function Navbar() {
  const { signOut } = useSignOut();
  const user = useUserData();

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <Link href="/" className="text-xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          ⚡ AgentFlow AI
        </Link>
        <Link href="/" className="text-sm font-medium hover:text-blue-400 transition">
          Workflows
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        <QuotaBadge />
        {user ? (
          <div className="flex items-center space-x-3 border-l border-slate-700 pl-4">
            <span className="text-xs text-slate-400">{user.email}</span>
            <button
              onClick={() => signOut()}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link href="/login" className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}