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
                        <span className="block text-gradient">Not Autonomous.</span>
                        <span className="block mt-2 text-4xl sm:text-6xl text-zinc-200">User-Guided. Deterministic.</span>
                    </h1>

                    <p className="mt-8 text-lg sm:text-xl leading-8 text-zinc-400 max-w-3xl mx-auto font-light">
                        Stop fighting agents that get stuck in loops. <span className="text-zinc-200 font-medium">Resolv</span> puts you back in control with a rigorous, verified 4-step SDLC overseen by you, the expert.
                    </p>

                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
                        <a href="#expert-mode" className="group rounded-full bg-white px-8 py-4 text-sm font-semibold text-zinc-950 shadow-lg shadow-white/10 hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all w-full sm:w-auto relative overflow-hidden">
                            <span className="relative z-10">Start Expert Mode</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-zinc-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                        <a href="#" className="rounded-full bg-white/5 ring-1 ring-white/10 px-8 py-4 text-sm font-semibold text-white shadow-sm hover:bg-white/10 hover:ring-white/20 transition-all w-full sm:w-auto flex items-center justify-center gap-2 backdrop-blur-sm">
                            Read the Philosophy <ArrowRight className="h-4 w-4" />
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
