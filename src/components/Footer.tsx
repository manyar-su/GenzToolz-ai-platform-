import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-[#0a0a0a] px-6 py-8 mt-auto">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-white">VerteX</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Platform AI tools lengkap untuk content creator Indonesia. 30+ tools berbasis AI.
            </p>
          </div>

          {/* Tools */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Tools</p>
            <ul className="space-y-2">
              {[
                { label: 'Script Architect', path: '/tools/script-architect' },
                { label: 'Viral Hook Generator', path: '/tools/viral-hook-generator' },
                { label: 'Text to Image AI', path: '/tools/text-to-image' },
                { label: 'Caption Generator', path: '/tools/caption-generator' },
                { label: 'Semua Tools', path: '/tools' },
              ].map(item => (
                <li key={item.path}>
                  <Link to={item.path} className="text-xs text-gray-400 hover:text-gray-300 transition">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Platform</p>
            <ul className="space-y-2">
              {[
                { label: 'Dashboard', path: '/' },
                { label: 'Downloader', path: '/downloader' },
                { label: 'Affiliate Program', path: '/affiliate' },
                { label: 'Top Up Token', path: '/topup' },
                { label: 'Profile', path: '/profile' },
              ].map(item => (
                <li key={item.path}>
                  <Link to={item.path} className="text-xs text-gray-400 hover:text-gray-300 transition">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Legal & Support</p>
            <ul className="space-y-2">
              {[
                { label: 'Privacy Policy', path: '/privacy-policy' },
                { label: 'Syarat & Ketentuan', path: '/terms-of-service' },
                { label: 'FAQ', path: '/faq' },
                { label: 'Hubungi Kami', path: '/contact' },
              ].map(item => (
                <li key={item.path}>
                  <Link to={item.path} className="text-xs text-gray-400 hover:text-gray-300 transition">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-300">© {year} VerteX. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="text-xs text-gray-300 hover:text-gray-400 transition">Privacy</Link>
            <Link to="/terms-of-service" className="text-xs text-gray-300 hover:text-gray-400 transition">Terms</Link>
            <Link to="/faq" className="text-xs text-gray-300 hover:text-gray-400 transition">FAQ</Link>
            <Link to="/contact" className="text-xs text-gray-300 hover:text-gray-400 transition">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
