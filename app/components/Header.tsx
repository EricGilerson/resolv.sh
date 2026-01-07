import { createClient } from '@/app/utils/supabase/server';
import Link from 'next/link';
import ProfileDropdown from './ProfileDropdown';

export default async function Header() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md supports-[backdrop-filter]:bg-zinc-950/60">
            <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
                <div className="flex lg:flex-1">
                    <Link href="/" className="-m-1.5 p-1.5 text-2xl font-bold tracking-tight text-white font-heading">
                        Resolv
                    </Link>
                </div>
                <div className="hidden lg:flex lg:gap-x-12">
                    {/* Only show these when logged out or always? User requirement: "When the user is signed in the sign in and get started should not show". 
                        Implies main landing page content might change, but specifically header buttons.
                        Let's keep nav links but hide "Get Started" button if logged in.
                     */}
                    <Link href="/#features" className="text-sm font-semibold leading-6 text-zinc-300 hover:text-white transition-colors">
                        Features
                    </Link>
                    <Link href="/#expert-mode" className="text-sm font-semibold leading-6 text-zinc-300 hover:text-white transition-colors">
                        Expert Mode
                    </Link>
                    <Link href="/#methodology" className="text-sm font-semibold leading-6 text-zinc-300 hover:text-white transition-colors">
                        Methodology
                    </Link>
                    <Link href="#" className="text-sm font-semibold leading-6 text-zinc-300 hover:text-white transition-colors">
                        Pricing
                    </Link>
                </div>
                <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                    {user ? (
                        <ProfileDropdown email={user.email!} />
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="text-sm font-semibold leading-6 text-zinc-300 hover:text-white">
                                Log in
                            </Link>
                            <Link href="/login" className="text-sm font-semibold leading-6 text-white group flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 hover:bg-white/20 transition-all">
                                Get Started <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                            </Link>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
}
