import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Copy, Loader2, Mic, Play, Sparkles, Video, Workflow } from 'lucide-react';
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
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAlert } from '../../context/AlertContext';

type WorkflowNodeData = {
  title: string;
  type: string;
  prompt: string;
  output: string;
};

type WorkflowNode = Node<WorkflowNodeData, 'workflow'>;

function WorkflowNodeCard({ data, selected }: NodeProps<WorkflowNode>) {
  return (
    <div
      className={`w-[250px] rounded-2xl border p-3 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur ${
        selected
          ? 'border-indigo-400 bg-slate-900'
          : 'border-slate-700/80 bg-slate-900/85'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !bg-cyan-300" />
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{data.type}</p>
      <p className="mt-1 text-sm font-bold text-slate-100">{data.title}</p>
      <p className="mt-2 rounded-lg bg-slate-950/80 p-2 text-[11px] leading-relaxed text-slate-300">{data.prompt}</p>
      <p className="mt-2 rounded-lg border border-slate-700/80 bg-slate-900/70 p-2 text-[10px] leading-relaxed text-emerald-300">
        Output: {data.output}
      </p>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !bg-indigo-300" />
    </div>
  );
}

function buildWorkflowNodes(
  creatorStyle: string,
  productName: string,
  brandName: string,
  durationSec: number
): WorkflowNode[] {
  return [
    {
      id: 'n1',
      type: 'workflow',
      position: { x: 40, y: 40 },
      data: {
        title: 'Reference',
        type: 'Asset Input',
        prompt: `Input referensi karakter influencer: ${creatorStyle}. Target framing 9:16, photo studio, commercial look.`,
        output: 'Reference image karakter',
      },
    },
    {
      id: 'n2',
      type: 'workflow',
      position: { x: 40, y: 280 },
      data: {
        title: 'Prompt',
        type: 'Prompt Builder',
        prompt: `Generate 4 pose wanita ${creatorStyle}. Pose wajib: hero shot, close-up smile, hold pose, call-to-action pose.`,
        output: '4 prompt pose siap render',
      },
    },
    {
      id: 'n3',
      type: 'workflow',
      position: { x: 390, y: 40 },
      data: {
        title: 'Image Generator',
        type: 'ComfyUI / SDXL',
        prompt: 'Text-to-image commercial portrait, 4 variasi pose, white seamless background, detail wajah tajam, skin texture natural.',
        output: '4 image influencer (PNG/JPG)',
      },
    },
    {
      id: 'n4',
      type: 'workflow',
      position: { x: 390, y: 280 },
      data: {
        title: 'Product Replace',
        type: 'ComfyUI Inpaint',
        prompt: `Ubah objek tangan jadi memegang ${productName} brand ${brandName}. Label produk terbaca jelas, tetap natural dan realistic.`,
        output: 'Image influencer + produk final',
      },
    },
    {
      id: 'n5',
      type: 'workflow',
      position: { x: 740, y: 160 },
      data: {
        title: 'Image to Video',
        type: 'RunPod WAN 2.1',
        prompt: `Animate 9:16 video ${durationSec} detik. Influencer angkat ${productName}, senyum, lalu tunjuk produk. Motion cinematic smooth.`,
        output: `Video utama ${durationSec} detik`,
      },
    },
    {
      id: 'n6',
      type: 'workflow',
      position: { x: 1090, y: 40 },
      data: {
        title: 'Prompt to Voice',
        type: 'TTS Voiceover',
        prompt: `Narasi Indonesia tentang ${brandName}: keunggulan rasa, momen minum, ajakan beli. Durasi ${durationSec} detik, tone energik.`,
        output: 'Audio voiceover WAV/MP3',
      },
    },
    {
      id: 'n7',
      type: 'workflow',
      position: { x: 1090, y: 280 },
      data: {
        title: 'Final Render',
        type: 'Video Output',
        prompt: 'Merge video + voiceover + subtitle. Output MP4 1080x1920, 30fps, audio jernih, siap upload Reels/TikTok.',
        output: 'Final video siap publish',
      },
    },
  ];
}

const initialEdges: Edge[] = [
  { id: 'e-n1-n3', source: 'n1', target: 'n3', animated: true },
  { id: 'e-n2-n4', source: 'n2', target: 'n4', animated: true },
  { id: 'e-n3-n5', source: 'n3', target: 'n5', animated: true },
  { id: 'e-n4-n5', source: 'n4', target: 'n5', animated: true },
  { id: 'e-n5-n6', source: 'n5', target: 'n6', animated: true },
  { id: 'e-n5-n7', source: 'n5', target: 'n7', animated: true },
  { id: 'e-n6-n7', source: 'n6', target: 'n7', animated: true },
];

export default function NodeMarketingTerminal() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [creatorStyle, setCreatorStyle] = useState('cewek influencer gen-z, clean makeup, urban casual');
  const [productName, setProductName] = useState('minuman cola');
  const [brandName, setBrandName] = useState('Cola Fresh');
  const [durationSec, setDurationSec] = useState(15);
  const [selectedNodeId, setSelectedNodeId] = useState('n7');
  const [runningNodes, setRunningNodes] = useState<Record<string, boolean>>({});
  const [completedNodes, setCompletedNodes] = useState<Record<string, string>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [runLog, setRunLog] = useState<string[]>([]);

  const generatedNodes = useMemo(
    () => buildWorkflowNodes(creatorStyle, productName, brandName, durationSec),
    [brandName, creatorStyle, durationSec, productName]
  );
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>(generatedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const nodeTypes = useMemo(() => ({ workflow: WorkflowNodeCard }), []);

  useEffect(() => {
    setNodes(prev =>
      prev.map(node => {
        const updated = generatedNodes.find(item => item.id === node.id);
        if (!updated) {
          return node;
        }
        return { ...node, data: updated.data };
      })
    );
  }, [generatedNodes, setNodes]);

  const allPrompts = useMemo(
    () => nodes.map(node => `${node.data.title}:\n${node.data.prompt}\nOutput: ${node.data.output}`).join('\n\n'),
    [nodes]
  );
  const selectedNode = useMemo(
    () => nodes.find(node => node.id === selectedNodeId) ?? nodes[0],
    [nodes, selectedNodeId]
  );
  const selectedNodeDoneInfo = selectedNode?.id ? completedNodes[selectedNode.id] : undefined;
  const selectedNodeIsRunning = selectedNode?.id ? Boolean(runningNodes[selectedNode.id]) : false;

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
      if (runningNodes[nodeId]) {
        return false;
      }
      const completedSet = new Set(Object.keys(completedNodes));
      if (!canRunNode(nodeId, completedSet)) {
        showAlert('Node ini belum bisa run. Jalankan node dependency dulu.', 'error');
        return false;
      }

      const node = nodes.find(item => item.id === nodeId);
      if (!node) {
        return false;
      }

      setRunningNodes(prev => ({ ...prev, [nodeId]: true }));
      setRunLog(prev => [`${node.data.title} - running...`, ...prev].slice(0, 12));

      await new Promise(resolve => setTimeout(resolve, 700 + Math.floor(Math.random() * 1000)));

      const doneAt = new Date().toLocaleTimeString('id-ID', { hour12: false });
      setCompletedNodes(prev => ({ ...prev, [nodeId]: `Selesai ${doneAt}` }));
      setRunningNodes(prev => ({ ...prev, [nodeId]: false }));
      setRunLog(prev => [`${node.data.title} - success (${doneAt})`, ...prev].slice(0, 12));
      showAlert(`Run selesai: ${node.data.title}`, 'success');
      return true;
    },
    [canRunNode, completedNodes, nodes, runningNodes, showAlert]
  );

  const runSelectedNode = useCallback(async () => {
    if (!selectedNode?.id) {
      return;
    }
    await executeNode(selectedNode.id);
  }, [executeNode, selectedNode]);

  const runAllWorkflow = useCallback(async () => {
    if (runningAll) {
      return;
    }
    setRunningAll(true);

    const order = nodes.map(node => node.id);
    const completedSet = new Set(Object.keys(completedNodes));

    for (const nodeId of order) {
      if (completedSet.has(nodeId)) {
        continue;
      }
      if (!canRunNode(nodeId, completedSet)) {
        continue;
      }
      const ok = await executeNode(nodeId);
      if (ok) {
        completedSet.add(nodeId);
      }
    }

    setRunningAll(false);
    showAlert('Run full workflow selesai.', 'success');
  }, [canRunNode, completedNodes, executeNode, nodes, runningAll, showAlert]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(current =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: '#60a5fa', strokeWidth: 2.2 },
          },
          current
        )
      );
    },
    [setEdges]
  );

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showAlert(`${label} disalin`, 'success');
    } catch {
      showAlert(`Gagal salin ${label}`, 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/tools')}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
          <Workflow className="h-3.5 w-3.5" />
          Node Marketing Terminal
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:grid-cols-2">
        <input
          value={creatorStyle}
          onChange={e => setCreatorStyle(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="Style influencer"
        />
        <input
          value={productName}
          onChange={e => setProductName(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="Produk"
        />
        <input
          value={brandName}
          onChange={e => setBrandName(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="Brand"
        />
        <div className="rounded-xl border border-gray-300 px-3 py-2 dark:border-gray-700">
          <label className="text-xs text-gray-500 dark:text-gray-400">Durasi Video</label>
          <input
            type="range"
            min={8}
            max={30}
            value={durationSec}
            onChange={e => setDurationSec(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{durationSec} detik</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#060912] p-3 shadow-2xl">
        <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-800 bg-[#0a1020] px-3 py-2">
          <div className="text-sm font-semibold text-slate-100">Template: AI Influencer (Drag + Connect)</div>
          <div className="flex items-center gap-2">
            <button
              onClick={runAllWorkflow}
              disabled={runningAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-600/60 bg-indigo-600/20 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-600/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Run Full
            </button>
            <button
              onClick={() => copy(allPrompts, 'Workflow prompt')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Workflow
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#05080f]">
          <div className="h-[560px] overflow-hidden rounded-xl bg-[radial-gradient(circle_at_20%_10%,#10182d_0%,#05080f_45%,#04060c_100%)]">
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
                style: { stroke: '#60a5fa', strokeWidth: 2.2 },
              }}
            >
              <Background color="#22314f" gap={24} />
              <Controls />
              <MiniMap zoomable pannable nodeStrokeColor="#4f46e5" nodeColor="#111827" />
            </ReactFlow>
          </div>
        </div>

        <div className="mt-3 grid gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Selected Node Output</p>
            <p className="mt-1 text-sm font-bold text-slate-100">{selectedNode?.data.title}</p>
            <p className="mt-2 text-xs text-slate-300">{selectedNode?.data.output}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={runSelectedNode}
                disabled={!selectedNode || selectedNodeIsRunning || runningAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/70 bg-emerald-600/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {selectedNodeIsRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                Run Node
              </button>
              {selectedNodeDoneInfo && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {selectedNodeDoneInfo}
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Selected Node Prompt</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">{selectedNode?.data.prompt}</p>
            <div className="mt-3 rounded-lg border border-slate-700/80 bg-slate-900/70 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Run Log</p>
              <div className="mt-1 max-h-24 space-y-1 overflow-auto">
                {runLog.length > 0 ? (
                  runLog.map(item => (
                    <p key={item} className="text-[11px] text-slate-300">
                      {item}
                    </p>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-500">Belum ada proses run.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            Text to Image
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Output 4 pose influencer berdasarkan prompt node.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Video className="h-4 w-4 text-blue-500" />
            Image to Video
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Animasi produk cola dengan gerak kamera sinematik.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Mic className="h-4 w-4 text-emerald-500" />
            Voiceover
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Narasi promosi produk yang sinkron dengan video.</p>
        </div>
      </div>
    </div>
  );
}
