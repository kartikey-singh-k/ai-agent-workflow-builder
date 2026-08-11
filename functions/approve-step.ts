import { Request, Response } from 'express';

const HASURA_ENDPOINT = process.env.NHOST_GRAPHQL_URL || 'http://localhost:8080/v1/graphql';
const HASURA_ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET || 'nhost-admin-secret';

async function adminGraphQL(query: string, variables: any) {
  const res = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-hasura-admin-secret': HASURA_ADMIN_SECRET },
    body: JSON.stringify({ query, variables }),
  });
  return (await res.json()).data;
}

export default async function handler(req: Request, res: Response) {
  try {
    const { step_run_id } = req.body.input;
    const sessionVars = req.body.session_variables || {};
    const user_id = sessionVars['x-hasura-user-id'];

    // Verify step & user role
    const data = await adminGraphQL(`
      query CheckApprovalPermission($step_run_id: uuid!) {
        step_runs_by_pk(id: $step_run_id) {
          id
          workflow_run_id
          workflow_run {
            workflow {
              organization {
                org_members { user_id role }
              }
            }
          }
        }
      }
    `, { step_run_id });

    const stepRun = data.step_runs_by_pk;
    const members = stepRun.workflow_run.workflow.organization.org_members;
    const caller = members.find((m: any) => m.user_id === user_id);

    if (!caller || (caller.role !== 'owner' && caller.role !== 'editor')) {
      return res.status(403).json({ message: 'Unauthorized: Only Owner/Editor can approve' });
    }

    // Resume execution
    await adminGraphQL(`
      mutation ApproveAndResume($step_run_id: uuid!, $user_id: uuid!, $run_id: uuid!) {
        update_step_runs_by_pk(
          pk_columns: { id: $step_run_id },
          _set: { status: completed, approved_by: $user_id, approved_at: "now()" }
        ) { id }
        update_workflow_runs_by_pk(
          pk_columns: { id: $run_id },
          _set: { status: completed, completed_at: "now()" }
        ) { id }
      }
    `, { step_run_id, user_id, run_id: stepRun.workflow_run_id });

    return res.json({ success: true, message: 'Step approved and workflow resumed.' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}