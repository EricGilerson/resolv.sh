"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";
import { format, parseISO } from "date-fns";

interface AdminChartsProps {
    revenueData: { date: string; amount: number }[];
    chatData: { date: string; count: number }[];
}

export default function AdminCharts({ revenueData, chatData }: AdminChartsProps) {

    const formatDate = (dateStr: string) => {
        try {
            return format(parseISO(dateStr), "MMM d");
        } catch (e) {
            return dateStr;
        }
    };

    const formatCurrency = (val: number) => `$${val}`;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-gray-400 text-sm font-medium mb-4">Revenue Trend</h3>
                <div className="h-[300px] w-full min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                stroke="#6b7280"
                                tick={{ fontSize: 12 }}
                                tickMargin={10}
                            />
                            <YAxis
                                tickFormatter={formatCurrency}
                                stroke="#6b7280"
                                tick={{ fontSize: 12 }}
                                tickMargin={10}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", color: "#f3f4f6" }}
                                itemStyle={{ color: "#10b981" }}
                                labelFormatter={formatDate}
                                formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chat Volume Chart */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-gray-400 text-sm font-medium mb-4">Chat Volume</h3>
                <div className="h-[300px] w-full min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={chatData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                stroke="#6b7280"
                                tick={{ fontSize: 12 }}
                                tickMargin={10}
                            />
                            <YAxis
                                stroke="#6b7280"
                                tick={{ fontSize: 12 }}
                                tickMargin={10}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", color: "#f3f4f6" }}
                                itemStyle={{ color: "#8b5cf6" }}
                                labelFormatter={formatDate}
                                formatter={(value: number) => [value, "Chats"]}
                                cursor={{ fill: '#374151', opacity: 0.4 }}
                            />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
