import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Copy, Loader2, Play, Settings, Coins,
  Download, Save, Zap, Info, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  addEdge,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import type { Connection, Edge, Node, NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAlert } from '@/context/AlertContext';
import { useTokenStore } from '@/store/useTokenStore';
import { getTemplateById, type NodeConfig } from '@/lib/workflowConfig';

type WorkflowNodeData = NodeConfig;
type WorkflowNode = Node<WorkflowNodeData, 'workflow'>;

// ── Node Component ──
function WorkflowNodeCard({ data, selected }: NodeProps<WorkflowNode>) {
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'input': return 'border-cyan-400/80 bg-cyan-900/40';
      case 'text-gen': return 'border-purple-400/80 bg-purple-900/40';
      case 'image-gen': return 'border-pink-400/80 bg-pink-900/40';
      case 'image-edit': return 'border-orange-400/80 bg-orange-900/40';
      case 'video-gen': return 'border-blue-400/80 bg-blue-900/40';
      case 'audio-gen': return 'border-green-400/80 bg-green-900/40';
      case 'processor': return 'border-yellow-400/80 bg-yellow-900/40';
      case 'output': return 'border-emerald-400/80 bg-emerald-900/40';
      default: return 'border-slate-700/80 bg-slate-900/85';
    }
  };

  return (
    <div
      className={`w-[280px] rounded-2xl border p-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.4)] backdrop-blur transition-all ${
        selected ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950' : ''
      } ${getNodeColor(data.type)}`}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !bg-cyan-300 !border-2 !border-slate-950" />
      
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{data.category}</p>
        {data.tokenCost > 0 && (
          <span className="flex items-center gap-0.5 rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-300">
            <Coins className="h-2.5 w-2.5" />
            {data.tokenCost}
          </span>
        )}
      </div>
      
      <p className="mb-2 text-sm font-bold text-slate-100">{data.title}</p>
      
      <p className="mb-2 rounded-lg bg-slate-950/80 p-2 text-[11px] leading-relaxed text-slate-300">
        {data.description}
      </p>
      
      <div className="rounded-lg border border-slate-700/80 bg-slate-900/70 p-2">
        <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">Model</p>
        <p className="text-[10px] font-mono text-emerald-300">{data.modelName}</p>
      </div>
      
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !bg-indigo-300 !border-2 !border-slate-950" />
    </div>
  );
}

export default function NodeMarketingEditor() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { tokens, deductTokens } = useTokenStore();

  const template = useMemo(() => getTemplateById(templateId || ''), [templateId]);

  const [productName, setProductName] = useState('Minuman Cola');
  const [brandName, setBrandName] = useState('Cola Fresh');
  const [duration, setDuration] = useState(15);
  const [customParams, setCustomParams] = useState<Record<string, string>>({});
  
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [runningNodes, setRunningNodes] = useState<Record<string, boolean>>({});
  const [completedNodes, setCompletedNodes] = useState<Record<string, string>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [runLog, setRunLog] = useState<string[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);

  const initialNodes = useMemo(() => {
    if (!template) return [];
    return template.nodes.map(node => ({
      id: node.id,
      type: 'workflow',
      position: node.position,
      data: node,
    }));
  }, [template]);

  const initialEdges = useMemo(() => template?.edges || [], [template]);

  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const nodeTypes = useMemo(() => ({ workflow: WorkflowNodeCard }), []);

  // Calculate total cost
  const totalCost = useMemo(() => {
    return nodes.reduce((sum, node) => sum + (node.data.tokenCost || 0), 0);
  }, [nodes]);

  const selectedNode = useMemo(
    () => nodes.find(node => node.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  useEffect(() => {
    if (!template) {
      showAlert('Template tidak ditemukan', 'error');
      navigate('/tools/node-marketing');
    }
  }, [template, navigate, showAlert]);

  useEffect(() => {
    if (initialNodes.length > 0 && !selectedNodeId) {
      setSelectedNodeId(initialNodes[initialNodes.length - 1].id);
    }
  }, [initialNodes, selectedNodeId]);

  const dependenciesByTarget = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const edge of edges) {
      if (!map[edge.target]) {
        map[edge.target] = [];
      }
      map[edge.target].push(edge.source);
    }
    return map;
  }, [edges]);

  const canRunNode = useCallback(
    (nodeId: string, completedSet: Set<string>) => {
      const dependencies = dependenciesByTarget[nodeId] ?? [];
      return dependencies.every(depId => completedSet.has(depId));
    },
    [dependenciesByTarget]
  );

  const executeNode = useCallback(
    async (nodeId: string) => {
      if (runningNodes[nodeId]) return false;
      
      const node = nodes.find(item => item.id === nodeId);
      if (!node) return false;

      const completedSet = new Set(Object.keys(completedNodes));
      if (!canRunNode(nodeId, completedSet)) {
        showAlert('Node ini memerlukan dependency yang belum complete', 'error');
        return false;
      }

      // Check token
      if (node.data.tokenCost > tokens) {
        showAlert(`Token tidak cukup. Butuh ${node.data.tokenCost} token, tersedia ${tokens} token`, 'error');
        return false;
      }

      setRunningNodes(prev => ({ ...prev, [nodeId]: true }));
      setRunLog(prev => [`🔄 ${node.data.title} - running...`, ...prev].slice(0, 15));

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1200 + Math.floor(Math.random() * 1500)));

      // Deduct tokens
      if (node.data.tokenCost > 0) {
        deductTokens(node.data.tokenCost);
      }

      const doneAt = new Date().toLocaleTimeString('id-ID', { hour12: false });
      setCompletedNodes(prev => ({ ...prev, [nodeId]: `✓ ${doneAt}` }));
      setRunningNodes(prev => ({ ...prev, [nodeId]: false }));
      setRunLog(prev => [`✅ ${node.data.title} - success (${node.data.tokenCost} token used)`, ...prev].slice(0, 15));
      showAlert(`✓ ${node.data.title} selesai`, 'success');
      return true;
    },
    [canRunNode, completedNodes, deductTokens, nodes, runningNodes, showAlert, tokens]
  );

  const runSelectedNode = useCallback(async () => {
    if (!selectedNode?.id) return;
    await executeNode(selectedNode.id);
  }, [executeNode, selectedNode]);

  const runAllWorkflow = useCallback(async () => {
    if (runningAll) return;

    // Check total cost
    if (totalCost > tokens) {
      showAlert(`Token tidak cukup. Butuh ${totalCost} token, tersedia ${tokens} token. Silakan top up terlebih dahulu.`, 'error');
      return;
    }

    setRunningAll(true);
    setRunLog(['🚀 Starting full workflow...', ...runLog].slice(0, 15));

    const order = nodes.map(node => node.id);
    const completedSet = new Set(Object.keys(completedNodes));

    for (const nodeId of order) {
      if (completedSet.has(nodeId)) continue;
      if (!canRunNode(nodeId, completedSet)) continue;
      
      const ok = await executeNode(nodeId);
      if (ok) {
        completedSet.add(nodeId);
      }
    }

    setRunningAll(false);
    setRunLog(prev => ['🎉 Full workflow completed!', ...prev].slice(0, 15));
    showAlert('✓ Workflow selesai dijalankan!', 'success');
  }, [canRunNode, completedNodes, executeNode, nodes, runningAll, runLog, showAlert, tokens, totalCost]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(current =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: '#60a5fa', strokeWidth: 2.5 },
          },
          current
        )
      );
    },
    [setEdges]
  );

  const copyPrompt = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showAlert('Prompt disalin ke clipboard', 'success');
    } catch {
      showAlert('Gagal menyalin prompt', 'error');
    }
  };

  const exportWorkflow = () => {
    const workflowData = {
      template: template?.name,
      nodes: nodes.map(n => ({ id: n.id, title: n.data.title, cost: n.data.tokenCost })),
      totalCost,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${template?.id}-${Date.now()}.json`;
    a.click();
    showAlert('Workflow exported', 'success');
  };

  if (!template) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            onClick={() => navigate('/tools/node-marketing')}
            className="mb-2 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Templates
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{template.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2 dark:border-yellow-800/50 dark:bg-yellow-900/20">
            <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <div className="text-xs">
              <p className="font-semibold text-yellow-700 dark:text-yellow-400">Total Cost</p>
              <p className="font-bold text-yellow-900 dark:text-yellow-300">{totalCost} tokens</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800/50 dark:bg-blue-900/20">
            <Coins className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            <div className="text-xs">
              <p className="font-semibold text-blue-700 dark:text-blue-400">Your Balance</p>
              <p className="font-bold text-blue-900 dark:text-blue-300">{tokens} tokens</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Config Panel ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <Settings className="h-4 w-4 text-indigo-600" />
            Workflow Configuration
          </div>
          {showConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showConfig && (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Product Name</label>
              <input
                value={productName}
                onChange={e => setProductName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="e.g., Minuman Cola"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Brand Name</label>
              <input
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="e.g., Cola Fresh"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Duration (seconds)</label>
              <input
                type="range"
                min={8}
                max={30}
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full"
              />
              <p className="mt-1 text-xs font-semibold text-gray-700 dark:text-gray-300">{duration}s</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Warning if low balance ── */}
      {tokens < totalCost && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-900/10">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="font-semibold text-red-800 dark:text-red-300">Token Tidak Cukup</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
              Workflow ini membutuhkan <strong>{totalCost} tokens</strong>, tapi Anda hanya punya <strong>{tokens} tokens</strong>. 
              Silakan <button onClick={() => navigate('/topup')} className="underline hover:no-underline">top up token</button> terlebih dahulu.
            </p>
          </div>
        </div>
      )}

      {/* ── Workflow Canvas ── */}
      <div className="rounded-2xl border border-slate-800 bg-[#060912] p-3 shadow-2xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-[#0a1020] px-4 py-3">
          <div className="text-sm font-semibold text-slate-100">Workflow Editor • {nodes.length} nodes</div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCostBreakdown(!showCostBreakdown)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              <Info className="h-3.5 w-3.5" />
              Cost Breakdown
            </button>
            <button
              onClick={exportWorkflow}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </button>
            <button
              onClick={runAllWorkflow}
              disabled={runningAll || tokens < totalCost}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-600/60 bg-indigo-600/20 px-4 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-600/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {runningAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Run Full Workflow
            </button>
          </div>
        </div>

        {/* Cost Breakdown */}
        {showCostBreakdown && (
          <div className="mb-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Token Cost per Node</p>
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {nodes.map(node => (
                <div key={node.id} className="flex items-center justify-between rounded-lg bg-slate-900/70 px-2 py-1.5 text-xs">
                  <span className="text-slate-300">{node.data.title}</span>
                  <span className="font-bold text-yellow-300">{node.data.tokenCost} token</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2">
              <span className="text-xs font-semibold text-slate-200">Total</span>
              <span className="text-sm font-bold text-yellow-300">{totalCost} tokens</span>
            </div>
          </div>
        )}

        {/* React Flow Canvas */}
        <div className="rounded-xl border border-slate-800 bg-[#05080f] overflow-hidden">
          <div className="h-[600px] bg-[radial-gradient(circle_at_20%_10%,#10182d_0%,#05080f_45%,#04060c_100%)]">
            <ReactFlow<WorkflowNode, Edge>
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              fitView
              defaultEdgeOptions={{
                animated: true,
                style: { stroke: '#60a5fa', strokeWidth: 2.5 },
              }}
            >
              <Background color="#22314f" gap={24} />
              <Controls />
              <MiniMap zoomable pannable nodeStrokeColor="#4f46e5" nodeColor="#111827" />
            </ReactFlow>
          </div>
        </div>

        {/* Selected Node Info */}
        <div className="mt-3 grid gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Selected Node</p>
            <p className="mt-1 text-sm font-bold text-slate-100">{selectedNode?.data.title || '-'}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">{selectedNode?.data.description || '-'}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={runSelectedNode}
                disabled={!selectedNode || runningNodes[selectedNode?.id || ''] || runningAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/70 bg-emerald-600/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {selectedNode && runningNodes[selectedNode.id] ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Run This Node
              </button>
              {selectedNode && completedNodes[selectedNode.id] && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {completedNodes[selectedNode.id]}
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Node Prompt</p>
              {selectedNode && (
                <button
                  onClick={() => copyPrompt(selectedNode.data.prompt)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <Copy className="h-3 w-3" />
                </button>
              )}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">{selectedNode?.data.prompt || '-'}</p>
            
            <div className="mt-3 rounded-lg border border-slate-700/80 bg-slate-900/70 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Run Log (Latest 5)</p>
              <div className="mt-1 max-h-32 space-y-1 overflow-auto">
                {runLog.length > 0 ? (
                  runLog.slice(0, 5).map((log, i) => (
                    <p key={i} className="text-[11px] text-slate-300">{log}</p>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-500">No activity yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
