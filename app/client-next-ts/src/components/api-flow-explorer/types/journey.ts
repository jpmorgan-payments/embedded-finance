// Journey visualization types

import type { ApiOperation } from './api';

export type ViewMode = 'table' | 'json' | 'side-by-side';
export type NodeType = 'operation' | 'decision' | 'start' | 'end';
export type NodeStatus = 'success' | 'failure' | 'neutral';

export interface ApiJourney {
  nodes: JourneyNode[];
  edges: JourneyEdge[];
  metadata: JourneyMetadata;
}

export interface JourneyNode {
  id: string;
  type: NodeType;
  operation?: ApiOperation;
  position: { x: number; y: number };
  data: {
    label: string;
    method?: string;
    path?: string;
    status: NodeStatus;
    description?: string;
  };
}

export interface JourneyEdge {
  id: string;
  source: string;
  target: string;
  type?: 'success' | 'failure' | 'default';
  label?: string;
  animated?: boolean;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  };
}

export interface JourneyMetadata {
  title: string;
  description?: string;
  totalSteps: number;
  requiredSteps: number;
  optionalSteps: number;
  estimatedDuration?: string;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface LayoutConfig {
  nodeSpacing: {
    horizontal: number;
    vertical: number;
  };
  direction: 'TB' | 'LR' | 'BT' | 'RL';
  alignment: 'start' | 'center' | 'end';
}
