import { createClient } from '@/app/utils/supabase/server';
import { redirect } from 'next/navigation';
import Header from '../components/Header';
import WalletSection from './wallet-section';
import { BadgeDollarSign, History, Receipt } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    // Fetch Profile for Balance and Settings
    const { data: profile } = await supabase
        .from('profiles')
        .select('balance, is_admin, allow_overdraft, auto_topup')
        .eq('id', user.id)
        .single();

    // Fetch Chat Usage History
    const { data: chats } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

    // Fetch Transactions
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

    const balance = Number(profile?.balance || 0);

    return (
        <div className="min-h-screen bg-zinc-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <Header />
            <div className="mx-auto max-w-6xl space-y-12">
                <header className="text-center">
                    <h1 className="text-3xl font-bold leading-tight tracking-tight text-white font-heading">Billing & Usage</h1>
                    <p className="mt-2 text-sm text-zinc-400">Manage your credits, configure billing, and view history.</p>
                </header>

                {/* Wallet / Balance Section */}
                <WalletSection
                    balance={balance}
                    allowOverdraft={profile?.allow_overdraft || false}
                    autoTopup={profile?.auto_topup || false}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Usage History */}
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2">
                            <History className="h-5 w-5 text-indigo-400" />
                            <h3 className="text-lg font-medium text-white">Recent Usage</h3>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-white/5 bg-zinc-900/30">
                            <table className="min-w-full divide-y divide-white/5">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Model</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {chats && chats.length > 0 ? chats.map((chat) => (
                                        <tr key={chat.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                                                {new Date(chat.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                <span className="inline-flex items-center rounded-md bg-indigo-400/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-400/20">
                                                    {chat.model}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-zinc-300">
                                                ${Number(chat.final_cost).toFixed(4)}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-sm text-zinc-500">
                                                No usage recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2">
                            <Receipt className="h-5 w-5 text-emerald-400" />
                            <h3 className="text-lg font-medium text-white">Transaction History</h3>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-white/5 bg-zinc-900/30">
                            <table className="min-w-full divide-y divide-white/5">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {transactions && transactions.length > 0 ? transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                                                {new Date(tx.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${tx.status === 'succeeded'
                                                    ? 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20'
                                                    : 'bg-zinc-400/10 text-zinc-400 ring-zinc-400/20'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-white">
                                                +${Number(tx.amount).toFixed(2)}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-sm text-zinc-500">
                                                No transactions found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
