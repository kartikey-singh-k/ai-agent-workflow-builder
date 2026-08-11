# AI Agent Workflow Builder — Architecture & Permission Write-Up

## 1. Schema Design
The schema was designed around standard multi-tenant isolation principles using explicit organizational boundaries:
- `organizations` stores usage caps (`quota_allowed`, `quota_used`).
- `org_members` maps users to organizations with role privileges (`owner`, `editor`, `viewer`).
- `workflows` & `workflow_steps` define node sequencing and node type configurations (`llm_call`, `http_request`, `approval_gate`, etc.).
- Execution telemetry is logged in `workflow_runs` and `step_runs`, tracking real-time status (`running`, `paused`, `completed`, `failed`), inputs, outputs, and explicit approval tracking fields (`approved_by`, `approved_at`).

## 2. Two-Layer Permission System
To meet zero-trust standards, authorization is enforced in two separate layers:

### Layer 1: Data Access Isolation (Hasura Row-Level Security)
All database reads and standard writes are gated using Hasura RLS rules based on the user's JWT session claims (`X-Hasura-User-Id`). Every permission check validates that the user exists in `org_members` for the given workflow's `org_id`. An editor or owner in Org A cannot query or guess the UUID of an Org B resource because Hasura generates a SQL `WHERE` clause restricting cross-tenant visibility.

### Layer 2: Action-Level & Mid-Execution Gating
Certain actions (e.g., triggering a run, invoking third-party LLMs, making external HTTP requests, clearing approval gates) carry operational side-effects. These are implemented via custom Hasura Actions / Nhost Serverless Functions (`triggerWorkflowRun` and `approveStep`). Before any execution logic proceeds:
1. The function checks the user's role in `org_members`.
2. It verifies that `quota_used < quota_allowed`.
3. If an `approval_gate` node is hit, the engine immediately pauses execution, logs the step status, and yields control back to the UI.
4. Resuming requires `approveStep`, which re-verifies that the approver possesses an `owner` or `editor` role in that specific organization.

## 3. Approval Gate Implementation
Rather than holding serverless lambda instances open during human-in-the-loop steps, the engine utilizes a state-machine model:
1. **Pause Phase:** Upon encountering an `approval_gate` step type, the backend sets `step_runs.status = 'paused'` and `workflow_runs.status = 'paused'`, persisting intermediate outputs and terminating the HTTP request cleanly.
2. **Live Observation:** The Next.js frontend listens via a GraphQL WebSocket Subscription on `step_runs`. The state change to `paused` dynamically renders the "Approve & Resume" action UI.
3. **Resume Phase:** The `approveStep` Hasura Action validates the user's role, updates `approved_by` / `approved_at`, sets status back to `completed`, and executes any subsequent workflow steps.