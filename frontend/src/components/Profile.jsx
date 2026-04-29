import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EditProfileModal from "./myProfile/EditProfileModal";
import LoadingScreen from "./ui/LoadingScreen";
import api from '../api/axios'
const Profile = () => {
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [role, setRole] = useState("USER");
    const [joinedAt, setJoinedAt] = useState("");
    const [showEditModal, setShowEditModal] = useState(false)
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await api.get("/user/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUserName(res.data.userDetail.name);
                setUserEmail(res.data.userDetail.email)
                setRole(res.data.userDetail.role || "USER");
                setJoinedAt(res.data.userDetail.createdAt || "");
            } catch {
                localStorage.removeItem("token");
                navigate("/user/login");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    if (loading) {
        return <LoadingScreen label="Loading profile" />;
    }

    const handleEditProfile = (e) => {
        setShowEditModal(!showEditModal)

    }

    return (
        <>
        <div className="min-h-screen w-screen bg-[linear-gradient(180deg,#020617,#0f172a_55%,#111827)] pt-16">
                <div className="max-w-5xl mx-auto px-8 py-10">
                    <div className="bg-white/8 border border-white/15
                                    rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.35)]
                                    overflow-hidden">

                        <div className="p-8 bg-gradient-to-r from-indigo-600/70 to-purple-600/70">
                            <div className="flex items-center gap-6">
                                <div className="h-24 w-24 rounded-full
                                                bg-white/20 border border-white/30
                                                flex items-center justify-center
                                                text-3xl font-semibold text-white">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-white">
                                        {userName.charAt(0).toUpperCase() + userName.slice(1)}
                                    </h1>
                                    <p className="text-sm text-white/80">
                                        {userEmail}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-white mb-4">
                                    Personal Information
                                </h2>
                                <div className="space-y-3 text-sm">
                                    <Info label="Full Name" value={userName.charAt(0).toUpperCase() + userName.slice(1)} />
                                    <Info label="Email" value={userEmail} />
                                    <Info label="Role" value={role} />
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-white mb-4">
                                    Account Details
                                </h2>
                                <div className="space-y-3 text-sm">
                                    <Info label="Status" value="Active" accent="text-green-400" />
                                    <Info label="Joined" value={joinedAt ? new Date(joinedAt).toLocaleDateString() : "—"} />
                                    <Info label="Last Login" value="Current session" />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-white/10 p-6
                                        flex flex-col sm:flex-row gap-4 justify-end">
                            <button
                                onClick={handleEditProfile}
                                className="px-6 py-2 rounded-lg
                                               bg-white/10 text-white
                                               border border-white/20
                                               hover:bg-white/20 transition">
                                Edit Profile
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.removeItem("token");
                                    navigate("/user/login");
                                }}
                                className="px-6 py-2 rounded-lg
                                           bg-red-500/80 text-white
                                           hover:bg-red-500 transition">
                                Logout
                            </button>
                        </div>

                    </div>
                </div>
            </div>
            {showEditModal && (
                <EditProfileModal
                    currentName={userName}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={(updatedName) => setUserName(updatedName)}
                    email={userEmail}
                />
            )}
        </>
    );
};

const Info = ({ label, value, accent = "text-white" }) => (
    <div className="flex justify-between text-white/70">
        <span>{label}</span>
        <span className={accent}>{value}</span>
    </div>
);

export default Profile;
