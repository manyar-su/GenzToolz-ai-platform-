import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useUserStore } from './useUserStore';

interface TokenTransfer {
  id: string;
  type: 'in' | 'out';
  amount: number;
  partner: string; // Sender or Receiver Name
  message: string;
  date: string;
}

interface TokenState {
  tokens: number;
  transactions: TokenTransfer[];
  loading: boolean;
  
  fetchBalance: () => Promise<void>;
  deductToken: (amount?: number) => Promise<boolean>;
  addToken: (amount: number) => Promise<void>; // Only for simulated Top-up in this context
  transferToken: (receiverCode: string, amount: number, message: string) => Promise<{ success: boolean; message: string }>;
}

export const useTokenStore = create<TokenState>((set, get) => ({
  tokens: 0,
  transactions: [],
  loading: false,

  fetchBalance: async () => {
    const userId = useUserStore.getState().id;
    if (!userId) return;

    const { data, error } = await supabase
        .from('profiles')
        .select('balance_tokens')
        .eq('id', userId)
        .single();
    
    if (data) {
        set({ tokens: data.balance_tokens });
    }
  },

  deductToken: async (amount = 1) => {
    const userId = useUserStore.getState().id;
    const currentTokens = get().tokens;

    // Check Balance Local (Optimistic)
    if (!userId || currentTokens < amount) return false;

    // Optimistic Update (Server handles actual DB deduction via RPC)
    set({ tokens: currentTokens - amount });
    
    // We rely on the server response to confirm the transaction.
    // If the server returns 402, the UI handles it.
    // Ideally, we should sync with server balance periodically.
    return true;
  },

  addToken: async (amount) => {
    // This is primarily for Top-Up simulation
    const userId = useUserStore.getState().id;
    if (!userId) return;
    
    const currentTokens = get().tokens;
    
    // In a real app, we would create a transaction record here
    // For now, we update profile directly
    const { error } = await supabase
        .from('profiles')
        .update({ balance_tokens: currentTokens + amount })
        .eq('id', userId);

    if (!error) {
        set({ tokens: currentTokens + amount });
    }
  },

  transferToken: async (receiverCode, amount, message) => {
    set({ loading: true });
    
    try {
        const { data, error } = await supabase.rpc('transfer_tokens', {
            p_receiver_code: receiverCode,
            p_amount: amount,
            p_message: message
        });

        set({ loading: false });

        if (error) throw error;

        if (data && data.success) {
            // Refresh balance
            await get().fetchBalance();
            return { success: true, message: 'Transfer Berhasil!' };
        } else {
            return { success: false, message: data?.message || 'Transfer Gagal' };
        }

    } catch (err: any) {
        set({ loading: false });
        return { success: false, message: err.message || 'Terjadi kesalahan sistem' };
    }
  }
}));
