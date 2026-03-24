import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useTokenStore } from '@/store/useTokenStore';
import {
  Lock, UserCheck, PlusCircle, LogOut, Coins, Search,
  CheckCircle, AlertTriangle, Eye, EyeOff, Users, X,
  RefreshCw, ChevronDown, Minus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  user_code: string;
  balance_tokens: number;
  created_at?: string;
}

const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

export default function Admin() {
  const { adminLogin, logout } = useUserStore();
  const { fetchBalance } = useTokenStore();
  const navigate = useNavigate();
  const isAdmin = useUserStore(state => state.name === 'Admin');

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Users list state
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // Modal state
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState(10);
  const [isDeduct, setIsDeduct] = useState(false);
  const [transferMsg, setTransferMsg] = useState({ type: '', text: '' });
  const [isTransferring, setIsTransferring] = useState(false);

  const fetchUsers = useCallback(async (query = '') => {
    setIsLoading(true);
    try {
      const url = `/api/auth/search-users?query=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
        setTotalCount(data.data?.length || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchBalance();
      fetchUsers();
    }
  }, [isAdmin, fetchBalance, fetchUsers]);

  // Debounced search
  useEffect(() => {
    if (!isAdmin) return;
    const t = setTimeout(() => fetchUsers(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery, isAdmin, fetchUsers]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await adminLogin(username, password);
    if (!success) setLoginError('Invalid credentials');
    else setLoginError('');
  };

  const openModal = (user: UserRow) => {
    setSelectedUser(user);
    setAmount(10);
    setIsDeduct(false);
    setTransferMsg({ type: '', text: '' });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || amount <= 0) return;
    setIsTransferring(true);
    setTransferMsg({ type: '', text: '' });

    try {
      const finalAmount = isDeduct ? -Math.abs(amount) : Math.abs(amount);
      const res = await fetch('/api/auth/admin-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ receiver_identifier: selectedUser.id, amount: finalAmount })
      });
      const data = await res.json();

      if (data.success) {
        const newBalance = (selectedUser.balance_tokens || 0) + finalAmount;
        const updated = { ...selectedUser, balance_tokens: Math.max(0, newBalance) };
        setSelectedUser(updated);
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
        setTransferMsg({
          type: 'success',
          text: `${isDeduct ? 'Dikurangi' : 'Ditambahkan'} ${Math.abs(amount)} token ke ${selectedUser.full_name || selectedUser.user_code}`
        });
        setAmount(10);
      } else {
        setTransferMsg({ type: 'error', text: data.error || 'Gagal' });
      }
    } catch (err: any) {
      setTransferMsg({ type: 'error', text: err.message });
    } finally {
      setIsTransferring(false);
    }
  };

  // ─── Login Form ───────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-lg">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Login</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Sign in to access the admin panel</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              required
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 pr-10 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
            <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 transition-colors">
              <Lock className="h-4 w-4" /> Sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Admin Dashboard ──────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{totalCount} pengguna terdaftar</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-3 py-1.5 rounded-full text-sm font-medium">
            <Coins className="w-4 h-4" />
            <span>Admin Vault: Unlimited</span>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {/* Search & Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        {/* Table Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Pengguna</h2>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama, email, kode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => fetchUsers(searchQuery)}
              disabled={isLoading}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Pengguna</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Kode</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Email</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Token</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Tidak ada pengguna ditemukan</p>
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr
                    key={user.id}
                    onClick={() => openModal(user)}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(user.full_name || user.email || '?')[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                          {user.full_name || 'No Name'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        {user.user_code || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                      {user.email || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        user.balance_tokens > 0
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}>
                        <Coins className="w-3 h-3" />
                        {user.balance_tokens ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={e => { e.stopPropagation(); openModal(user); }}
                        className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-all"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Kelola
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {users.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
            Menampilkan {users.length} pengguna
          </div>
        )}
      </div>

      {/* Token Modal */}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {(selectedUser.full_name || selectedUser.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedUser.full_name || 'No Name'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Current Balance */}
              <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-900/50 px-4 py-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">Saldo saat ini</span>
                <div className="flex items-center gap-1.5 text-lg font-bold text-gray-900 dark:text-white">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  {selectedUser.balance_tokens ?? 0} Token
                </div>
              </div>

              {/* Add / Deduct Toggle */}
              <div className="flex rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                <button
                  onClick={() => setIsDeduct(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                    !isDeduct ? 'bg-green-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" /> Tambah Kredit
                </button>
                <button
                  onClick={() => setIsDeduct(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                    isDeduct ? 'bg-red-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Minus className="w-4 h-4" /> Kurangi Kredit
                </button>
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jumlah Token</label>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {QUICK_AMOUNTS.map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                        amount === val
                          ? isDeduct ? 'bg-red-600 text-white border-red-600' : 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-4 py-2.5 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Jumlah custom..."
                  />
                </div>
              </div>

              {/* Feedback */}
              {transferMsg.text && (
                <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                  transferMsg.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  {transferMsg.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                  {transferMsg.text}
                </div>
              )}

              {/* Submit */}
              <form onSubmit={handleTransfer}>
                <button
                  type="submit"
                  disabled={isTransferring || amount <= 0}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-colors disabled:opacity-50 ${
                    isDeduct ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isTransferring ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : isDeduct ? (
                    <><Minus className="w-4 h-4" /> Kurangi {amount} Token</>
                  ) : (
                    <><PlusCircle className="w-4 h-4" /> Tambah {amount} Token</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
