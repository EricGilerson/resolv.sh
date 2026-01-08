
import { createClient } from '@/app/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ShieldCheck, Calendar, Clock, CreditCard, Activity, ArrowUpRight } from 'lucide-react';
import Header from '../components/Header';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    // 1. Fetch Profile for Balance
    const { data: profile } = await supabase
        .from('profiles')
        .select('balance, is_admin')
        .eq('id', user.id)
        .single();

    // 2. Fetch Usage Stats (Total Spend)
    // In a real app, you might want to aggregate this in SQL or an Edge Function for performance.
    // tailored to "This Month".
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usageData } = await supabase
        .from('chats')
        .select('final_cost')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

    const totalSpentThisMonth = usageData?.reduce((acc, curr) => acc + Number(curr.final_cost), 0) || 0;

    // 3. Fetch Recent Activity (Mixed Chats and Transactions? Just Chats for now)
    const { data: recentChats } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

    return (
        <div className="min-h-screen bg-zinc-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <Header />
            <div className="mx-auto max-w-7xl">
                <header className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold leading-tight tracking-tight text-white font-heading">Dashboard</h1>
                        <p className="mt-2 text-sm text-zinc-400">Welcome back, {user.email?.split('@')[0]}.</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link href="/billing">
                            <button className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25">
                                <CreditCard className="mr-2 h-4 w-4" />
                                Manage Billing
                            </button>
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* User Profile Card */}
                    <div className="col-span-1 rounded-2xl bg-zinc-900/50 p-6 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
                                {user.email?.[0].toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{user.email?.split('@')[0]}</h2>
                                <p className="text-sm text-zinc-400">Standard Plan</p>
                            </div>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-zinc-800">
                            <div className="flex items-center text-sm text-zinc-400">
                                <ShieldCheck className="h-4 w-4 mr-3 text-emerald-400" />
                                <span>{profile?.is_admin ? 'Admin Access' : 'Expert Mode Active'}</span>
                            </div>
                            <div className="flex items-center text-sm text-zinc-400">
                                <Calendar className="h-4 w-4 mr-3 text-indigo-400" />
                                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Balance & Usage Stats */}
                    <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Balance Card */}
                        <div className="rounded-2xl bg-zinc-900/50 p-6 border border-white/5 backdrop-blur-sm flex flex-col justify-between group hover:border-white/10 transition-colors">
                            <div>
                                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider flex items-center">
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Available Balance
                                </h3>
                                <div className="mt-4 flex items-baseline">
                                    <span className="text-4xl font-bold text-white tracking-tight">${Number(profile?.balance || 0).toFixed(2)}</span>
                                    <span className="ml-2 text-sm text-zinc-500">USD</span>
                                </div>
                            </div>
                            <Link href="/billing" className="mt-6 flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                                Add funds <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Link>
                        </div>

                        {/* Monthly Spend Card */}
                        <div className="rounded-2xl bg-zinc-900/50 p-6 border border-white/5 backdrop-blur-sm flex flex-col justify-between group hover:border-white/10 transition-colors">
                            <div>
                                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider flex items-center">
                                    <Activity className="h-4 w-4 mr-2" />
                                    Usage This Month
                                </h3>
                                <div className="mt-4 flex items-baseline">
                                    <span className="text-4xl font-bold text-white tracking-tight">${totalSpentThisMonth.toFixed(4)}</span>
                                    <span className="ml-2 text-sm text-zinc-500">spent</span>
                                </div>
                            </div>
                            <div className="mt-6 text-sm text-zinc-500">
                                {usageData?.length || 0} requests processed
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className="mt-12">
                    <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
                    <div className="rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm overflow-hidden">
                        {recentChats && recentChats.length > 0 ? (
                            <div className="divide-y divide-white/5">
                                {recentChats.map((chat) => (
                                    <div key={chat.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center">
                                                <Activity className="h-5 w-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{chat.model}</p>
                                                <p className="text-xs text-zinc-500">{new Date(chat.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-mono text-zinc-300">-${Number(chat.final_cost).toFixed(4)}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="p-4 bg-white/5 text-center">
                                    <Link href="/billing" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
                                        View Full History &rarr;
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <p className="text-zinc-500">No recent activity found.</p>
                                <Link href="/" className="mt-4 inline-block text-sm text-indigo-400 hover:underline">
                                    Start a new chat
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
