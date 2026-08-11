import { gql } from '@apollo/client';

export const GET_ORG_WORKFLOWS = gql`
  query GetOrgWorkflows {
    workflows {
      id
      name
      created_at
      workflow_steps(order_by: { order_index: asc }) {
        id
        type
        config
        order_index
      }
      workflow_runs(limit: 1, order_by: { started_at: desc }) {
        id
        status
        started_at
      }
    }
    organizations {
      id
      name
      quota_allowed
      quota_used
    }
  }
`;

export const SUBSCRIBE_STEP_RUNS = gql`
  subscription OnStepRunsChange($run_id: uuid!) {
    workflow_runs_by_pk(id: $run_id) {
      id
      status
      step_runs(order_by: { started_at: asc }) {
        id
        step_id
        status
        input
        output
        error
        approved_by
      }
    }
  }
`;

export const TRIGGER_WORKFLOW = gql`
  mutation TriggerWorkflow($workflow_id: uuid!) {
    triggerWorkflowRun(workflow_id: $workflow_id) {
      workflow_run_id
      status
    }
  }
`;

export const APPROVE_STEP = gql`
  mutation ApproveStep($step_run_id: uuid!) {
    approveStep(step_run_id: $step_run_id) {
      success
    }
  }
`;