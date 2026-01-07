'use client';
import { motion } from 'framer-motion';
import { Eye, Map, CheckCircle, Play, ArrowRight, Lock, UserCheck } from 'lucide-react';

const steps = [
    {
        name: 'Supervisor',
        role: 'Observation',
        description: 'Analyzes the codebase and user request. Cannot edit code.',
        icon: Eye,
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-400/20',
        status: 'Read-Only'
    },
    {
        name: 'Planner',
        role: 'Strategy',
        description: 'Creates a step-by-step implementation plan for approval.',
        icon: Map,
        color: 'text-amber-400',
        bg: 'bg-amber-400/10',
        border: 'border-amber-400/20',
        status: 'User Approval'
    },
    {
        name: 'Executor',
        role: 'Action',
        description: 'Executes the approved plan precisely. Stops after completion.',
        icon: Play,
        color: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        border: 'border-emerald-400/20',
        status: 'Strict Execution'
    },
    {
        name: 'Auditor',
        role: 'Verification',
        description: 'Verifies the changes against the original plan and requirements.',
        icon: CheckCircle,
        color: 'text-purple-400',
        bg: 'bg-purple-400/10',
        border: 'border-purple-400/20',
        status: 'Final Check'
    }
];

export default function SdlcSection() {
    return (
        <section id="expert-mode" className="bg-zinc-950 py-24 sm:py-32 relative overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                <div className="mx-auto max-w-2xl lg:text-center mb-16">
                    <h2 className="text-base font-semibold leading-7 text-primary-400">The Methodology</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        The 4-Step Verified SDLC
                    </p>
                    <p className="mt-6 text-lg leading-8 text-zinc-400">
                        Most agents fail because they try to do everything at once. Resolv breaks development into distinct, protected stages.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 -z-10" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={step.name}
                            className="relative flex flex-col items-center text-center group"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <div className={`relative flex h-24 w-24 items-center justify-center rounded-2xl ${step.bg} ${step.border} border-2 backdrop-blur-sm z-10 mb-6 transition-transform group-hover:scale-110`}>
                                <step.icon className={`h-10 w-10 ${step.color}`} />
                                <div className="absolute -top-3 -right-3 bg-zinc-900 border border-zinc-800 rounded-full px-2 py-0.5 flex items-center gap-1">
                                    {step.status === 'Read-Only' && <Lock className="w-3 h-3 text-zinc-500" />}
                                    {step.status === 'User Approval' && <UserCheck className="w-3 h-3 text-amber-500" />}
                                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">{step.status}</span>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 font-heading">{step.name}</h3>
                            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">{step.role}</div>
                            <p className="text-sm leading-6 text-zinc-400">{step.description}</p>

                            {index < steps.length - 1 && (
                                <div className="lg:hidden absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-zinc-700">
                                    <ArrowRight className="w-6 h-6 rotate-90" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
