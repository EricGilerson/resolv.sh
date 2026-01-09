import { createClient } from "@/app/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    BarChart3,
    Users,
    MessageSquare,
    DollarSign,
    TrendingUp,
    Activity,
    CreditCard,
    ArrowLeft
} from "lucide-react";
import DateRangeFilter from "./components/DateRangeFilter";
import AdminCharts from "./components/AdminCharts";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient();
    const searchParamsValue = await searchParams;
    const range = (searchParamsValue.range as string) || "30d";

    // 1. Auth Check
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    // 2. Admin Check
    const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

    if (!profile || !profile.is_admin) {
        return redirect("/");
    }

    // 3. Date Logic
    const now = new Date();
    let startDate = new Date();

    if (range === "24h") startDate.setHours(startDate.getHours() - 24);
    else if (range === "7d") startDate.setDate(startDate.getDate() - 7);
    else if (range === "30d") startDate.setDate(startDate.getDate() - 30);
    else if (range === "90d") startDate.setDate(startDate.getDate() - 90);
    else if (range === "all") startDate = new Date(0); // Epoch

    const startDateIso = startDate.toISOString();

    // 4. Data Fetching (Filtered by Date)

    // Total Users (Always All Time for now, could be new users in range)
    const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

    // New Users in Range
    const { count: newUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte('created_at', startDateIso);


    // Chats in Range
    const { data: chats } = await supabase
        .from("chats")
        .select("id, created_at, model, final_cost")
        .gte("created_at", startDateIso)
        .order("created_at", { ascending: true });

    const totalChats = chats?.length || 0;

    // Transactions in Range (Revenue)
    const { data: transactions } = await supabase
        .from("transactions")
        .select("id, user_id, amount, status, created_at, description")
        .eq("status", "succeeded")
        .gte("created_at", startDateIso)
        .order("created_at", { ascending: true });

    const totalRevenue = transactions?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;


    // 5. Aggregate Data for Charts
    // We need to bucket by Day (or hour for 24h)
    const bucketMap = new Map<string, { revenue: number, chats: number }>();

    // Helper to get bucket key
    const getBucketKey = (dateStr: string) => {
        const d = new Date(dateStr);
        if (range === "24h") return d.toISOString().slice(0, 13) + ":00"; // Hourly
        return d.toISOString().slice(0, 10); // Daily YYYY-MM-DD
    };

    // Pre-fill buckets if needed? (skip for simplicity, will look jagged if sparse)

    // Process Transactions
    transactions?.forEach(tx => {
        const key = getBucketKey(tx.created_at);
        const existing = bucketMap.get(key) || { revenue: 0, chats: 0 };
        existing.revenue += (tx.amount || 0);
        bucketMap.set(key, existing);
    });

    // Process Chats
    chats?.forEach(chat => {
        const key = getBucketKey(chat.created_at);
        const existing = bucketMap.get(key) || { revenue: 0, chats: 0 };
        existing.chats += 1;
        bucketMap.set(key, existing);
    });

    // Convert to Array & Sort
    const chartData = Array.from(bucketMap.entries())
        .map(([date, stats]) => ({ date, amount: stats.revenue, count: stats.chats }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Separate for specific charts if needed, or pass unified
    const revenueChartData = chartData.map(d => ({ date: d.date, amount: d.amount }));
    const chatChartData = chartData.map(d => ({ date: d.date, count: d.count }));


    // 6. Model Stats (Aggregated from fetched chats)
    const modelStats = (chats || []).reduce((acc: any, curr) => {
        const model = curr.model || "Unknown";
        if (!acc[model]) {
            acc[model] = { count: 0, cost: 0 };
        }
        acc[model].count += 1;
        acc[model].cost += (curr.final_cost || 0);
        return acc;
    }, {});

    const modelStatsArray = Object.entries(modelStats)
        .map(([name, stats]: [string, any]) => ({
            name,
            count: stats.count,
            cost: stats.cost,
        }))
        .sort((a, b) => b.count - a.count);

    // Helper formatter
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    // Recent Activity (use the fetch above, satisfy limit logic)
    const recentTransactions = [...(transactions || [])].reverse().slice(0, 5);


    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-all"
                            title="Back to Home"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                                Admin Dashboard
                            </h1>
                            <p className="text-gray-400 mt-2">Overview of platform performance and metrics.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <DateRangeFilter />
                        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-4 py-2 rounded-full hidden md:flex">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-sm text-gray-300">System Operational</span>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Revenue"
                        value={formatCurrency(totalRevenue)}
                        icon={<DollarSign className="w-5 h-5 text-green-400" />}
                        trend={`In last ${range}`}
                        color="green"
                    />
                    <StatCard
                        title="Total Users"
                        value={totalUsers?.toString() || "0"}
                        icon={<Users className="w-5 h-5 text-blue-400" />}
                        trend={`${newUsers} new in period`}
                        color="blue"
                    />
                    <StatCard
                        title="Chats"
                        value={totalChats?.toString() || "0"}
                        icon={<MessageSquare className="w-5 h-5 text-purple-400" />}
                        trend={`In last ${range}`}
                        color="purple"
                    />
                    <StatCard
                        title="Avg. Cost / Chat"
                        value={formatCurrency(totalChats ? (modelStatsArray.reduce((acc, curr) => acc + curr.cost, 0) / totalChats) : 0)}
                        icon={<TrendingUp className="w-5 h-5 text-orange-400" />}
                        trend="Per chat average"
                        color="orange"
                    />
                </div>

                {/* Charts Section */}
                <AdminCharts revenueData={revenueChartData} chatData={chatChartData} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content - Model Usage Trends */}
                    <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-gray-400" />
                            Model Usage Breakdown
                        </h2>
                        <div className="space-y-4">
                            {modelStatsArray.map((stats, idx) => (
                                <div key={stats.name} className="group">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-300 font-medium">{stats.name}</span>
                                        <span className="text-gray-500">{stats.count} chats ({formatCurrency(stats.cost)})</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full group-hover:bg-blue-500 transition-all duration-500"
                                            style={{ width: `${(stats.count / (totalChats || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {modelStatsArray.length === 0 && (
                                <p className="text-gray-500 text-sm italic">No chat data availble in this period.</p>
                            )}
                        </div>
                    </div>

                    {/* Sidebar - Recent Transactions */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-gray-400" />
                            Recent Activity
                        </h2>
                        <div className="space-y-4">
                            {recentTransactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${tx.status === 'succeeded' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-200">
                                                {tx.description || "Top-up"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(tx.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`font-mono font-medium ${tx.amount > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                                        +{formatCurrency(tx.amount)}
                                    </span>
                                </div>
                            ))}
                            {(!recentTransactions || recentTransactions.length === 0) && (
                                <p className="text-gray-500 text-sm italic">No recent transactions in this period.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend, color }: { title: string, value: string, icon: any, trend: string, color: string }) {
    return (
        <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl backdrop-blur-sm hover:border-gray-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-gray-800 rounded-lg">
                    {icon}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
                    {trend}
                </span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
    );
}
