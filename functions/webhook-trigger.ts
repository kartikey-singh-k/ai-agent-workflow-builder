import { Request, Response } from 'express';

const HASURA_ENDPOINT = process.env.NHOST_GRAPHQL_URL || 'http://localhost:8080/v1/graphql';
const HASURA_ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET || 'nhost-admin-secret';

async function adminGraphQL(query: string, variables: any) {
  const res = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({ query, variables }),
  });
  return (await res.json()).data;
}

export default async function handler(req: Request, res: Response) {
  try {
    const workflow_id = req.query.workflow_id || req.body.workflow_id;

    if (!workflow_id) {
      return res.status(400).json({ error: 'Missing workflow_id parameter' });
    }

    // Verify workflow exists and has a webhook trigger configured
    const data = await adminGraphQL(`
      query VerifyWebhookTrigger($workflow_id: uuid!) {
        workflows_by_pk(id: $workflow_id) {
          id
          org_id
          organization {
            quota_used
            quota_allowed
          }
          workflow_triggers(where: { type: { _eq: "webhook" } }) {
            id
            type
          }
        }
      }
    `, { workflow_id });

    const workflow = data?.workflows_by_pk;
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (workflow.workflow_triggers.length === 0) {
      return res.status(403).json({ error: 'Webhook trigger is not enabled for this workflow' });
    }

    if (workflow.organization.quota_used >= workflow.organization.quota_allowed) {
      return res.status(429).json({ error: 'Organization quota exceeded' });
    }

    // Create a workflow run
    const runRes = await adminGraphQL(`
      mutation StartWebhookRun($workflow_id: uuid!) {
        insert_workflow_runs_one(object: { workflow_id: $workflow_id, status: running }) {
          id
        }
      }
    `, { workflow_id });

    return res.json({
      message: 'Workflow triggered successfully via Webhook',
      workflow_run_id: runRes.insert_workflow_runs_one.id,
      status: 'running',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}