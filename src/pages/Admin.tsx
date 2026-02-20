import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { Lock, UserCheck, PlusCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { adminLogin, isLoggedIn, logout } = useUserStore();
  const navigate = useNavigate();
  
  // Use local state for admin check because isLoggedIn might be true for Guest
  // But useUserStore stores 'name' as 'Admin' when logged in as admin.
  // We can rely on that or a specific role if we added one.
  const isAdmin = useUserStore(state => state.name === 'Admin');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [targetUserId, setTargetUserId] = useState('');
  const [amount, setAmount] = useState(10);
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await adminLogin(username, password);
    if (!success) {
      setError('Invalid credentials');
    } else {
      setError('');
    }
  };

  const handleAddTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setError('');

    try {
      // Direct call to Supabase or backend endpoint for adding tokens
      // Since we don't have a dedicated endpoint yet in this file, we'll assume one exists or use a mock
      // In a real app, this should be a protected API call
      
      const response = await fetch('/api/admin/add-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ userId: targetUserId, amount: Number(amount) })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccessMsg(`Successfully added ${amount} tokens to user ${targetUserId}`);
        setTargetUserId('');
        setAmount(10);
      } else {
        setError(data.error || 'Failed to add tokens');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Admin Login
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Please sign in to access the admin panel
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="-space-y-px rounded-md shadow-sm">
              <div>
                <input
                  type="text"
                  required
                  className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div>
              <button
                type="submit"
                className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-blue-500 group-hover:text-blue-400" aria-hidden="true" />
                </span>
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <button 
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-blue-600" />
          Add Tokens to User
        </h2>

        <form onSubmit={handleAddTokens} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User ID (Unique Code)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. genz-15688"
              className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount to Add
            </label>
            <input
              type="number"
              required
              min="1"
              className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {successMsg && <p className="text-green-500 text-sm">{successMsg}</p>}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Tokens
          </button>
        </form>
      </div>
    </div>
  );
}
