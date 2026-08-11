'use client';

import { useSubscription, useMutation } from '@apollo/client';
import { SUBSCRIBE_STEP_RUNS, APPROVE_STEP } from '@/lib/graphql';

export default function WorkflowMonitor({ runId }: { runId: string }) {
  const { data, loading } = useSubscription(SUBSCRIBE_STEP_RUNS, {
    variables: { run_id: runId },
  });
  const [approveStep, { loading: approving }] = useMutation(APPROVE_STEP);

  if (loading) return <div className="p-4">Connecting to live execution stream...</div>;

  const run = data?.workflow_runs_by_pk;
  if (!run) return <div>No run found for ID {runId}</div>;

  return (
    <div className="bg-slate-900 text-white p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-center border-b border-slate-700 pb-3">
        <h2 className="text-xl font-bold">Execution Stream</h2>
        <span className={`px-3 py-1 rounded text-sm font-semibold uppercase ${
          run.status === 'completed' ? 'bg-green-600' :
          run.status === 'paused' ? 'bg-amber-500 text-black' :
          run.status === 'failed' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {run.status}
        </span>
      </div>

      <div className="space-y-3">
        {run.step_runs?.map((sr: any, idx: number) => (
          <div key={sr.id} className="p-3 bg-slate-800 rounded border border-slate-700 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Step #{idx + 1} - Status: <span className="underline">{sr.status}</span></span>
              {sr.status === 'paused' && (
                <button
                  disabled={approving}
                  onClick={() => approveStep({ variables: { step_run_id: sr.id } })}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-1.5 rounded text-sm font-bold transition">
                  {approving ? 'Approving...' : 'Approve & Resume'}
                </button>
              )}
            </div>
            {sr.output && (
              <pre className="bg-slate-950 p-2 rounded text-xs text-green-400 overflow-x-auto">
                {JSON.stringify(sr.output, null, 2)}
              </pre>
            )}
            {sr.error && <p className="text-xs text-red-400">Error: {sr.error}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}