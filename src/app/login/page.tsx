'use client';

import { useState } from 'react';
import { useSignInEmailPassword, useSignUpEmailPassword } from '@nhost/nextjs';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const { signInEmailPassword, isLoading: signingIn } = useSignInEmailPassword();
  const { signUpEmailPassword, isLoading: signingUp } = useSignUpEmailPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      const res = await signUpEmailPassword(email, password);
      if (!res.isError) router.push('/');
    } else {
      const res = await signInEmailPassword(email, password);
      if (!res.isError) router.push('/');
    }
  };

  return (
    <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
      <h2 className="text-2xl font-bold text-center text-white">
        {isSignUp ? 'Create an Account' : 'Sign In to AgentFlow'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-slate-400">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={signingIn || signingUp}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded text-sm transition"
        >
          {signingIn || signingUp ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      <div className="text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-xs text-slate-400 hover:underline"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}