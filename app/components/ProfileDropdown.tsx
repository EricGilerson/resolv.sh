'use client';

import { createClient } from '@/app/utils/supabase/client';
import { LogOut, User, CreditCard, LayoutDashboard, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function ProfileDropdown({ email }: { email: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh(); // Refresh server components
        router.push('/'); // Redirect to home
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-full bg-zinc-800/50 pl-2 pr-4 py-1.5 text-sm font-medium text-white ring-1 ring-inset ring-white/10 hover:bg-zinc-800 hover:ring-white/20 transition-all"
            >
                <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs">
                    {email[0].toUpperCase()}
                </div>
                <span>Profile</span>
                <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl ring-1 ring-black/5 focus:outline-none py-1">
                    <div className="px-4 py-3 border-b border-zinc-800">
                        <p className="text-xs text-zinc-400">Signed in as</p>
                        <p className="truncate text-sm font-medium text-white">{email}</p>
                    </div>

                    <div className="py-1">
                        <Link
                            href="/dashboard"
                            className="group flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                            onClick={() => setIsOpen(false)}
                        >
                            <LayoutDashboard className="h-4 w-4 text-zinc-400 group-hover:text-indigo-400" />
                            Dashboard
                        </Link>
                        <Link
                            href="/billing"
                            className="group flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                            onClick={() => setIsOpen(false)}
                        >
                            <CreditCard className="h-4 w-4 text-zinc-400 group-hover:text-indigo-400" />
                            Billing
                        </Link>
                    </div>

                    <div className="border-t border-zinc-800 py-1">
                        <button
                            onClick={handleSignOut}
                            className="group flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white/90"
                        >
                            <LogOut className="h-4 w-4 text-zinc-400 group-hover:text-red-400" />
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
