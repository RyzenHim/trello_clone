import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "./ui/LoadingScreen";
import api from '../api/axios'
const Home = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState("User");
    const [countTaskAssignedToMe, setCountTaskAssignedToMe] = useState("")
    const [countTaskAssignedByMe, setCountTaskAssignedByMe] = useState("")
    const [countPendingTask, setCountPendingTask] = useState("")
    const [countCompletedTask, setCountCompletedTask] = useState("")
    const [role, setRole] = useState("USER")
    const [loading, setLoading] = useState(true)

    /* ================= PROFILE ================= */
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get("/user/profile", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setUserName(res.data.userDetail?.name || "User");
                setRole(res.data.userDetail?.role || "USER");
                setCountTaskAssignedToMe(res.data.countTaskAssignedToMe)
                setCountTaskAssignedByMe(res.data.countTaskAssignedByMe)
                setCountPendingTask(res.data.countPendingTask)
                setCountCompletedTask(res.data.countCompletedTask)
            } catch {
                localStorage.removeItem("token");
                navigate("/user/login");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate]);

    if (loading) {
        return <LoadingScreen label="Loading dashboard" />;
    }

    return (
        <div className="min-h-screen w-screen bg-[linear-gradient(180deg,#020617,#0f172a_55%,#111827)] pt-16">
            <div className="max-w-7xl mx-auto px-8 py-10">

                <div className="flex items-end justify-between mb-10">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">
                            Dashboard
                        </h1>
                        <p className="text-gray-300 text-sm mt-1">
                            Welcome back, {userName[0].toUpperCase() + userName.slice(1)}
                        </p>
                        <p className="text-cyan-300 text-xs mt-2 tracking-[0.24em]">
                            {role}
                        </p>
                        <div className="mt-3 h-[2px] w-16 bg-indigo-500/70 rounded-full" />
                    </div>

                    <button
                        onClick={() => {
                            localStorage.removeItem("token");
                            navigate("/user/login");
                        }}
                        className="px-4 py-2 rounded-md bg-white/10 border border-white/20
                                       text-gray-200 hover:bg-white/20 transition"
                    >
                        Logout
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatCard title="Assigned To Me" value={countTaskAssignedToMe} />
                    <StatCard title="Assigned By Me" value={countTaskAssignedByMe} />
                    <StatCard title="Open Tasks" value={countPendingTask} />
                    <StatCard title="Done Tasks" value={countCompletedTask} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <DashboardCard title="My Tasks" desc="Tasks assigned to you" onClick={() => navigate("/boards")} />
                    <DashboardCard title="Assigned By Me" desc="Tasks you gave others" onClick={() => navigate("/boards")} />
                    <DashboardCard title="Profile" desc="View and edit profile" onClick={() => navigate("/profile")} />
                    <DashboardCard title="Boards" desc="Open your Trello-style board" onClick={() => navigate("/boards")} />
                    <DashboardCard title="Insights" desc="Performance overview" onClick={() => navigate("/stats")} />
                    {role === "ADMIN" && (
                        <DashboardCard title="Manage Users" desc="Create, edit and review user accounts" onClick={() => navigate("/admin/users")} />
                    )}
                </div>

                <div className="bg-white/8 border border-white/15 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        Quick Actions
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ActionButton label="View Tasks" onClick={() => navigate("/boards")} />
                        <ActionButton label="View Stats" onClick={() => navigate("/stats")} />
                        <ActionButton label="Profile" onClick={() => navigate("/profile")} />
                        {role === "ADMIN" && (
                            <ActionButton label="Manage Users" onClick={() => navigate("/admin/users")} />
                        )}
                        {/* <ActionButton label="Settings" /> */}
                    </div>
                </div>
            </div>
        </div>
    );
};


const StatCard = ({ title, value }) => (
    <div className="bg-white/8 border border-white/15
                    rounded-2xl p-6 hover:-translate-y-1 transition">
        <p className="text-sm text-gray-400">{title}</p>
        <h2 className="text-3xl font-semibold text-white mt-2">{value}</h2>
    </div>
);

const DashboardCard = ({ title, desc, onClick }) => (
    <div
        onClick={onClick}
        className="cursor-pointer bg-white/8 border border-white/15
                   rounded-2xl p-6 hover:-translate-y-[2px]
                   hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]
                   transition"
    >
        <h3 className="text-white font-semibold mb-1">{title}</h3>
        <p className="text-gray-400 text-sm">{desc}</p>
    </div>
);

const ActionButton = ({ label, onClick }) => (
    <button
        onClick={onClick}
        className="px-4 py-2.5 rounded-md bg-white/10 border border-white/20
                   text-gray-200 hover:bg-white/20 transition text-sm"
    >
        {label}
    </button>
);


export default Home;
