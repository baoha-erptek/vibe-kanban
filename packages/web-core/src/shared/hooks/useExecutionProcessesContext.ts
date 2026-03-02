import { useContext } from 'react';
import { createHmrContext } from '@/shared/lib/hmrContext';
import type { ExecutionProcess } from 'shared/types';

export type ExecutionProcessesContextType = {
  executionProcessesAll: ExecutionProcess[];
  executionProcessesByIdAll: Record<string, ExecutionProcess>;
  isAttemptRunningAll: boolean;

  executionProcessesVisible: ExecutionProcess[];
  executionProcessesByIdVisible: Record<string, ExecutionProcess>;
  isAttemptRunningVisible: boolean;

  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
};

export const ExecutionProcessesContext =
  createHmrContext<ExecutionProcessesContextType | null>(
    'ExecutionProcessesContext',
    null
  );

const defaultContext: ExecutionProcessesContextType = {
  executionProcessesAll: [],
  executionProcessesByIdAll: {},
  isAttemptRunningAll: false,
  executionProcessesVisible: [],
  executionProcessesByIdVisible: {},
  isAttemptRunningVisible: false,
  isLoading: false,
  isConnected: false,
  error: null,
};

export const useExecutionProcessesContext = () => {
  const ctx = useContext(ExecutionProcessesContext);
  return ctx ?? defaultContext;
};
