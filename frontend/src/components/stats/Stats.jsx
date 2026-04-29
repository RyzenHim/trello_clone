import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import LoadingScreen from "../ui/LoadingScreen";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f97316", "#ef4444"];

const Stats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get("/user/mytasks", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                setStats(res.data);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <LoadingScreen label="Loading analytics" />;
    if (!stats) return null;

    const statusData = [
        { name: "Assigned To Me", value: stats.countTaskAssignedToMe },
        { name: "Assigned By Me", value: stats.countTaskAssignedByMe }
    ];

    const byPersonToMe = stats.taskByPersonsToMe.map((user) => ({
        name: user.name,
        tasks: user.taskCount
    }));

    const byPersonByMe = stats.taskByPersonsByMe.map((user) => ({
        name: user.name,
        tasks: user.taskCount
    }));

    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#020617,#0f172a_55%,#111827)] text-white pt-14">
            <div className="max-w-7xl mx-auto px-8 py-12">
                <div className="mb-12">
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Analytics Dashboard
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Real-time insights into your task performance
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
                    <GlassStat title="Assigned To Me" value={stats.countTaskAssignedToMe} />
                    <GlassStat title="Assigned By Me" value={stats.countTaskAssignedByMe} />
                    <GlassStat title="Users" value={stats.userList.length} />
                    <GlassStat
                        title="Total Tasks"
                        value={stats.assignedToMe.length + stats.assignedByMe.length}
                    />
                </div>

                <div className="grid lg:grid-cols-2 gap-10">
                    <GlassCard title="Task Distribution">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={65}
                                    outerRadius={95}
                                >
                                    {statusData.map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: "rgba(15,23,42,.9)",
                                        border: "1px solid rgba(255,255,255,.1)",
                                        borderRadius: "12px"
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </GlassCard>

                    <GlassCard title="Tasks Assigned To Me By">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={byPersonToMe}>
                                <XAxis dataKey="name" tick={{ fill: "#cbd5f5" }} />
                                <YAxis tick={{ fill: "#cbd5f5" }} />
                                <Tooltip
                                    contentStyle={{
                                        background: "rgba(15,23,42,.9)",
                                        border: "1px solid rgba(255,255,255,.1)",
                                        borderRadius: "12px"
                                    }}
                                />
                                <Bar dataKey="tasks" fill="#6366f1" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </GlassCard>

                    <GlassCard title="Tasks I Assigned To">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={byPersonByMe}>
                                <XAxis dataKey="name" tick={{ fill: "#cbd5f5" }} />
                                <YAxis tick={{ fill: "#cbd5f5" }} />
                                <Tooltip
                                    contentStyle={{
                                        background: "rgba(15,23,42,.9)",
                                        border: "1px solid rgba(255,255,255,.1)",
                                        borderRadius: "12px"
                                    }}
                                />
                                <Bar dataKey="tasks" fill="#22c55e" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

const GlassStat = ({ title, value }) => (
    <div className="
    relative overflow-hidden
    bg-white/8
    border border-white/15
    rounded-2xl p-6
    shadow-[0_18px_40px_rgba(0,0,0,.28)]
    hover:-translate-y-1 transition
  ">
        <p className="text-sm text-gray-300">{title}</p>
        <h2 className="text-3xl font-semibold mt-2">{value}</h2>
    </div>
);

const GlassCard = ({ title, children }) => (
    <div className="
    relative overflow-hidden
    bg-white/8
    border border-white/15
    rounded-3xl p-6
    shadow-[0_20px_44px_rgba(0,0,0,.3)]
  ">
        <h2 className="relative text-lg font-medium mb-5">{title}</h2>
        <div className="relative">{children}</div>
    </div>
);

export default Stats;
