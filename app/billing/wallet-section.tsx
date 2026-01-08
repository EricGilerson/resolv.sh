'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, Info, CreditCard, Trash2 } from 'lucide-react';
import PaymentModal from './payment-form';

interface WalletSectionProps {
    balance: number;
    allowOverdraft: boolean;
    autoTopup: boolean;
}

interface SavedCard {
    brand: string;
    last4: string;
}

export default function WalletSection({ balance, allowOverdraft, autoTopup }: WalletSectionProps) {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentMode, setPaymentMode] = useState<'fund' | 'setup'>('fund'); // 'fund' = Add Funds, 'setup' = Add Card

    const [isOverdraftEnabled, setIsOverdraftEnabled] = useState(allowOverdraft);
    const [isAutoTopupEnabled, setIsAutoTopupEnabled] = useState(autoTopup);
    const [isLoading, setIsLoading] = useState(false);

    const [savedCard, setSavedCard] = useState<SavedCard | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        fetchCard();
    }, []);

    const fetchCard = async () => {
        try {
            const res = await fetch('/api/stripe/payment-method');
            const data = await res.json();
            if (data.paymentMethod) {
                setSavedCard(data.paymentMethod);
            } else {
                setSavedCard(null);
                // If no card, ensure auto-topup is off (visual sync)
                if (isAutoTopupEnabled) {
                    // Optionally force update backend or just UI?
                    // Let's just update UI to reflect reality
                    setIsAutoTopupEnabled(false);
                }
            }
        } catch (e) {
            console.error('Failed to fetch card', e);
        }
    };

    const removeCard = () => {
        setIsDeleteModalOpen(true);
    };

    const confirmRemoveCard = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/stripe/payment-method', { method: 'DELETE' });
            if (res.ok) {
                setSavedCard(null);
                setIsAutoTopupEnabled(false);
                setIsOverdraftEnabled(false);
                setIsDeleteModalOpen(false);
            } else {
                alert('Failed to remove card');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const updateSettings = async (updates: { allow_overdraft?: boolean, auto_topup?: boolean }) => {
        // Check if user is trying to ENABLE a feature without a card
        const isEnabling = (updates.auto_topup === true) || (updates.allow_overdraft === true);

        if (isEnabling && !savedCard) {
            if (confirm('You need to add a payment method to enable this feature. Add one now?')) {
                openPaymentModal('setup');
            }
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'POST',
                body: JSON.stringify(updates)
            });
            if (!res.ok) throw new Error('Failed to update');

            if (updates.allow_overdraft !== undefined) setIsOverdraftEnabled(updates.allow_overdraft);
            if (updates.auto_topup !== undefined) setIsAutoTopupEnabled(updates.auto_topup);
        } catch (e) {
            console.error(e);
            alert('Failed to update settings');
        } finally {
            setIsLoading(false);
        }
    };

    const openPaymentModal = (mode: 'fund' | 'setup') => {
        setPaymentMode(mode);
        setIsPaymentModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-sm">
                <div>
                    <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Current Balance</h2>
                    <div className="mt-2 text-4xl sm:text-5xl font-bold text-white font-heading">
                        ${balance.toFixed(2)}
                    </div>
                    <p className={`mt-2 text-sm ${(balance < 0) ? 'text-red-400' : 'text-zinc-500'}`}>
                        {balance <= -10
                            ? 'Limit reached. Please add funds.'
                            : balance < 0
                                ? 'Overdraft active.'
                                : 'Funds available for requests.'}
                    </p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => openPaymentModal('fund')}
                        className="group relative inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
                    >
                        <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
                        Add Funds
                    </button>
                    {!savedCard && (
                        <button
                            onClick={() => openPaymentModal('setup')}
                            className="inline-flex items-center justify-center rounded-full bg-zinc-800 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-700"
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Add Card
                        </button>
                    )}
                </div>
            </div>

            {/* Smart Billing Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl border transition-all ${isOverdraftEnabled ? 'bg-zinc-900/40 border-indigo-500/30' : 'bg-zinc-900/20 border-white/5'}`}>
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-white font-medium flex items-center gap-2">
                                Post-Pay Mode
                                {isOverdraftEnabled && <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full">Active</span>}
                            </h3>
                            <p className="text-sm text-zinc-400 mt-1">
                                Continue chatting even when your balance hits $0 (up to -$10). Bills monthly or upon limit.
                            </p>
                            {!savedCard && (
                                <p className="mt-2 text-xs text-amber-500 flex items-center">
                                    <Info className="h-3 w-3 mr-1" />
                                    Add a card to enable
                                </p>
                            )}
                        </div>
                        <button
                            disabled={isLoading || !savedCard}
                            onClick={() => updateSettings({ allow_overdraft: !isOverdraftEnabled })}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!savedCard ? 'opacity-50 cursor-not-allowed bg-zinc-700' : isOverdraftEnabled ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isOverdraftEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl border transition-all ${isAutoTopupEnabled ? 'bg-zinc-900/40 border-emerald-500/30' : 'bg-zinc-900/20 border-white/5'}`}>
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-white font-medium flex items-center gap-2">
                                Auto-Refill
                                {isAutoTopupEnabled && <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">Active</span>}
                            </h3>
                            <p className="text-sm text-zinc-400 mt-1">
                                Automatically charge my saved card $10 when my balance reaches the -$10 limit. No interruptions.
                            </p>
                            {savedCard ? (
                                <div className="mt-3 flex items-center gap-2 text-sm text-zinc-300 bg-zinc-800/50 py-2 px-3 rounded-lg border border-white/5">
                                    <CreditCard className="h-4 w-4 text-zinc-400" />
                                    <span className="capitalize">{savedCard.brand}</span>
                                    <span className="font-mono">•••• {savedCard.last4}</span>
                                    <button onClick={removeCard} disabled={isLoading} className="ml-auto text-red-400 hover:text-red-300 p-1">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <p className="mt-2 text-xs text-amber-500 flex items-center">
                                    <Info className="h-3 w-3 mr-1" />
                                    Add a card to enable
                                </p>
                            )}
                        </div>
                        <button
                            disabled={isLoading || !savedCard}
                            onClick={() => updateSettings({ auto_topup: !isAutoTopupEnabled })}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!savedCard ? 'opacity-50 cursor-not-allowed bg-zinc-700' : isAutoTopupEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAutoTopupEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* UI for Delete Confirmation */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-xl">
                        <h3 className="text-xl font-bold text-white mb-2">Remove Card?</h3>
                        <p className="text-zinc-400 text-sm mb-6">
                            Are you sure you want to remove your payment method? This will automatically disable
                            <span className="text-white font-medium"> Post-Pay</span> and
                            <span className="text-white font-medium"> Auto-Refill</span>.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRemoveCard}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 rounded-lg bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600/20 transition font-medium"
                            >
                                {isLoading ? 'Removing...' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    fetchCard(); // Refresh card state after potential addition
                }}
                mode={paymentMode}
            />
        </div>
    );
}
