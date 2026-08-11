'use client';

import { useState } from 'react';

interface Step {
  id: string;
  type: string;
  config: any;
  order_index: number;
}

interface WorkflowBuilderProps {
  initialSteps?: Step[];
  onSave?: (steps: Step[]) => void;
  readOnly?: boolean;
}

export default function WorkflowBuilder({ initialSteps = [], onSave, readOnly = false }: WorkflowBuilderProps) {
  const [steps, setSteps] = useState<Step[]>(initialSteps);

  const addStep = (type: string) => {
    if (readOnly) return;
    const newStep: Step = {
      id: crypto.randomUUID(),
      type,
      config: type === 'llm_call' ? { prompt: '' } : type === 'http_request' ? { url: '' } : {},
      order_index: steps.length,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    if (readOnly) return;
    const updated = steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, order_index: i }));
    setSteps(updated);
  };

  const updateConfig = (index: number, config: any) => {
    if (readOnly) return;
    const updated = [...steps];
    updated[index].config = config;
    setSteps(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Workflow Step Pipeline</h3>
        {!readOnly && onSave && (
          <button
            onClick={() => onSave(steps)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-4 py-2 rounded transition"
          >
            Save Steps
          </button>
        )}
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div key={step.id || idx} className="bg-slate-800 border border-slate-700 p-4 rounded-lg flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-xs font-mono">#{idx + 1}</span>
                <span className="font-semibold text-blue-400 capitalize">{step.type.replace('_', ' ')}</span>
              </div>
              {!readOnly && (
                <button
                  onClick={() => removeStep(idx)}
                  className="text-xs text-red-400 hover:text-red-300 transition"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Config inputs based on type */}
            {step.type === 'llm_call' && (
              <input
                type="text"
                disabled={readOnly}
                placeholder="Enter Prompt template (e.g. Summarize: {{input}})"
                value={step.config?.prompt || ''}
                onChange={(e) => updateConfig(idx, { prompt: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 w-full"
              />
            )}

            {step.type === 'http_request' && (
              <input
                type="text"
                disabled={readOnly}
                placeholder="https://api.example.com/data"
                value={step.config?.url || ''}
                onChange={(e) => updateConfig(idx, { url: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 w-full"
              />
            )}

            {step.type === 'approval_gate' && (
              <p className="text-xs text-amber-400 bg-amber-950/40 p-2 rounded border border-amber-800/50">
                ⚠️ Execution will pause here until an Owner or Editor manually approves it.
              </p>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="grid grid-cols-3 gap-2 pt-2">
          {['llm_call', 'http_request', 'conditional_branch', 'approval_gate', 'db_write', 'notify'].map((type) => (
            <button
              key={type}
              onClick={() => addStep(type)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs py-2 px-3 rounded transition font-mono"
            >
              + {type}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}