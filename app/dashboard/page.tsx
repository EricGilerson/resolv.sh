import { createClient } from '@/app/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ShieldCheck, Calendar, Clock } from 'lucide-react';
import Header from '../components/Header';

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    return (
        <div className="min-h-screen bg-zinc-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <Header />
            <div className="mx-auto max-w-7xl">
                <header className="mb-12">
                    <h1 className="text-3xl font-bold leading-tight tracking-tight text-white font-heading">Dashboard</h1>
                    <p className="mt-2 text-sm text-zinc-400">Manage your projects and agents.</p>
                </header>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* User Profile Card - "Standard Component" */}
                    <div className="col-span-1 rounded-2xl bg-zinc-900/50 p-6 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="h-16 w-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                                {user.email?.[0].toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{user.email?.split('@')[0]}</h2>
                                <p className="text-sm text-zinc-400">{user.email}</p>
                            </div>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-zinc-800">
                            <div className="flex items-center text-sm text-zinc-400">
                                <ShieldCheck className="h-4 w-4 mr-3 text-emerald-400" />
                                <span>Expert Mode Active</span>
                            </div>
                            <div className="flex items-center text-sm text-zinc-400">
                                <Calendar className="h-4 w-4 mr-3 text-indigo-400" />
                                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center text-sm text-zinc-400">
                                <Clock className="h-4 w-4 mr-3 text-amber-400" />
                                <span>Last Sign In: {new Date(user.last_sign_in_at || Date.now()).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Placeholder Stats */}
                    <div className="col-span-1 lg:col-span-2 rounded-2xl bg-zinc-900/50 p-6 border border-white/5 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-zinc-300">Active Agents</h3>
                            <p className="mt-2 text-4xl font-bold text-white">0</p>
                            <p className="mt-1 text-sm text-zinc-500">No agents running currently.</p>
                            <button className="mt-6 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-all">
                                Deploy Agent
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
