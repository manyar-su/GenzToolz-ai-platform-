import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Play, Pause, Download, Info, RotateCcw } from 'lucide-react';

export default function TextToSpeech() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Try to find an Indonesian voice by default, or fallback to English
      const indoVoice = availableVoices.find(v => v.lang.includes('id-ID'));
      if (indoVoice) {
        setSelectedVoice(indoVoice.name);
      } else if (availableVoices.length > 0) {
        setSelectedVoice(availableVoices[0].name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeak = () => {
    if (!text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    
    utterance.pitch = pitch;
    utterance.rate = rate;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleReset = () => {
    setText('');
    handleStop();
  };

  if (!supported) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">Browser Tidak Mendukung</h2>
          <p className="mt-2 text-gray-600">Maaf, browser Anda tidak mendukung fitur Text-to-Speech.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center rounded-lg bg-green-500 px-4 py-2 text-white shadow-md transition hover:bg-green-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </button>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
              <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Text to Speech</h1>
              
              <div className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                <div className="flex items-start">
                  <Info className="mr-2 h-5 w-5 flex-shrink-0" />
                  <p>
                    <strong>Cara Penggunaan:</strong> Masukkan teks yang ingin diubah menjadi suara. 
                    Pilih jenis suara (Pria/Wanita tergantung sistem Anda) dan atur nada bicara.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Teks Input
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Ketik atau tempel teks di sini..."
                    className="w-full rounded-lg border border-gray-300 p-4 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    rows={8}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Pilih Suara
                    </label>
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      {voices.map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Kecepatan (Rate): {rate}x
                      </label>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="2" 
                        step="0.1" 
                        value={rate}
                        onChange={(e) => setRate(parseFloat(e.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Nada (Pitch): {pitch}
                      </label>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="2" 
                        step="0.1" 
                        value={pitch}
                        onChange={(e) => setPitch(parseFloat(e.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls & Status */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white shadow-lg">
              <div className="mb-8 flex items-center justify-center">
                <div className={`relative flex h-32 w-32 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ${isSpeaking ? 'animate-pulse' : ''}`}>
                  <Volume2 className={`h-16 w-16 ${isSpeaking ? 'text-white' : 'text-white/80'}`} />
                  {isSpeaking && (
                    <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {isSpeaking ? (
                  <button
                    onClick={handleStop}
                    className="flex items-center justify-center rounded-lg bg-white px-6 py-4 font-bold text-emerald-600 transition hover:bg-gray-50 active:scale-95"
                  >
                    <Pause className="mr-2 h-5 w-5" /> Stop
                  </button>
                ) : (
                  <button
                    onClick={handleSpeak}
                    disabled={!text}
                    className="flex items-center justify-center rounded-lg bg-white px-6 py-4 font-bold text-emerald-600 transition hover:bg-gray-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="mr-2 h-5 w-5" /> Mulai Bicara
                  </button>
                )}
                
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center rounded-lg bg-emerald-700/50 px-6 py-4 font-semibold text-white transition hover:bg-emerald-700/70"
                >
                  <RotateCcw className="mr-2 h-5 w-5" /> Reset
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
              <h3 className="mb-2 font-bold text-gray-900 dark:text-white">Info Suara</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Fitur ini menggunakan sistem suara bawaan perangkat Anda.
                Kualitas dan pilihan suara (Pria/Wanita) bergantung pada sistem operasi (Windows/Mac/Android/iOS) yang Anda gunakan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
