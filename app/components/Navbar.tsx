'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${isScrolled ? 'backdrop-blur-xl bg-black/20 border-b border-white/5 supports-[backdrop-filter]:bg-black/20' : 'bg-transparent'}`}>
            <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
                <div className="flex lg:flex-1">
                    <Link href="/" className="-m-1.5 p-1.5 text-2xl font-bold tracking-tight text-white hover:opacity-80 transition-opacity font-heading">
                        Resolv
                    </Link>
                </div>
                <div className="flex lg:hidden">
                    <button
                        type="button"
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-zinc-400 hover:text-white transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <span className="sr-only">Open main menu</span>
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
                <div className="hidden lg:flex lg:gap-x-12">
                    {['Product', 'Features', 'Documentation', 'Company'].map((item) => (
                        <a key={item} href="#" className="text-sm font-medium leading-6 text-zinc-300 hover:text-white transition-colors relative group">
                            {item}
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary-400 transition-all group-hover:w-full" />
                        </a>
                    ))}
                </div>
                <div className="hidden lg:flex lg:flex-1 lg:justify-end gap-x-6 items-center">
                    <a href="#" className="text-sm font-semibold leading-6 text-white hover:text-zinc-300 transition-colors">
                        Log in
                    </a>
                    <a href="#" className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-white/20 hover:ring-white/20 transition-all">
                        Get Started
                    </a>
                </div>
            </nav>
            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-3xl">
                    <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
                        <div className="flex items-center justify-between">
                            <a href="#" className="-m-1.5 p-1.5 text-2xl font-bold text-white font-heading">Resolv</a>
                            <button
                                type="button"
                                className="-m-2.5 rounded-md p-2.5 text-zinc-400 hover:text-white"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <span className="sr-only">Close menu</span>
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="mt-6 flow-root">
                            <div className="-my-6 divide-y divide-white/5">
                                <div className="space-y-2 py-6">
                                    {['Product', 'Features', 'Documentation', 'Company'].map((item) => (
                                        <a key={item} href="#" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-white/5">
                                            {item}
                                        </a>
                                    ))}
                                </div>
                                <div className="py-6 space-y-4">
                                    <a href="#" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-white/5">Log in</a>
                                    <a href="#" className="flex items-center justify-center rounded-full bg-primary-600 px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-primary-500">
                                        Get Started
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
