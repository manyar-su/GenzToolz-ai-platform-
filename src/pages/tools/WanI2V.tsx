import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Download, Play, X, Sparkles, RefreshCw, ZoomIn, ChevronDown, ChevronUp, Plus, FileImage, AlertCircle, Film } from "lucide-react";
import { authorizedFetch } from "../../lib/api-client";
import { useAlert } from "../../context/AlertContext";
import { useHistoryStore } from "../../store/useHistoryStore";

const SIZES = [
  { label: "720p 16:9", value: "1280*720" },
  { label: "720p 9:16", value: "720*1280" },
  { label: "720p 1:1", value: "720*720" },
];

const DURATIONS = [5, 10];

interface UploadedImage {
  preview: string;
  publicUrl: string;
  name: string;
  uploading: boolean;
  error?: string;
}

type JobStatus = "IDLE" | "SUBMITTING" | "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

const STATUS_DOT: Record<JobStatus, string> = {
  IDLE: "bg-gray-400",
  SUBMITTING: "bg-yellow-400 animate-pulse",
  IN_QUEUE: "bg-blue-400 animate-pulse",
  IN_PROGRESS: "bg-purple-500 animate-pulse",
  COMPLETED: "bg-green-500",
  FAILED: "bg-red-500",
};

const STATUS_LABEL: Record<JobStatus, string> = {
  IDLE: "Idle",
  SUBMITTING: "Submitting...",
  IN_QUEUE: "In Queue",
  IN_PROGRESS: "Generating...",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

export default function WanI2V() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { addToHistory } = useHistoryStore();

  const [prompt, setPrompt] = useState("The family of three just took a selfie. They lean in together, smiling and relaxed. The daughter holds the phone and shows the screen. All three look at it with interest. They laugh softly, pointing at the photo. Their faces are close, full of warmth. The background is still the same scenic place. Candid, joyful, cinematic style");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [size, setSize] = useState("1280*720");
  const [duration, setDuration] = useState(5);
  const [numSteps, setNumSteps] = useState(30);
  const [guidance, setGuidance] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [status, setStatus] = useState<JobStatus>("IDLE");
  const [jobId, setJobId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<"preview" | "json">("preview");
  const [rawJson, setRawJson] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [savedAssets, setSavedAssets] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const uploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        try {
          const res = await authorizedFetch("/api/image/upload", {
            method: "POST",
            body: JSON.stringify({ base64, filename: file.name, contentType: file.type || "image/jpeg" }),
          });
          const data = await res.json();
          if (data.success && data.url) resolve(data.url);
          else reject(new Error(data.error || "Upload gagal"));
        } catch (err: any) { reject(err); }
      };
      reader.onerror = () => reject(new Error("Gagal membaca file"));
      reader.readAsDataURL(file);
    });
  };

  const addFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 16 * 1024 * 1024) { showAlert("Ukuran file maksimal 16MB", "error"); return; }
    const newImg: UploadedImage = { preview: URL.createObjectURL(file), publicUrl: "", name: file.name, uploading: true };
    setImage(newImg);
    try {
      const url = await uploadImage(file);
      setImage(prev => prev ? { ...prev, publicUrl: url, uploading: false } : null);
    } catch (err: any) {
      setImage(prev => prev ? { ...prev, uploading: false, error: err.message } : null);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) addFile(file);
  };

  const removeImage = () => {
    if (image?.preview.startsWith("blob:")) URL.revokeObjectURL(image.preview);
    setImage(null);
  };

  useEffect(() => {
    if (!jobId || status === "COMPLETED" || status === "FAILED") {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await authorizedFetch(`/api/image/wan-i2v/status/${jobId}`);
        const data = await res.json();
        if (!data.success) return;
        setStatus(data.status as JobStatus);
        setRawJson(data.raw);
        if (data.status === "COMPLETED" && data.videoUrl) {
          setResultUrl(data.videoUrl);
          // Simpan ke history
          addToHistory({ toolName: "WAN Image to Video", input: prompt.slice(0, 80), output: data.videoUrl, type: "video" });
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === "FAILED") {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch { }
    }, 2500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [jobId, status]);

  const handleRun = async () => {
    if (!prompt.trim()) { showAlert("Prompt tidak boleh kosong", "error"); return; }
    if (!image) { showAlert("Upload gambar referensi", "error"); return; }
    if (image.uploading) { showAlert("Tunggu upload selesai", "error"); return; }
    if (image.error) { showAlert("Gambar gagal diupload", "error"); return; }
    setResultUrl(null); setRawJson(null); setJobId(null); setStatus("SUBMITTING");
    try {
      const res = await authorizedFetch("/api/image/wan-i2v/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: prompt.trim(), image: image.publicUrl, negative_prompt: negativePrompt, size, duration, num_inference_steps: numSteps, guidance }),
      });
      const data = await res.json();
      if (data.success && data.jobId) { setJobId(data.jobId); setStatus("IN_QUEUE"); }
      else throw new Error(data.error || "Gagal submit");
    } catch (err: any) { setStatus("FAILED"); showAlert(err.message || "Terjadi kesalahan", "error"); }
  };

  const handleReset = () => {
    if (image?.preview.startsWith("blob:")) URL.revokeObjectURL(image.preview);
    setImage(null); setPrompt(""); setResultUrl(null); setRawJson(null); setJobId(null); setStatus("IDLE");
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const res = await fetch(resultUrl, { mode: "cors" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `wan-i2v-${Date.now()}.mp4`;
      a.style.display = "none";
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 100);
      // Simpan ke assets list
      setSavedAssets(prev => [...prev, resultUrl]);
      showAlert("Video berhasil didownload dan disimpan ke assets!", "success");
    } catch {
      const a = document.createElement("a");
      a.href = resultUrl; a.download = `wan-i2v-${Date.now()}.mp4`; a.target = "_self";
      a.style.display = "none"; document.body.appendChild(a); a.click();
      setTimeout(() => document.body.removeChild(a), 100);
    }
  };

  const isRunning = status === "SUBMITTING" || status === "IN_QUEUE" || status === "IN_PROGRESS";
  const canRun = !!image && !image.uploading && !image.error && !!image.publicUrl && !!prompt.trim();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-[#0f1117] dark:text-white">
      {/* Top bar */}
      <div className="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-white/[0.07] dark:bg-[#111]">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold">Image to Video</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-white/10 dark:text-gray-400">WAN 2.1 720p</span>
          
        </div>
        <div className="w-24" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT */}
        <div className="flex w-full flex-col overflow-y-auto border-r border-gray-200 bg-white lg:w-[480px] dark:border-white/[0.07] dark:bg-[#111]">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 dark:border-white/[0.07]">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Input</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">3 Token per generate</span>
          </div>

          <div className="flex-1 space-y-4 p-4">
            {/* Prompt */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Prompt</label>
              <textarea
                value={prompt}
                onChange={e => { setPrompt(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                ref={el => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
                placeholder="Describe the motion and scene..."
                className="w-full resize-none overflow-hidden rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500/50 focus:outline-none min-h-[80px] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-gray-600"
                style={{ height: "auto" }}
              />
            </div>

            {/* Negative Prompt */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Negative prompt</label>
              <input
                type="text"
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                placeholder="What to avoid..."
                className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500/50 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-gray-600"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Duration</label>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-600">Duration in seconds</p>
              <div className="flex gap-2">
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${duration === d ? "border-blue-500/50 bg-blue-500/10 text-blue-500 dark:text-blue-400" : "border-gray-300 bg-gray-50 text-gray-600 hover:border-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:border-white/20"}`}>
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Image <span className="text-red-400">*</span>
              </label>
              {image ? (
                <div className="mb-2 flex items-center gap-3 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                  <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded">
                    <img src={image.preview} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs text-gray-600 dark:text-gray-300">{image.uploading ? "Uploading..." : image.error ? image.error : image.publicUrl || image.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {image.uploading && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />}
                    {image.error && <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                    {!image.uploading && !image.error && <div className="h-2 w-2 rounded-full bg-green-500" />}
                    <button onClick={removeImage} className="text-gray-500 transition hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 transition ${isDragging ? "border-blue-500 bg-blue-500/10" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/5"}`}
                >
                  <Plus className="h-5 w-5 text-gray-500" />
                  <span className="text-xs text-gray-500">Upload or drag and drop</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-600">jpeg, jpg, png up to 16MB (single file)</p>
            </div>

            {/* Additional Settings */}
            <div className="rounded-lg border border-gray-300 dark:border-white/10">
              <button type="button" onClick={() => setShowSettings(!showSettings)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                <span>Additional settings</span>
                {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showSettings && (
                <div className="space-y-4 border-t border-gray-200 px-4 py-4 dark:border-white/10">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">Size</label>
                    <div className="flex flex-col gap-2">
                      {SIZES.map(s => (
                        <button key={s.value} onClick={() => setSize(s.value)}
                          className={`rounded-lg border px-3 py-2 text-left text-sm transition ${size === s.value ? "border-blue-500/50 bg-blue-500/10 text-blue-500 dark:text-blue-400" : "border-gray-300 bg-gray-50 text-gray-600 hover:border-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:border-white/20"}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Inference Steps: {numSteps}</label>
                    <input type="range" min={10} max={50} value={numSteps} onChange={e => setNumSteps(Number(e.target.value))}
                      className="w-full accent-blue-500" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Guidance: {guidance}</label>
                    <input type="range" min={1} max={10} step={0.5} value={guidance} onChange={e => setGuidance(Number(e.target.value))}
                      className="w-full accent-blue-500" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-4 py-3 dark:border-white/[0.07]">
            <button onClick={handleReset} disabled={isRunning}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:text-gray-900 disabled:opacity-40 dark:border-white/10 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-white">
              Reset
            </button>
            <button onClick={handleRun} disabled={isRunning || !canRun}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-40">
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
              {isRunning ? STATUS_LABEL[status] : "Run"}
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-1 flex-col bg-gray-50 dark:bg-[#0f1117]">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 dark:border-white/[0.07]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Result</span>
              <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 dark:bg-white/5">
                <div className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{STATUS_LABEL[status]}</span>
              </div>
            </div>
            {resultUrl && (
              <div className="flex items-center gap-2">
                <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-white/10">
                  <button onClick={() => setResultTab("preview")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition ${resultTab === "preview" ? "bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white" : "text-gray-500 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white"}`}>
                    <Play className="h-3.5 w-3.5" /> Preview
                  </button>
                  <button onClick={() => setResultTab("json")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition ${resultTab === "json" ? "bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white" : "text-gray-500 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white"}`}>
                    <FileImage className="h-3.5 w-3.5" /> JSON
                  </button>
                </div>
                <button onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition">
                  <Download className="h-3.5 w-3.5" /> Download video
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-1 items-center justify-center overflow-auto p-4">
            {resultUrl && resultTab === "preview" ? (
              <div className="relative w-full max-w-3xl">
                <video ref={videoRef} src={resultUrl} controls autoPlay loop
                  className="w-full rounded-xl shadow-2xl bg-black"
                  style={{ maxHeight: "calc(100vh - 120px)" }}
                />
              </div>
            ) : resultUrl && resultTab === "json" ? (
              <div className="w-full max-w-2xl">
                <pre className="max-h-[calc(100vh-160px)] overflow-auto rounded-xl bg-white p-4 text-xs text-emerald-700 shadow-sm ring-1 ring-gray-200 dark:bg-white/5 dark:text-green-400 dark:ring-0">
                  {JSON.stringify(rawJson, null, 2)}
                </pre>
              </div>
            ) : isRunning ? (
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full border-4 border-white/10" />
                  <div className="absolute inset-0 h-20 w-20 animate-spin rounded-full border-4 border-transparent border-t-blue-500" />
                  <div className="absolute inset-3 flex items-center justify-center">
                    <Film className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{STATUS_LABEL[status]}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Biasanya 30–120 detik, harap tunggu...</p>
                </div>
                <div className="w-64 overflow-hidden rounded-full bg-white/10">
                  <div className="h-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000"
                    style={{ width: status === "IN_PROGRESS" ? "75%" : status === "IN_QUEUE" ? "35%" : "10%" }} />
                </div>
              </div>
            ) : status === "FAILED" ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">Generation Failed</p>
                <button onClick={() => setStatus("IDLE")} className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:text-gray-900 dark:border-white/10 dark:text-gray-400 dark:hover:text-white">
                  <RefreshCw className="h-4 w-4" /> Coba Lagi
                </button>
              </div>
            ) : (
              <div className="relative flex flex-col items-center justify-center h-full w-full max-w-3xl">
                <video src="https://image.runpod.ai/preview/alibaba/wan-2-1-i2v-720.mp4"
                  autoPlay loop muted playsInline
                  className="w-full rounded-2xl opacity-60 shadow-2xl"
                  style={{ maxHeight: "calc(100vh - 160px)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-2xl" />
                <div className="absolute bottom-6 left-0 right-0 text-center">
                  <p className="text-sm font-semibold text-white mb-1">Contoh hasil Image to Video</p>
                  <p className="text-xs text-gray-300">Upload gambar + tulis prompt → klik Run</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
