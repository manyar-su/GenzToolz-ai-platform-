import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AlertProvider } from "@/context/AlertContext";
import { useEffect, Component, type ReactNode } from 'react';
import { useUserStore } from "@/store/useUserStore";
import Layout from "@/components/Layout";
import SupabaseCheck from "@/components/SupabaseCheck";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import History from "@/pages/History";
import Admin from "@/pages/Admin";
import Topup from "@/pages/Topup";
import Tools from "@/pages/Tools";

// Tools
import ScriptArchitect from "@/pages/tools/ScriptArchitect";
import TrendAnalyzer from "@/pages/tools/TrendAnalyzer";
import CaptionGenerator from "@/pages/tools/CaptionGenerator";
import VideoToShort from "@/pages/tools/VideoToShort";
import AudioVisualizer from "@/pages/tools/AudioVisualizer";
import TextToVisual from "@/pages/tools/TextToVisual";
import AllInOneDownloader from "@/pages/tools/AllInOneDownloader";
import TextToSpeech from "@/pages/tools/TextToSpeech";
import ViralHookGenerator from "@/pages/tools/ViralHookGenerator";
import YouTubeSEO from "@/pages/tools/YouTubeSEO";
import CommentReply from "@/pages/tools/CommentReply";
import ColorPalette from "@/pages/tools/ColorPalette";
import SchedulerSuggestion from "@/pages/tools/SchedulerSuggestion";
import LinkInBio from "@/pages/tools/LinkInBio";
import PodcastToShorts from "@/pages/tools/PodcastToShorts";
import CompetitorAnalyzer from "@/pages/tools/CompetitorAnalyzer";
import SubtitleGenerator from "@/pages/tools/SubtitleGenerator";
import BrandPitch from "@/pages/tools/BrandPitch";
import AffiliateHunter from "@/pages/tools/AffiliateHunter";
import Affiliate from "@/pages/Affiliate";
import ReplyMaster from "@/pages/tools/ReplyMaster";
import GiveawayPicker from "@/pages/tools/GiveawayPicker";
import PollGenerator from "@/pages/tools/PollGenerator";
import ShadowbanChecker from "@/pages/tools/ShadowbanChecker";
import BioOptimizer from "@/pages/tools/BioOptimizer";
import ThumbnailTester from "@/pages/tools/ThumbnailTester";
import ColorGrading from "@/pages/tools/ColorGrading";
import SmartVideoClipper from "@/pages/tools/SmartVideoClipper";
import ObjectRemover from "@/pages/tools/ObjectRemover";
import WatermarkRemover from "@/pages/tools/WatermarkRemover";
import TikTokDownloader from "@/pages/tools/TikTokDownloader";
import YouTubeMusicDownloader from "@/pages/tools/YouTubeMusicDownloader";
import SpotifyDownloader from "@/pages/tools/SpotifyDownloader";
import Downloader from "@/pages/Downloader";

// Error Boundary
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8 text-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Terjadi Kesalahan</h1>
            <p className="text-gray-500 mb-4">{this.state.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  console.log('App component rendering...');
  const { initializeGuest } = useUserStore();

  useEffect(() => {
    initializeGuest();
  }, [initializeGuest]);

  return (
    <ErrorBoundary>
      <AlertProvider>
        <Router>
          <Layout>
          <Routes>            <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/history" element={<History />} />
          <Route path="/admin" element={<Admin />} />
          
          {/* Tool Routes */}
          <Route path="/tools/script-architect" element={<ScriptArchitect />} />
          <Route path="/tools/trend-analyzer" element={<TrendAnalyzer />} />
          <Route path="/tools/caption-generator" element={<CaptionGenerator />} />
          <Route path="/tools/video-to-short" element={<VideoToShort />} />
          <Route path="/tools/audio-visualizer" element={<AudioVisualizer />} />
          <Route path="/tools/text-to-visual" element={<TextToVisual />} />
          <Route path="/tools/downloader" element={<AllInOneDownloader />} />
          <Route path="/tools/text-to-speech" element={<TextToSpeech />} />
          
          {/* New Tools */}
          <Route path="/tools/viral-hook-generator" element={<ViralHookGenerator />} />
          <Route path="/tools/youtube-seo" element={<YouTubeSEO />} />
          <Route path="/tools/comment-reply" element={<CommentReply />} />
          <Route path="/tools/color-palette" element={<ColorPalette />} />
          <Route path="/tools/scheduler-suggestion" element={<SchedulerSuggestion />} />
          <Route path="/tools/link-in-bio" element={<LinkInBio />} />
          
          {/* New Batch Tools */}
          <Route path="/tools/podcast-to-shorts" element={<PodcastToShorts />} />
          <Route path="/tools/competitor-analyzer" element={<CompetitorAnalyzer />} />
          <Route path="/tools/subtitle-generator" element={<SubtitleGenerator />} />
          <Route path="/tools/brand-pitch" element={<BrandPitch />} />
          <Route path="/tools/affiliate-hunter" element={<AffiliateHunter />} />
          <Route path="/tools/reply-master" element={<ReplyMaster />} />
          <Route path="/tools/giveaway-picker" element={<GiveawayPicker />} />
          <Route path="/tools/poll-generator" element={<PollGenerator />} />
          <Route path="/tools/shadowban-checker" element={<ShadowbanChecker />} />
          <Route path="/tools/bio-optimizer" element={<BioOptimizer />} />
          <Route path="/tools/thumbnail-tester" element={<ThumbnailTester />} />
          <Route path="/tools/color-grading" element={<ColorGrading />} />
          <Route path="/tools/smart-clipper" element={<SmartVideoClipper />} />
          
          <Route path="/tools/object-remover" element={<ObjectRemover />} />
          <Route path="/tools/watermark-remover" element={<WatermarkRemover />} />
          <Route path="/tools/voice-cloning" element={<div className="text-center mt-20 text-xl font-bold text-gray-500">Feature Coming Soon (Requires GPU)</div>} />
          
          <Route path="/affiliate" element={<Affiliate />} />
          <Route path="/topup" element={<Topup />} />
          <Route path="/downloader" element={<Downloader />} />
          <Route path="/tools/tiktok-downloader" element={<TikTokDownloader />} />
          <Route path="/tools/youtube-music-downloader" element={<YouTubeMusicDownloader />} />
          <Route path="/tools/spotify-downloader" element={<SpotifyDownloader />} />
          <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
        </Routes>
        </Layout>
        </Router>
        <PWAInstallPrompt />
      </AlertProvider>
    </ErrorBoundary>
  );
}
