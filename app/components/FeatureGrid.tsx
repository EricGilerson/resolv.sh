'use client';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Cpu, Code2, GitBranch, Terminal } from 'lucide-react';

const features = [
    {
        name: 'Expert Mode',
        description: 'A strictly deterministic workflow that prioritizes precision and user control over conversational ambiguity.',
        icon: ShieldCheck,
    },
    {
        name: 'Agentic SDLC',
        description: 'Autonomous agents manage the entire lifecycle: planning, execution, verification, and deployment.',
        icon: Cpu,
    },
    {
        name: 'Hybrid Search',
        description: 'Combines semantic understanding with exact code pointers (Merkle Hashes) for unmatchable context accuracy.',
        icon: Code2,
    },
    {
        name: 'Speed vs Accuracy',
        description: 'Choose your operating mode: "Fast" for quick prototyping or "Slow" for rigorous, verified engineering.',
        icon: Zap,
    },
    {
        name: 'Shadow Workspace',
        description: 'Agents operate in a virtual shadow filesystem, preventing destructive changes until verification passes.',
        icon: GitBranch,
    },
    {
        name: 'Terminal Integration',
        description: 'Deep shell integration allows agents to run builds, tests, and git commands autonomously.',
        icon: Terminal,
    },
];

export default function FeatureGrid() {
    return (
        <div className="bg-zinc-950 py-24 sm:py-32 border-t border-zinc-900">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-indigo-400">Why Resolv?</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Built for the AI-Native Era
                    </p>
                    <p className="mt-6 text-lg leading-8 text-zinc-400">
                        Resolv isn't just an editor; it's an intelligent runtime for software development.
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.name}
                                className="flex flex-col"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                                    <feature.icon className="h-5 w-5 flex-none text-indigo-400" aria-hidden="true" />
                                    {feature.name}
                                </dt>
                                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-zinc-400">
                                    <p className="flex-auto">{feature.description}</p>
                                </dd>
                            </motion.div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    );
}
