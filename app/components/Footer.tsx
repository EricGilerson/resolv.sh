import { Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-black border-t border-white/5" aria-labelledby="footer-heading">
            <h2 id="footer-heading" className="sr-only">Footer</h2>
            <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
                <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                    <div className="space-y-8">
                        <span className="text-2xl font-bold text-white font-heading">Resolv</span>
                        <p className="text-sm leading-6 text-zinc-400 max-w-xs">
                            The deterministic agentic SDLC IDE for the modern era. Empowering developers to build with confidence.
                        </p>
                        <div className="flex space-x-6">
                            <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                                <span className="sr-only">GitHub</span>
                                <Github className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                                <span className="sr-only">Twitter</span>
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                                <span className="sr-only">LinkedIn</span>
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>
                    <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-white">Solutions</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    <li><a href="#" className="text-sm leading-6 text-zinc-400 hover:text-primary-400 transition-colors">Expert Mode</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-zinc-400 hover:text-primary-400 transition-colors">Agentic Workflows</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-zinc-400 hover:text-primary-400 transition-colors">Shadow Workspace</a></li>
                                </ul>
                            </div>
                            <div className="mt-10 md:mt-0">
                                <h3 className="text-sm font-semibold leading-6 text-white">Support</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    <li><a href="#" className="text-sm leading-6 text-zinc-400 hover:text-primary-400 transition-colors">Documentation</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-zinc-400 hover:text-primary-400 transition-colors">API Reference</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-zinc-400 hover:text-primary-400 transition-colors">Guides</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-white">Company</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    <li><a href="#" className="text-sm leading-6 text-zinc-400 hover:text-primary-400 transition-colors">About</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-zinc-400 hover:text-primary-400 transition-colors">Blog</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-zinc-400 hover:text-primary-400 transition-colors">Careers</a></li>
                                </ul>
                            </div>
                            <div className="mt-10 md:mt-0">
                                <h3 className="text-sm font-semibold leading-6 text-white">Legal</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    <li><a href="#" className="text-sm leading-6 text-zinc-400 hover:text-primary-400 transition-colors">Privacy</a></li>
                                    <li><a href="#" className="text-sm leading-6 text-zinc-400 hover:text-primary-400 transition-colors">Terms</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-16 border-t border-white/5 pt-8 sm:mt-20 lg:mt-24 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-xs leading-5 text-zinc-500">&copy; 2024 Resolv, Inc. All rights reserved.</p>
                    <p className="text-xs leading-5 text-zinc-600">Designed with intent.</p>
                </div>
            </div>
        </footer>
    );
}
