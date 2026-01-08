'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Make sure to load the public key from env
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ clientSecret, onSuccess }: { clientSecret: string, onSuccess: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsLoading(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/billing`,
            },
            redirect: 'if_required',
        });

        if (error) {
            setMessage(error.message ?? 'An unexpected error occurred.');
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            setMessage('Payment succeeded!');
            onSuccess();
        } else {
            setMessage('Unexpected state.');
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <PaymentElement />
            <button
                disabled={isLoading || !stripe || !elements}
                className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
            >
                {isLoading ? 'Processing Secure Payment...' : 'Pay Now'}
            </button>
            {message && <div className="text-sm text-red-500 mt-2">{message}</div>}
        </form>
    );
}

// SetupForm component for adding card without charge
function SetupForm({ clientSecret, onSuccess }: { clientSecret: string, onSuccess: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsLoading(true);

        const { error, setupIntent } = await stripe.confirmSetup({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/billing`,
            },
            redirect: 'if_required',
        });

        if (error) {
            setMessage(error.message ?? 'An unexpected error occurred.');
        } else if (setupIntent && setupIntent.status === 'succeeded') {
            try {
                // Save to DB immediately (fallback for webhook)
                const res = await fetch('/api/stripe/payment-method', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentMethodId: setupIntent.payment_method })
                });

                if (res.ok) {
                    setMessage('Card saved successfully!');
                    onSuccess();
                } else {
                    setMessage('Card verified but failed to save to profile.');
                }
            } catch (e) {
                console.error(e);
                setMessage('Error saving card to profile.');
            }
        } else {
            setMessage('Unexpected state.');
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <PaymentElement />
            <button
                disabled={isLoading || !stripe || !elements}
                className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
            >
                {isLoading ? 'Saving Securely...' : 'Save Card'}
            </button>
            {message && <div className="text-sm text-red-500 mt-2">{message}</div>}
        </form>
    );
}

export default function PaymentModal({ isOpen, onClose, mode = 'fund' }: { isOpen: boolean; onClose: () => void; mode?: 'fund' | 'setup' }) {
    const [amount, setAmount] = useState(10);
    const [clientSecret, setClientSecret] = useState('');
    const [loadingSecret, setLoadingSecret] = useState(false);

    if (!isOpen) return null;

    const initFlow = async () => {
        setLoadingSecret(true);
        try {
            const endpoint = mode === 'fund'
                ? '/api/stripe/create-payment-intent'
                : '/api/stripe/create-setup-intent';

            const body = mode === 'fund' ? { amount } : {};

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
            } else {
                alert(data.error || 'Failed to initialize');
            }
        } catch (e) {
            console.error(e);
            alert('Error initializing');
        } finally {
            setLoadingSecret(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
        >
            <div
                className="bg-zinc-900/95 border border-white/10 p-6 sm:p-8 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white font-heading">
                        {mode === 'fund' ? 'Add Funds' : 'Add Payment Method'}
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {!clientSecret ? (
                    <div className="space-y-6">
                        {mode === 'fund' && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-zinc-300">Amount to Add ($)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                                    <input
                                        type="number"
                                        min="10"
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        className="w-full bg-zinc-800/50 border border-white/10 rounded-lg py-3 pl-8 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                    />
                                </div>
                                <p className="text-xs text-zinc-500">Minimum deposit amount is $10.00</p>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                onClick={initFlow}
                                disabled={loadingSecret || (mode === 'fund' && amount < 10)}
                                className="w-full bg-indigo-600 text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
                            >
                                {loadingSecret ? 'Initializing Secure Checkout...' : mode === 'fund' ? 'Proceed to Payment' : 'Continue to Add Card'}
                            </button>
                        </div>
                        <div className="text-center">
                            <button onClick={onClose} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <Elements stripe={stripePromise} options={{ clientSecret, theme: 'night', appearance: { theme: 'night', variables: { colorPrimary: '#6366f1' } } }}>
                            {mode === 'fund' ? (
                                <CheckoutForm clientSecret={clientSecret} onSuccess={() => {
                                    alert('Funds added successfully!');
                                    window.location.reload();
                                }} />
                            ) : (
                                <SetupForm clientSecret={clientSecret} onSuccess={() => {
                                    // Close modal and let parent refresh state
                                    onClose();
                                }} />
                            )}
                            <button onClick={() => setClientSecret('')} className="mt-6 w-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                                &larr; Go Back
                            </button>
                        </Elements>
                    </div>
                )}
            </div>
        </div>
    );
}
