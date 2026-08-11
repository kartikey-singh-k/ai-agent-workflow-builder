'use client';

import { useQuery, useMutation, gql } from '@apollo/client';
import { GET_ORG_WORKFLOWS } from '@/lib/graphql';
import Link from 'next/link';
import { useState } from 'react';

const CREATE_WORKFLOW = gql`
  mutation CreateWorkflow($name: string!, $org_id: uuid!) {
    insert_workflows_one(object: { name: $name, org_id: $org_id }) {
      id
    }
  }
`;

export default function Dashboard() {
  const { data, loading, error, refetch } = useQuery(GET_ORG_WORKFLOWS);
  const [createWorkflow] = useMutation(CREATE_WORKFLOW);
  const [newWorkflowName, setNewWorkflowName] = useState('');

  if (loading) return <div className="text-center py-20 text-slate-400">Loading workflows...</div>;
  if (error) return <div className="text-red-400 py-20">Error loading data: {error.message}</div>;

  const workflows = data?.workflows || [];
  const org = data?.organizations?.[0];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowName || !org) return;
    await createWorkflow({ variables: { name: newWorkflowName, org_id: org.id } });
    setNewWorkflowName('');
    refetch();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-black text-white">Workflows</h1>
          <p className="text-sm text-slate-400">Manage and automate AI step executions</p>
        </div>

        <form onSubmit={handleCreate} className="flex space-x-2">
          <input
            type="text"
            placeholder="New workflow name..."
            value={newWorkflowName}
            onChange={(e) => setNewWorkflowName(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-sm rounded px-3 py-2 text-white"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded transition">
            + Create
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((wf: any) => {
          const latestRun = wf.workflow_runs?.[0];
          return (
            <Link
              key={wf.id}
              href={`/workflows/${wf.id}`}
              className="block bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-xl transition space-y-4"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-white">{wf.name}</h3>
                {latestRun && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    latestRun.status === 'completed' ? 'bg-green-950 text-green-400 border border-green-800' :
                    latestRun.status === 'paused' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {latestRun.status}
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-400 flex justify-between">
                <span>Steps: {wf.workflow_steps?.length || 0}</span>
                <span>Created: {new Date(wf.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}