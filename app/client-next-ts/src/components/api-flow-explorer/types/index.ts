// Types for Arazzo Flow Dialog components

export interface ArazzoWorkflowStep {
  stepId: string;
  description?: string;
  operationId?: string;
  onSuccess?: Array<{ reference?: string; stepId?: string } | string>;
  requestBody?: {
    contentType?: string;
    payload?: unknown;
  };
}

export interface ArazzoWorkflow {
  workflowId: string;
  summary?: string;
  steps?: ArazzoWorkflowStep[];
}

export interface ArazzoSpec {
  workflows?: ArazzoWorkflow[];
}

export interface OasSpec {
  paths?: Record<string, Record<string, any>>;
  [key: string]: any;
}

// API Operation information extracted from OAS
export interface OasOperationInfo {
  verb: string;
  path: string;
  summary?: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: Record<string, any>;
  tags?: string[];
}

export type HttpVerb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'CALL';

export const HTTP_VERB_STYLES = {
  GET: 'bg-blue-50 text-blue-700 border-blue-200',
  POST: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PUT: 'bg-amber-50 text-amber-700 border-amber-200',
  PATCH: 'bg-purple-50 text-purple-700 border-purple-200',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
  CALL: 'bg-jpm-brown-100 text-jpm-brown-900 border-jpm-brown-300',
};

export const JOURNEY_ID = '__journey__';
