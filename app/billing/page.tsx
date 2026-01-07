import { createClient } from '@/app/utils/supabase/server';
import { redirect } from 'next/navigation';
import { CreditCard, Check } from 'lucide-react';
import Header from '../components/Header';

export default async function BillingPage() {
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
            <div className="mx-auto max-w-4xl">
                <header className="mb-12 text-center">
                    <h1 className="text-3xl font-bold leading-tight tracking-tight text-white font-heading">Billing & Plans</h1>
                    <p className="mt-2 text-sm text-zinc-400">Manage your subscription and billing details.</p>
                </header>

                <div className="rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm overflow-hidden">
                    <div className="p-8">
                        <h2 className="text-lg font-semibold text-white flex items-center">
                            <CreditCard className="h-5 w-5 mr-2 text-indigo-400" />
                            Current Plan: Free Tier
                        </h2>
                        <p className="mt-2 text-sm text-zinc-400">You are currently on the free plan. Upgrade to unlock full Expert Mode capabilities.</p>

                        <div className="mt-8 border-t border-zinc-800 pt-8">
                            <h3 className="text-sm font-medium text-white mb-4">Included in Free Tier:</h3>
                            <ul className="space-y-3">
                                <li className="flex items-center text-sm text-zinc-300">
                                    <Check className="h-4 w-4 mr-3 text-emerald-400" />
                                    Access to basic agents
                                </li>
                                <li className="flex items-center text-sm text-zinc-300">
                                    <Check className="h-4 w-4 mr-3 text-emerald-400" />
                                    Community support
                                </li>
                                <li className="flex items-center text-sm text-zinc-300">
                                    <Check className="h-4 w-4 mr-3 text-emerald-400" />
                                    1 Project
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="bg-white/5 px-8 py-4 flex items-center justify-between border-t border-white/5">
                        <span className="text-sm text-zinc-400">Billing cycle: <span className="text-white">Monthly</span></span>
                        <button className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-all">
                            Upgrade Plan
                        </button>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <h3 className="text-lg font-medium text-white">Payment Method</h3>
                    <p className="mt-2 text-sm text-zinc-400 mb-6">No payment method added.</p>
                    <button className="rounded-full bg-white/10 px-6 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-all">
                        Add Payment Method
                    </button>
                </div>
            </div>
        </div>
    );
}
