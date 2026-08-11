'use client';

import { useQuery } from '@apollo/client';
import { GET_ORG_WORKFLOWS } from '@/lib/graphql';

export default function QuotaBadge() {
  const { data, loading } = useQuery(GET_ORG_WORKFLOWS);

  if (loading || !data?.organizations?.[0]) {
    return <div className="text-xs text-slate-500 animate-pulse">Loading quota...</div>;
  }

  const org = data.organizations[0];
  const used = org.quota_used || 0;
  const allowed = org.quota_allowed || 1000;
  const percentage = Math.min(Math.round((used / allowed) * 100), 100);

  return (
    <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
      <span className="font-medium text-slate-300">{org.name}</span>
      <div className="w-16 bg-slate-700 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            percentage > 90 ? 'bg-red-500' : percentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-slate-400 font-mono">{used}/{allowed}</span>
    </div>
  );
}