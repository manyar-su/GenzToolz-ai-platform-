import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Play, Pause, Music, Download } from 'lucide-react';

export default function AudioVisualizer() {
  const navigate = useNavigate();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();
  const analyzerRef = useRef<AnalyserNode>();
  const sourceRef = useRef<MediaElementAudioSourceNode>();
  const audioContextRef = useRef<AudioContext>();

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.src = URL.createObjectURL(file);
      }
    }
  };

  const initAudio = () => {
    if (!audioRef.current || !canvasRef.current || analyzerRef.current) return;

    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    analyzerRef.current = audioContextRef.current.createAnalyser();
    
    sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
    sourceRef.current.connect(analyzerRef.current);
    analyzerRef.current.connect(audioContextRef.current.destination);
    
    analyzerRef.current.fftSize = 256;
  };

  const draw = () => {
    if (!canvasRef.current || !analyzerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyzerRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      analyzerRef.current!.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#f9fafb'; // bg-gray-50
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        // Gradient color
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#2563eb'); // blue-600
        gradient.addColorStop(1, '#60a5fa'); // blue-400

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight / 1.5, barWidth, barHeight / 1.5);

        x += barWidth + 1;
      }
    };

    animate();
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (!audioContextRef.current) {
      initAudio();
      draw();
    }

    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="mx-auto max-w-4xl">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </button>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
          <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Audio Visualizer</h1>
          
          <div className="mb-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            {!audioFile ? (
              <>
                <div className="mb-4 rounded-full bg-blue-100 p-4 text-blue-600">
                  <Music className="h-8 w-8" />
                </div>
                <label className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700">
                  Upload Audio File
                  <input 
                    type="file" 
                    accept="audio/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </label>
                <p className="mt-2 text-sm text-gray-500">MP3, WAV, AAC (Max 10MB)</p>
              </>
            ) : (
              <div className="w-full">
                <div className="mb-6 flex items-center justify-center">
                  <span className="font-medium text-gray-900 dark:text-white">{audioFile.name}</span>
                  <button 
                    onClick={() => setAudioFile(null)}
                    className="ml-2 text-sm text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="relative mb-6 overflow-hidden rounded-xl bg-gray-100 shadow-inner">
                  <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={300} 
                    className="h-[300px] w-full"
                  />
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-4">
                    <button
                      onClick={togglePlay}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="ml-1 h-6 w-6" />}
                    </button>
                  </div>
                </div>

                <audio 
                  ref={audioRef} 
                  onEnded={() => setIsPlaying(false)} 
                  className="hidden" 
                />

                <div className="mt-4 flex justify-center">
                   <button
                    disabled
                    className="flex cursor-not-allowed items-center text-gray-400"
                   >
                     <Download className="mr-2 h-4 w-4" /> Download Video (Coming Soon)
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
