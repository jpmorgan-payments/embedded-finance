import { useCallback, useEffect, useMemo } from 'react';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { cn } from '@/lib/utils';
import {
  API_SURFACE_META,
  DATA_OBJECT_ENTITIES,
  type DataObjectId,
} from '@/lib/embedded-payments-flow/scenarios';

/** Fixed layout tuned for 7 entities (px in React Flow coordinates). */
const NODE_POSITION: Record<DataObjectId, { x: number; y: number }> = {
  party: { x: 20, y: 40 },
  document: { x: 20, y: 260 },
  client: { x: 260, y: 160 },
  account: { x: 500, y: 40 },
  recipient: { x: 500, y: 280 },
  transaction: { x: 740, y: 160 },
  webhook: { x: 260, y: 420 },
};

type EntityNodeData = {
  entity: (typeof DATA_OBJECT_ENTITIES)[number];
  dimmed: boolean;
};

function EntityNode({ data }: NodeProps) {
  const { entity, dimmed } = data as EntityNodeData;
  const meta = API_SURFACE_META[entity.apiSurface];
  const id = entity.id;

  const showLeftTarget =
    id === 'client' ||
    id === 'account' ||
    id === 'recipient' ||
    id === 'transaction';
  const showRightSource =
    id === 'party' ||
    id === 'document' ||
    id === 'client' ||
    id === 'account' ||
    id === 'recipient' ||
    id === 'webhook';
  const showBottomTarget = id === 'client' || id === 'transaction';
  const showTopSource = id === 'webhook';

  return (
    <div
      className={cn(
        'w-[168px] rounded-lg border bg-white px-2.5 py-2 shadow-sm transition-opacity',
        meta.chipClass,
        dimmed && 'opacity-40'
      )}
    >
      {showLeftTarget && (
        <Handle
          id="l"
          type="target"
          position={Position.Left}
          className="!h-2 !w-2 !border-gray-400 !bg-white"
        />
      )}
      {showRightSource && (
        <Handle
          id="r"
          type="source"
          position={Position.Right}
          className="!h-2 !w-2 !border-gray-400 !bg-white"
        />
      )}
      {showBottomTarget && (
        <Handle
          id="b"
          type="target"
          position={Position.Bottom}
          className="!h-2 !w-2 !border-gray-400 !bg-white"
        />
      )}
      {showTopSource && (
        <Handle
          id="ts"
          type="source"
          position={Position.Top}
          className="!h-2 !w-2 !border-gray-400 !bg-white"
        />
      )}

      <p className="text-xs font-semibold leading-tight text-gray-900">
        {entity.label}
      </p>
      <p className="mt-0.5 font-mono text-[9px] text-gray-600">
        PK: {entity.idField}
      </p>
      <ul className="mt-1.5 space-y-0.5 border-t border-black/5 pt-1.5 text-[9px] leading-tight text-gray-700">
        {entity.keyFields.slice(0, 5).map((f: string) => (
          <li key={f} className="font-mono">
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

const nodeTypes = { entity: EntityNode } satisfies NodeTypes;

function buildNodes(activeObjectIds: ReadonlySet<DataObjectId>): Node[] {
  const dimmed = (id: DataObjectId) =>
    activeObjectIds.size > 0 &&
    activeObjectIds.size < DATA_OBJECT_ENTITIES.length &&
    !activeObjectIds.has(id);

  return DATA_OBJECT_ENTITIES.map((entity) => ({
    id: entity.id,
    type: 'entity',
    position: NODE_POSITION[entity.id],
    data: {
      entity,
      dimmed: dimmed(entity.id),
    },
  }));
}

function buildEdges(): Edge[] {
  const marker = { type: MarkerType.ArrowClosed, width: 18, height: 18 };

  const edge = (
    id: string,
    source: DataObjectId,
    target: DataObjectId,
    label: string,
    sourceHandle: string,
    targetHandle: string
  ): Edge => ({
    id,
    source,
    target,
    label,
    sourceHandle,
    targetHandle,
    markerEnd: marker,
    style: { stroke: '#94a3b8', strokeWidth: 1.25 },
    labelStyle: { fontSize: 10, fill: '#475569' },
    labelBgStyle: { fill: '#f8fafc' },
    labelBgPadding: [4, 2] as [number, number],
    type: 'smoothstep',
  });

  return [
    edge('e-party-client', 'party', 'client', 'roles', 'r', 'l'),
    edge('e-doc-client', 'document', 'client', 'requests', 'r', 'l'),
    edge('e-client-account', 'client', 'account', 'clientId', 'r', 'l'),
    edge('e-client-recipient', 'client', 'recipient', 'clientId', 'r', 'l'),
    edge('e-account-tx', 'account', 'transaction', 'accounts', 'r', 'l'),
    edge('e-recipient-tx', 'recipient', 'transaction', 'payee', 'r', 'l'),
    edge('e-wh-client', 'webhook', 'client', 'events', 'ts', 'b'),
    edge('e-wh-tx', 'webhook', 'transaction', 'events', 'r', 'b'),
  ];
}

function GraphInner({
  activeObjectIds,
}: {
  activeObjectIds: ReadonlySet<DataObjectId>;
}) {
  const initialNodes = useMemo(() => buildNodes(activeObjectIds), [activeObjectIds]);
  const staticEdges = useMemo(() => buildEdges(), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(staticEdges);

  useEffect(() => {
    setNodes(buildNodes(activeObjectIds));
  }, [activeObjectIds, setNodes]);

  const onInit = useCallback((instance: { fitView: (opts?: object) => void }) => {
    instance.fitView({ padding: 0.2, maxZoom: 1.1 });
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onInit={onInit}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnScroll
      zoomOnScroll
      minZoom={0.45}
      maxZoom={1.5}
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{ type: 'smoothstep' }}
    >
      <Background gap={16} size={1} color="#e2e8f0" />
      <Controls showInteractive={false} className="!border-sp-border !bg-white" />
      <MiniMap
        className="!border-sp-border !bg-gray-50"
        nodeStrokeWidth={2}
        zoomable
        pannable
      />
      <Panel position="top-left" className="m-2 rounded-md bg-white/90 px-2 py-1 text-[11px] text-gray-600 shadow-sm">
        Drag to pan · scroll to zoom · edges show FK-style links
      </Panel>
    </ReactFlow>
  );
}

export function EntityGraphFlow({
  activeObjectIds,
}: {
  activeObjectIds: ReadonlySet<DataObjectId>;
}) {
  return (
    <div className="h-[min(520px,65vh)] w-full min-h-[360px] rounded-lg border border-sp-border bg-slate-50/50">
      <ReactFlowProvider>
        <GraphInner activeObjectIds={activeObjectIds} />
      </ReactFlowProvider>
    </div>
  );
}
