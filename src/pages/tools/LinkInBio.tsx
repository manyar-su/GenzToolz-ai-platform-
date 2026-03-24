import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ExternalLink, Copy, Check, Smartphone } from 'lucide-react';

export default function LinkInBio() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('@username');
  const [bio, setBio] = useState('Digital Creator | Content Enthusiast');
  const [links, setLinks] = useState<{title: string, url: string}[]>([
    { title: 'Instagram', url: 'https://instagram.com' },
    { title: 'TikTok', url: 'https://tiktok.com' }
  ]);
  const [copied, setCopied] = useState(false);

  const addLink = () => {
    setLinks([...links, { title: 'New Link', url: 'https://' }]);
  };

  const removeLink = (index: number) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    setLinks(newLinks);
  };

  const updateLink = (index: number, field: 'title' | 'url', value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const generateHTML = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${username} - Link in Bio</title>
    <style>
        body { font-family: sans-serif; background: #f3f4f6; display: flex; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
        .container { background: white; padding: 40px; border-radius: 20px; width: 100%; max-width: 400px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .avatar { width: 100px; height: 100px; background: linear-gradient(to right, #3b82f6, #8b5cf6); border-radius: 50%; margin: 0 auto 20px; }
        h1 { margin: 0 0 10px; font-size: 24px; color: #111827; }
        p { margin: 0 0 30px; color: #6b7280; font-size: 14px; }
        .link { display: block; background: #f9fafb; color: #111827; text-decoration: none; padding: 16px; margin-bottom: 12px; border-radius: 12px; font-weight: 600; transition: all 0.2s; border: 1px solid #e5e7eb; }
        .link:hover { background: #eff6ff; border-color: #3b82f6; color: #2563eb; transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="container">
        <div class="avatar"></div>
        <h1>${username}</h1>
        <p>${bio}</p>
        <div class="links">
            ${links.map(l => `<a href="${l.url}" target="_blank" class="link">${l.title}</a>`).join('')}
        </div>
    </div>
</body>
</html>`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateHTML());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="mx-auto max-w-6xl">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center rounded-lg bg-green-500 px-4 py-2 text-white shadow-md transition hover:bg-green-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Editor */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Mini Link-in-Bio Builder</h1>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Profile Info</h3>
                <div>
                  <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Username / Nama</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Bio Singkat</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    rows={2}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Links</h3>
                  <button onClick={addLink} className="flex items-center text-sm text-blue-600 hover:underline">
                    <Plus className="mr-1 h-4 w-4" /> Add Link
                  </button>
                </div>
                
                {links.map((link, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={link.title}
                        onChange={(e) => updateLink(idx, 'title', e.target.value)}
                        placeholder="Judul Link"
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => updateLink(idx, 'url', e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <button 
                      onClick={() => removeLink(idx)}
                      className="mt-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={handleCopyCode}
                  className="flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800"
                >
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? 'Kode HTML Tersalin!' : 'Salin Kode HTML'}
                </button>
                <p className="mt-2 text-center text-xs text-gray-500">
                  Salin kode ini dan simpan sebagai file .html untuk di-hosting gratis (misal: di GitHub Pages atau Netlify).
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex justify-center">
            <div className="relative h-[600px] w-[320px] overflow-hidden rounded-[40px] border-8 border-gray-900 bg-gray-50 shadow-2xl">
              <div className="absolute top-0 left-1/2 h-6 w-32 -translate-x-1/2 rounded-b-xl bg-gray-900"></div>
              
              <div className="h-full overflow-y-auto p-6 pt-12 text-center">
                <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-md"></div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">{username}</h2>
                <p className="mb-8 text-sm text-gray-600">{bio}</p>
                
                <div className="space-y-3">
                  {links.map((link, idx) => (
                    <a
                      key={idx}
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="block rounded-xl border border-gray-200 bg-white p-4 font-semibold text-gray-800 shadow-sm transition hover:scale-[1.02] hover:shadow-md"
                    >
                      {link.title}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
