'use client';

import { createClient } from '@/app/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { ShieldCheck, LogOut, ArrowRight, Loader2 } from 'lucide-react';

function EditorAuthContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    // Prioritize session_id, fallback to redirect_url for legacy/testing
    const sessionId = searchParams.get('session_id');
    const redirectUrl = searchParams.get('redirect_url');

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthorizing, setIsAuthorizing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        // Set a 5-minute timeout for the session
        const timer = setTimeout(() => {
            setIsExpired(true);
        }, 5 * 60 * 1000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        async function checkUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                setLoading(false);
            } else {
                // If not logged in, redirect to login page with correct return URL
                // We need to preserve the query parameters (session_id or redirect_url)
                const params = new URLSearchParams();
                if (sessionId) params.set('session_id', sessionId);
                if (redirectUrl) params.set('redirect_url', redirectUrl);

                const currentFnUrl = `/auth/editor?${params.toString()}`;
                router.push(`/login?next=${encodeURIComponent(currentFnUrl)}`);
            }
        }
        if (!isExpired) {
            checkUser();
        }
    }, [sessionId, redirectUrl, router, supabase, isExpired]);

    const handleAuthorize = async () => {
        if (!user || isExpired) return;
        setIsAuthorizing(true);

        try {
            // Get fresh session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            if (sessionId) {
                // New Flow: Handshake via Backend
                const response = await fetch('/api/auth/handshake', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_id: sessionId,
                        access_token: session.access_token,
                        refresh_token: session.refresh_token
                    })
                });

                if (!response.ok) throw new Error('Handshake failed');

                // Success: Clean URL and show success state
                setSuccess(true);
                window.history.replaceState({}, '', '/auth/editor');
            } else if (redirectUrl) {
                // Legacy Flow: Redirect
                const separator = redirectUrl.includes('?') ? '&' : '?';
                const finalUrl = `${redirectUrl}${separator}access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
                window.location.href = finalUrl;
            }
        } catch (error) {
            console.error('Authorization failed:', error);
            setIsAuthorizing(false);
        }
    };

    const handleSwitchAccount = async () => {
        await supabase.auth.signOut();
        const params = new URLSearchParams();
        if (sessionId) params.set('session_id', sessionId);
        if (redirectUrl) params.set('redirect_url', redirectUrl);

        const currentFnUrl = `/auth/editor?${params.toString()}`;
        router.push(`/login?next=${encodeURIComponent(currentFnUrl)}`);
    };

    if (isExpired) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950 text-white flex-col">
                <div className="w-full max-w-md space-y-6 bg-zinc-900/50 p-10 rounded-2xl border border-red-500/20 backdrop-blur-sm text-center">
                    <p className="text-red-400 font-semibold mb-2">Session Expired</p>
                    <p className="text-zinc-500 text-sm">
                        This authorization session has timed out for security reasons. Please try specifically from the Editor again.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
                <div className="w-full max-w-md space-y-6 bg-zinc-900/50 p-10 rounded-2xl border border-white/5 backdrop-blur-sm text-center">
                    <div className="flex justify-center mb-2">
                        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                            <ShieldCheck className="h-8 w-8 text-green-400" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white font-heading">Successfully Authorized</h2>
                    <p className="text-zinc-400">
                        You can now return to the editor. This window can be closed.
                    </p>
                </div>
            </div>
        );
    }

    if (!sessionId && !redirectUrl) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950 text-white flex-col">
                <p className="text-red-400 mb-4">Missing session_id or redirect_url parameter.</p>
                <p className="text-zinc-500">This page is meant to be opened by the Resolv Editor.</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
            <div className="w-full max-w-md space-y-8 bg-zinc-900/50 p-10 rounded-2xl border border-white/5 backdrop-blur-sm text-center">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <ShieldCheck className="h-8 w-8 text-indigo-400" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white font-heading">Authorize Editor</h2>
                <p className="text-zinc-400">
                    The Resolv Editor is requesting access to your account.
                </p>

                <div className="bg-zinc-800/50 rounded-lg p-4 my-6 border border-zinc-700/50">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2">Signed in as</p>
                    <p className="text-white font-medium break-all">{user.email}</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleAuthorize}
                        disabled={isAuthorizing}
                        className="w-full flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAuthorizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Authorize Access <ArrowRight className="w-4 h-4" /></>}
                    </button>

                    <button
                        onClick={handleSwitchAccount}
                        className="w-full flex items-center justify-center gap-2 rounded-full bg-white/5 px-8 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-all ring-1 ring-white/10"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign in as different user
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function EditorAuthPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-zinc-950 text-white"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
            <EditorAuthContent />
        </Suspense>
    );
}
