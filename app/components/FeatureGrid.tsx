'use client';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Cpu, Database, GitBranch, Terminal } from 'lucide-react';

const features = [
    {
        name: 'Adversarial Supervisor',
        description: 'Most agents guess. Ours asks. The Supervisor identifies ambiguity and blocks progress until you clarify exactly what you want.',
        icon: ShieldCheck,
    },
    {
        name: 'Deterministic execution',
        description: 'The proper execution of the plan without any deviation. If it gets stuck, it asks you, it does not loop.',
        icon: Cpu,
    },
    {
        name: 'Merkle Tree Context',
        description: 'Hybrid search combines semantic understanding with exact code pointers for 100% context accuracy.',
        icon: Database,
    },
    {
        name: 'Zero Hallucinations',
        description: 'By forcing you to answer questions upfront, we eliminate the "guessing game" that leads to broken code.',
        icon: Zap,
    },
    {
        name: 'Shadow Workspace',
        description: 'Agents operate in a virtual shadow filesystem. Verify changes safely before they touch disk.',
        icon: GitBranch,
    },
    {
        name: 'Deep Terminal Integration',
        description: 'Agents can run builds and tests to verify their own work, reporting back to the Auditor.',
        icon: Terminal,
    },
];

export default function FeatureGrid() {
    return (
        <section id="features" className="bg-zinc-950 py-24 sm:py-32 border-t border-zinc-900">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-indigo-400">Why Resolv?</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Built for Engineering Rigor
                    </p>
                    <p className="mt-6 text-lg leading-8 text-zinc-400">
                        We don't promise AGI. We promise a tool that doesn't break your build.
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.name}
                                className="flex flex-col bg-zinc-900/40 p-8 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <dt className="flex items-center gap-x-3 text-base font-bold leading-7 text-white font-heading">
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
        </section>
    );
}
