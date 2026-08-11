'use client';

import { useQuery, useMutation, gql } from '@apollo/client';
import { useParams } from 'next/navigation';
import { TRIGGER_WORKFLOW } from '@/lib/graphql';
import WorkflowBuilder from '@/components/WorkflowBuilder';
import WorkflowMonitor from '@/components/WorkflowMonitor';
import { useState } from 'react';

const GET_WORKFLOW_BY_ID = gql`
  query GetWorkflowById($id: uuid!) {
    workflows_by_pk(id: $id) {
      id
      name
      workflow_steps(order_by: { order_index: asc }) {
        id
        type
        config
        order_index
      }
    }
  }
`;

export default function WorkflowDetailPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(GET_WORKFLOW_BY_ID, { variables: { id } });
  const [triggerWorkflow, { loading: triggering }] = useMutation(TRIGGER_WORKFLOW);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  if (loading) return <div className="text-center py-20 text-slate-400">Loading workflow...</div>;
  if (error || !data?.workflows_by_pk) {
    return <div className="text-red-400 py-20 text-center">Workflow not found or access denied (Layer 1 Security)</div>;
  }

  const workflow = data.workflows_by_pk;

  const handleRun = async () => {
    const res = await triggerWorkflow({ variables: { workflow_id: workflow.id } });
    if (res.data?.triggerWorkflowRun?.workflow_run_id) {
      setActiveRunId(res.data.triggerWorkflowRun.workflow_run_id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">{workflow.name}</h1>
          <p className="text-xs text-slate-400 font-mono">ID: {workflow.id}</p>
        </div>

        <button
          onClick={handleRun}
          disabled={triggering}
          className="bg-emerald-600 hover:bg-emerald-500 font-bold text-white px-5 py-2 rounded-lg text-sm transition"
        >
          {triggering ? 'Triggering...' : '▶ Run Workflow'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WorkflowBuilder initialSteps={workflow.workflow_steps} />
        {activeRunId ? (
          <WorkflowMonitor runId={activeRunId} />
        ) : (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-lg text-center text-slate-500">
            Click <strong>▶ Run Workflow</strong> to launch a live execution stream.
          </div>
        )}
      </div>
    </div>
  );
}