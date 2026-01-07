'use client';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative flex flex-col items-center justify-center overflow-hidden bg-zinc-950 px-6 py-24 sm:py-32 lg:px-8 min-h-screen pt-32">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary-900/10 via-zinc-950/0 to-zinc-950" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />

            {/* Precision Grid Background - emphasizes engineering over magic */}
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <div className="mx-auto max-w-5xl text-center z-10 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="mb-8 flex justify-center">
                        <span className="relative inline-flex items-center gap-x-1.5 rounded-full bg-zinc-900/50 px-4 py-1.5 text-sm font-medium text-zinc-300 ring-1 ring-inset ring-white/10 hover:bg-white/5 hover:ring-white/20 transition-all cursor-pointer backdrop-blur-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary-400" />
                            Introducing Expert Mode
                        </span>
                    </div>

                    <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl pb-4 font-heading">
                        <span className="block text-gradient">Resolv</span>
                        <span className="block mt-2 text-4xl sm:text-6xl text-zinc-200">Interrogates Ambiguity.</span>
                    </h1>

                    <p className="mt-8 text-lg sm:text-xl leading-8 text-zinc-400 max-w-3xl mx-auto font-light">
                        Stop fighting agents that guess. <span className="text-zinc-200 font-medium">Resolv</span> forces you to clarify tradeoffs before code is written, ensuring the execution matches your intent.
                    </p>

                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
                        <a
                            href="/login"
                            className="rounded-full bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all w-full sm:w-auto text-center"
                        >
                            Get Started
                        </a>
                        <a
                            href="#expert-mode"
                            className="text-sm font-semibold leading-6 text-white hover:text-indigo-400 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                        >
                            Learn more <span aria-hidden="true">→</span>
                        </a>
                    </div>

                    <div className="mt-24 pt-8 border-t border-white/5">
                        <figure className="mx-auto max-w-3xl">
                            <blockquote className="font-serif text-xl sm:text-2xl font-light italic leading-relaxed text-zinc-500">
                                &ldquo;He who asks a question is a fool for five minutes; he who does not ask remains a fool forever.&rdquo;
                            </blockquote>
                            <figcaption className="mt-4 text-xs font-semibold text-zinc-600 uppercase tracking-widest">
                                Chinese Proverb
                            </figcaption>
                            <p className="mt-6 text-zinc-500 font-light">
                                In software, asking isn&apos;t weakness. It&apos;s the only way to avoid building the wrong thing.
                            </p>
                        </figure>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
