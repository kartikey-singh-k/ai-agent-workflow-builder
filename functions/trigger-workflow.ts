import { Request, Response } from 'express';

const HASURA_ENDPOINT = process.env.NHOST_GRAPHQL_URL || 'http://localhost:8080/v1/graphql';
const HASURA_ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET || 'nhost-admin-secret';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

async function adminGraphQL(query: string, variables: any) {
  const res = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

export default async function handler(req: Request, res: Response) {
  try {
    const { workflow_id } = req.body.input;
    const sessionVars = req.body.session_variables || {};
    const user_id = sessionVars['x-hasura-user-id'];

    // 1. Fetch Workflow & Layer 2 Permission Check
    const data = await adminGraphQL(`
      query GetWorkflowDetails($workflow_id: uuid!) {
        workflows_by_pk(id: $workflow_id) {
          id
          org_id
          organization {
            quota_used
            quota_allowed
            org_members {
              user_id
              role
            }
          }
          workflow_steps(order_by: { order_index: asc }) {
            id
            type
            config
            order_index
          }
        }
      }
    `, { workflow_id });

    const workflow = data.workflows_by_pk;
    if (!workflow) return res.status(404).json({ message: 'Workflow not found' });

    const member = workflow.organization.org_members.find((m: any) => m.user_id === user_id);
    if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
      return res.status(403).json({ message: 'Forbidden: Owner or Editor role required in this Org' });
    }

    if (workflow.organization.quota_used >= workflow.organization.quota_allowed) {
      return res.status(429).json({ message: 'Quota limit reached for this organization' });
    }

    // 2. Create Workflow Run
    const runRes = await adminGraphQL(`
      mutation CreateRun($workflow_id: uuid!) {
        insert_workflow_runs_one(object: { workflow_id: $workflow_id, status: running }) {
          id
        }
      }
    `, { workflow_id });

    const runId = runRes.insert_workflow_runs_one.id;
    let lastOutput: any = { message: "Workflow started" };

    // 3. Step Execution Loop
    for (const step of workflow.workflow_steps) {
      // Create Step Run entry
      const stepRunRes = await adminGraphQL(`
        mutation CreateStepRun($run_id: uuid!, $step_id: uuid!, $input: jsonb) {
          insert_step_runs_one(object: { workflow_run_id: $run_id, step_id: $step_id, status: running, input: $input }) {
            id
          }
        }
      `, { run_id: runId, step_id: step.id, input: lastOutput });

      const stepRunId = stepRunRes.insert_step_runs_one.id;

      // Handle Step Types
      if (step.type === 'approval_gate') {
        // Pause execution and exit handler
        await adminGraphQL(`
          mutation PauseRun($run_id: uuid!, $step_run_id: uuid!) {
            update_workflow_runs_by_pk(pk_columns: { id: $run_id }, _set: { status: paused }) { id }
            update_step_runs_by_pk(pk_columns: { id: $step_run_id }, _set: { status: paused }) { id }
          }
        `, { run_id: runId, step_run_id: stepRunId });

        return res.json({ workflow_run_id: runId, status: 'paused', paused_at_step: step.id });
      }

      try {
        if (step.type === 'llm_call') {
          const prompt = step.config.prompt || `Analyze: ${JSON.stringify(lastOutput)}`;
          if (GROQ_API_KEY) {
            const llmRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }] })
            });
            const llmJson: any = await llmRes.json();
            lastOutput = { result: llmJson.choices?.[0]?.message?.content || "No output" };
          } else {
            // Artificial delay stub if no API key provided
            await new Promise((r) => setTimeout(r, 1000));
            lastOutput = { result: `[STUB LLM] Processed prompt: ${prompt}` };
          }
        } else if (step.type === 'http_request') {
          const url = step.config.url || 'https://jsonplaceholder.typicode.com/todos/1';
          const httpRes = await fetch(url);
          lastOutput = await httpRes.json();
        } else if (step.type === 'conditional_branch') {
          const conditionPassed = lastOutput && !lastOutput.error;
          lastOutput = { branch: conditionPassed ? 'true' : 'false', prev_data: lastOutput };
        } else if (step.type === 'db_write') {
          lastOutput = { db_status: "written", timestamp: new Date().toISOString() };
        }

        // Complete Step
        await adminGraphQL(`
          mutation CompleteStep($step_run_id: uuid!, $output: jsonb) {
            update_step_runs_by_pk(pk_columns: { id: $step_run_id }, _set: { status: completed, output: $output, completed_at: "now()" }) { id }
          }
        `, { step_run_id: stepRunId, output: lastOutput });

      } catch (err: any) {
        await adminGraphQL(`
          mutation FailStep($step_run_id: uuid!, $run_id: uuid!, $error: String!) {
            update_step_runs_by_pk(pk_columns: { id: $step_run_id }, _set: { status: failed, error: $error }) { id }
            update_workflow_runs_by_pk(pk_columns: { id: $run_id }, _set: { status: failed }) { id }
          }
        `, { step_run_id: stepRunId, run_id: runId, error: err.message });

        return res.status(500).json({ message: 'Execution failed at step', error: err.message });
      }
    }

    // Complete Workflow & Increment Quota
    await adminGraphQL(`
      mutation CompleteWorkflow($run_id: uuid!, $org_id: uuid!) {
        update_workflow_runs_by_pk(pk_columns: { id: $run_id }, _set: { status: completed, completed_at: "now()" }) { id }
        update_organizations_by_pk(pk_columns: { id: $org_id }, _inc: { quota_used: 1 }) { id }
      }
    `, { run_id: runId, org_id: workflow.org_id });

    return res.json({ workflow_run_id: runId, status: 'completed' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}