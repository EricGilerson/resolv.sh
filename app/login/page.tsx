'use client';

import { createClient } from '@/app/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get('next');
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${location.origin}/auth/callback?next=${next || '/dashboard'}`,
                    },
                });
                if (error) throw error;
                setMessage('Check your email for the confirmation link.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.refresh();
                router.push(next || '/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-8 bg-zinc-900/50 p-10 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white font-heading">
                    {isSignUp ? 'Create an account' : 'Welcome back'}
                </h2>
                <p className="mt-2 text-center text-sm text-zinc-400">
                    {isSignUp ? 'Start using Expert Mode today' : 'Sign in to access your dashboard'}
                </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleAuth}>
                <input type="hidden" name="remember" defaultValue="true" />
                <div className="-space-y-px rounded-md shadow-sm">
                    <div>
                        <label htmlFor="email-address" className="sr-only">
                            Email address
                        </label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="relative block w-full rounded-t-md border-0 bg-zinc-800 py-3 text-white ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 pl-4"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="relative block w-full rounded-b-md border-0 bg-zinc-800 py-3 text-white ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 pl-4"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="rounded-md bg-red-900/30 p-4 border border-red-900/50">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-400">Error</h3>
                                <div className="mt-2 text-sm text-red-300">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {message && (
                    <div className="rounded-md bg-green-900/30 p-4 border border-green-900/50">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-400">Success</h3>
                                <div className="mt-2 text-sm text-green-300">
                                    <p>{message}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSignUp ? 'Sign up' : 'Sign in'}
                    </button>
                </div>
            </form>

            <div className="text-center text-sm">
                <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-950">
            <div className="absolute top-8 left-8">
                <Link href="/" className="flex items-center text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
                </Link>
            </div>
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
