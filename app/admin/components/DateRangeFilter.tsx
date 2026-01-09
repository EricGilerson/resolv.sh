"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const RANGES = [
    { label: "Last 24h", value: "24h" },
    { label: "Last 7d", value: "7d" },
    { label: "Last 30d", value: "30d" },
    { label: "Last 90d", value: "90d" },
    { label: "All Time", value: "all" },
];

export default function DateRangeFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentRange = searchParams.get("range") || "30d";

    const handleRangeChange = useCallback((value: string) => {
        router.push(`?range=${value}`);
    }, [router]);

    return (
        <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 p-1 rounded-lg">
            {RANGES.map((range) => (
                <button
                    key={range.value}
                    onClick={() => handleRangeChange(range.value)}
                    className={`
            px-3 py-1.5 text-xs font-medium rounded-md transition-all
            ${currentRange === range.value
                            ? "bg-gray-800 text-white shadow-sm border border-gray-700"
                            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                        }
          `}
                >
                    {range.label}
                </button>
            ))}
        </div>
    );
}
