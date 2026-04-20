import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Plus, Trash2, Zap, Image, FileText, Music,
  Download, Settings, ChevronRight, X, Sparkles,
  GitBranch, Cpu, Globe, Database, Filter, ArrowRight,
  Maximize2, MousePointer2, Move, Share2, Layers, Wand2
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Port {
  id: string;
  label: string;
  type: 'input' | 'output';
  dataType: 'text' | 'image' | 'audio' | 'any';
}

interface NodeDef {
  type: string;
  label: string;
  category: string;
  icon: React.ElementType;
  color: string;
  inputs: Omit<Port, 'id' | 'type'>[];
  outputs: Omit<Port, 'id' | 'type'>[];
  description: string;
}

interface NodeInstance {
  id: string;
  type: string;
  x: number;
  y: number;
  data: Record<string, string>;
  status: 'idle' | 'running' | 'done' | 'error';
  result?: string;
}

interface Connection {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
}

// ─── Node Definitions ─────────────────────────────────────────────────────────
const NODE_DEFS: NodeDef[] = [
  {
    type: 'text-input',
    label: 'Text Source',
    category: 'Source',
    icon: FileText,
    color: 'from-blue-500 to-indigo-600',
    inputs: [],
    outputs: [{ label: 'Data', dataType: 'text' }],
    description: 'Neural text entry point.',
  },
  {
    type: 'prompt',
    label: 'LLM Engine',
    category: 'Neural',
    icon: Wand2,
    color: 'from-purple-500 to-indigo-600',
    inputs: [{ label: 'Context', dataType: 'text' }],
    outputs: [{ label: 'Response', dataType: 'text' }],
    description: 'High-intelligence language model.',
  },
  {
    type: 'image-gen',
    label: 'Diffusion Model',
    category: 'Neural',
    icon: Image,
    color: 'from-pink-500 to-rose-600',
    inputs: [{ label: 'Prompt', dataType: 'text' }],
    outputs: [{ label: 'Visual', dataType: 'image' }],
    description: 'Generative image synthesis.',
  },
  {
    type: 'text-to-speech',
    label: 'Vocal Synth',
    category: 'Neural',
    icon: Music,
    color: 'from-emerald-500 to-teal-600',
    inputs: [{ label: 'Script', dataType: 'text' }],
    outputs: [{ label: 'Audio', dataType: 'audio' }],
    description: 'Neural voice reproduction.',
  }
];

export default function NodeTools() {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<NodeInstance[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  // ─── Canvas Interaction ─────────────────────────────────────────────────────
  const addNode = (type: string) => {
    const newNode: NodeInstance = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 300 - canvasOffset.x,
      y: 200 - canvasOffset.y,
      data: {},
      status: 'idle',
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode.id);
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDraggingNode(id);
    setSelectedNode(id);
    const node = nodes.find(n => n.id === id);
    if (node) {
      setOffset({
        x: e.clientX - node.x,
        y: e.clientY - node.y,
      });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingNode) {
      setNodes(prev => prev.map(n => 
        n.id === draggingNode 
          ? { ...n, x: e.clientX - offset.x, y: e.clientY - offset.y } 
          : n
      ));
    }
  }, [draggingNode, offset]);

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.fromNode !== id && c.toNode !== id));
    if (selectedNode === id) setSelectedNode(null);
  };

  return (
    <div className="relative h-screen w-full bg-[#050505] selection:bg-purple-500/30 font-sans overflow-hidden">
      
      {/* Decorative Grid Component */}
      <div className="absolute inset-0 z-0 opacity-20" style={{ 
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', 
        backgroundSize: '40px 40px' 
      }} />

      {/* ── Top Navigation / Control Bar ── */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 py-3 px-6 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-3xl shadow-3xl">
          <button 
            onClick={() => navigate('/')}
            className="p-2 text-gray-400 hover:text-white transition"
          >
             <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
          <div className="h-6 w-px bg-white/8 mx-2" />
          <h1 className="text-sm font-black uppercase tracking-widest text-white">Neural Workflow <span className="text-purple-400">Lab</span></h1>
          <div className="h-6 w-px bg-white/8 mx-2" />
          <div className="flex gap-2">
             <button className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-purple-500 transition shadow-xl active:scale-95">
                <Play className="h-3 w-3 fill-white" /> Execute
             </button>
             <button className="flex items-center gap-2 rounded-xl bg-white/[0.05] border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/[0.1] transition">
                <Share2 className="h-3 w-3" /> Export
             </button>
          </div>
      </div>

      {/* ── Floating Palette ── */}
      <div className={`absolute top-24 left-6 z-40 w-72 rounded-[40px] bg-white/[0.02] border border-white-[0.03] p-8 backdrop-blur-3xl shadow-3xl transition-transform duration-500 ${isMenuOpen ? 'translate-x-0' : '-translate-x-[calc(100%+40px)]'}`}>
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-lg font-black text-white px-1">Engine Library</h2>
             <button onClick={() => setIsMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white">
                <ChevronRight className="h-5 w-5 rotate-180" />
             </button>
          </div>
          <div className="space-y-4">
             {NODE_DEFS.map(def => (
                <div 
                   key={def.type}
                   onClick={() => addNode(def.type)}
                   className="group flex cursor-pointer items-center gap-4 rounded-3xl bg-black/40 border border-white/5 p-4 transition hover:border-purple-500/30 hover:bg-purple-500/[0.02]"
                >
                   <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${def.color} text-white shadow-xl group-hover:scale-110 transition-transform`}>
                      <def.icon className="h-6 w-6" />
                   </div>
                   <div>
                      <p className="text-xs font-black text-white uppercase tracking-tight">{def.label}</p>
                      <p className="text-[10px] text-gray-400 font-medium leading-tight">{def.description}</p>
                   </div>
                </div>
             ))}
          </div>
          
          <div className="mt-8 rounded-3xl bg-purple-600/10 border border-purple-500/20 p-6 text-center animate-pulse">
             <Zap className="mx-auto mb-3 h-6 w-6 text-purple-400" />
             <p className="text-[10px] font-black text-white uppercase tracking-widest">Alpha Runtime Active</p>
          </div>
      </div>
      
      {!isMenuOpen && (
         <button 
           onClick={() => setIsMenuOpen(true)}
           className="absolute top-24 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/10 text-white shadow-3xl backdrop-blur-3xl"
         >
            <Plus className="h-6 w-6" />
         </button>
      )}

      {/* ── Properties Panel (Right) ── */}
      {selectedNode && (
         <div className="absolute top-24 right-6 z-40 w-80 rounded-[40px] bg-white/[0.02] border border-white-[0.03] p-10 backdrop-blur-3xl shadow-3xl animate-in slide-in-from-right-10 duration-500">
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-lg font-black text-white uppercase tracking-tighter">Properties</h3>
               <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-white">
                  <X className="h-5 w-5" />
               </button>
            </div>
            
            <div className="space-y-8">
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Instance Identifier</label>
                  <div className="rounded-2xl bg-black/40 border border-white/5 p-4 font-mono text-[11px] text-purple-400">
                     {selectedNode.toUpperCase()}
                  </div>
               </div>
               
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Neural Parameters</label>
                  <textarea 
                     className="w-full rounded-2xl bg-black/40 border border-white/10 p-5 text-xs text-white placeholder-gray-800 outline-none focus:border-purple-500/40 transition h-32 resize-none"
                     placeholder="Enter operational logic or context..."
                  />
               </div>
               
               <button 
                 onClick={() => deleteNode(selectedNode)}
                 className="flex w-full items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition"
               >
                  <Trash2 className="h-4 w-4" /> Purge Instance
               </button>
            </div>
         </div>
      )}

      {/* ── Node Workspace (Canvas) ── */}
      <div 
         className="relative h-full w-full z-10 overflow-hidden cursor-crosshair"
         onMouseDown={() => setSelectedNode(null)}
      >
         {nodes.map(node => {
            const def = NODE_DEFS.find(d => d.type === node.type);
            const isSelected = selectedNode === node.id;
            
            return (
               <div
                  key={node.id}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                  className={`absolute z-20 w-64 rounded-[32px] bg-black border p-6 shadow-4xl backdrop-blur-xl transition-all duration-300 ${
                     isSelected ? 'border-purple-500 scale-[1.02] shadow-purple-500/20' : 'border-white/10 hover:border-white/30'
                  }`}
                  style={{ left: node.x, top: node.y }}
               >
                  <div className="mb-6 flex items-center justify-between">
                     <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${def?.color || 'from-gray-500 to-gray-700'} text-white shadow-xl`}>
                        {def && <def.icon className="h-5 w-5" />}
                     </div>
                     <div className={`h-2 w-2 rounded-full ${node.status === 'done' ? 'bg-emerald-500' : 'bg-gray-700 animate-pulse'}`} />
                  </div>
                  
                  <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2">{def?.label}</h4>
                  <p className="text-[10px] text-gray-400 font-medium mb-6 uppercase tracking-widest">Type: <span className="text-gray-400">{node.type}</span></p>
                  
                  <div className="flex justify-between -mx-6 mt-6 border-t border-white/5 pt-6 px-6">
                     <div className="space-y-3">
                        {def?.inputs.map((inp, i) => (
                           <div key={i} className="flex items-center gap-3 group">
                              <div className="h-3 w-3 rounded-full border-2 border-indigo-500 group-hover:bg-indigo-500 transition shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                              <span className="text-[9px] font-black uppercase text-gray-400">{inp.label}</span>
                           </div>
                        ))}
                     </div>
                     <div className="space-y-3 text-right">
                        {def?.outputs.map((out, i) => (
                           <div key={i} className="flex flex-row-reverse items-center gap-3 group">
                              <div className="h-3 w-3 rounded-full border-2 border-emerald-500 group-hover:bg-emerald-500 transition shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                              <span className="text-[9px] font-black uppercase text-gray-400">{out.label}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            );
         })}
      </div>

      {/* ── Status Bar / Workspace Tools (Bottom Right) ── */}
      <div className="absolute bottom-8 right-8 z-50 flex items-center gap-3 p-2 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-3xl shadow-3xl">
          <button className="p-3 text-gray-400 hover:text-white transition rounded-xl hover:bg-white/[0.05]"><Maximize2 className="h-4 w-4" /></button>
          <div className="h-4 w-px bg-white/8" />
          <button className="p-3 text-gray-400 hover:text-white transition rounded-xl hover:bg-white/[0.05]"><Move className="h-4 w-4" /></button>
          <div className="h-4 w-px bg-white/8" />
          <button className="p-3 text-gray-400 hover:text-white transition rounded-xl hover:bg-white/[0.05]"><Layers className="h-4 w-4" /></button>
          <div className="h-4 w-px bg-white/8" />
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
             <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">Active Runtime</span>
          </div>
      </div>
    
    </div>
  );
}
