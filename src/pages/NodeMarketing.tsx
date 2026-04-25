import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Workflow, ArrowLeft, Play, Clock, Coins, Zap, Search, Filter, X,
  ChevronRight, Sparkles, TrendingUp, Settings2
} from 'lucide-react';
import { WORKFLOW_TEMPLATES, getDifficultyColor } from '../lib/workflowConfig';

const categories = [
  { id: 'all', label: 'Semua Template', emoji: '⚡' },
  { id: 'marketing', label: 'Marketing', emoji: '📢' },
  { id: 'content', label: 'Content Creation', emoji: '🎬' },
  { id: 'fashion', label: 'Fashion', emoji: '👗' },
  { id: 'branding', label: 'Branding', emoji: '🎨' },
];

export default function NodeMarketing() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = useMemo(() => {
    return WORKFLOW_TEMPLATES.filter(template => {
      const matchCategory = activeCategory === 'all' || template.category === activeCategory;
      const matchSearch = !searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const totalTemplates = WORKFLOW_TEMPLATES.length;
  const avgCost = Math.round(WORKFLOW_TEMPLATES.reduce((sum, t) => sum + t.totalTokenCost, 0) / totalTemplates);

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15),transparent_50%)]" />
        <div className="absolute top-4 right-4 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-4 left-4 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
        
        <div className="relative z-10">
          <button
            onClick={() => navigate('/tools')}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm backdrop-blur-sm transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Tools
          </button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200">
                <Workflow className="h-3.5 w-3.5" />
                Node Marketing Terminal
              </div>
              <h1 className="text-3xl font-black leading-tight sm:text-4xl">
                AI Workflow Templates
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-300">
                Template workflow siap pakai untuk generate konten marketing end-to-end. Drag, connect, dan run — dari concept hingga final video.
              </p>
            </div>
            
            <div className="hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:block">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-300">
                <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                Quick Stats
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-400">Total Templates</span>
                  <span className="font-bold text-white">{totalTemplates}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-400">Avg. Cost</span>
                  <span className="font-bold text-yellow-300">{avgCost} token</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-400">Free Models</span>
                  <span className="font-bold text-green-300">3 available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari template berdasarkan nama, kategori, atau tag..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const count = cat.id === 'all' ? totalTemplates : WORKFLOW_TEMPLATES.filter(t => t.category === cat.id).length;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-indigo-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-indigo-600'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Results Info ── */}
      {searchQuery && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Menampilkan <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredTemplates.length}</span> hasil untuk &quot;{searchQuery}&quot;
        </p>
      )}

      {/* ── Template Grid ── */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-900"
            >
              {/* Thumbnail */}
              <div className="relative h-44 overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20">
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Difficulty Badge */}
                <div className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-xs font-bold capitalize backdrop-blur-sm ${getDifficultyColor(template.difficulty)}`}>
                  {template.difficulty}
                </div>

                {/* Token Cost */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full border border-yellow-300/50 bg-yellow-400/90 px-2 py-1 text-xs font-bold text-yellow-900 backdrop-blur-sm">
                  <Coins className="h-3 w-3" />
                  {template.totalTokenCost} token
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">
                  {template.name}
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {template.description}
                </p>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {template.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-500">
                      +{template.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Meta Info */}
                <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {template.estimatedTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <Workflow className="h-3 w-3" />
                    {template.nodes.length} nodes
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => navigate(`/tools/node-marketing-editor/${template.id}`)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02] hover:shadow-indigo-500/50"
                >
                  <Play className="h-4 w-4" />
                  Use Template
                </button>
              </div>

              {/* Hover Effect Overlay */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/5 to-transparent" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 dark:border-gray-700">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Search className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="mb-2 font-semibold text-gray-700 dark:text-gray-300">Template tidak ditemukan</h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Coba kata kunci lain atau pilih kategori berbeda</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* ── Info Card ── */}
      <div className="overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:border-blue-800/50 dark:from-blue-900/10 dark:to-indigo-900/10">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white">
              <Zap className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Cara Menggunakan Workflow Templates
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Pilih template, customize parameter (brand name, product, duration), lalu run workflow. Setiap node akan generate output secara otomatis dan calculate token cost.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  'Drag & drop nodes',
                  'Connect input/output',
                  'Configure AI models',
                  'Preview token cost',
                  'Run & export'
                ].map((feature, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-300"
                  >
                    <ChevronRight className="h-3 w-3 text-blue-500" />
                    {feature}
                  </span>
                ))}
              </div>
              <button
                onClick={() => navigate('/api-config')}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Settings2 className="h-4 w-4" />
                Configure API Keys
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Popular Templates Highlight ── */}
      <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 dark:border-purple-800/50 dark:from-purple-900/10 dark:to-pink-900/10">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-bold text-gray-900 dark:text-white">Most Popular Templates</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW_TEMPLATES.slice(0, 3).map(template => (
            <button
              key={template.id}
              onClick={() => navigate(`/tools/node-marketing-editor/${template.id}`)}
              className="flex items-center gap-3 rounded-xl border border-purple-200 bg-white p-3 text-left transition hover:border-purple-400 hover:shadow-md dark:border-purple-800/50 dark:bg-gray-900 dark:hover:border-purple-600"
            >
              <img
                src={template.thumbnail}
                alt={template.name}
                className="h-12 w-12 rounded-lg object-cover"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {template.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {template.totalTokenCost} tokens • {template.nodes.length} nodes
                </p>
              </div>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
