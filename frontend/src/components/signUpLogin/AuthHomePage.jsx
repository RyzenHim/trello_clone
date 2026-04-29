import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

const AuthHomePage = () => {
    const [mode, setMode] = useState("Login");
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-screen bg-[linear-gradient(180deg,#020617,#0f172a_55%,#111827)] flex items-center justify-center px-6">
                <div className="w-full max-w-5xl flex justify-center">
                    <div
                        className="relative w-full flex overflow-hidden rounded-2xl
            bg-white/8 border border-white/15
            shadow-[0_28px_70px_rgba(0,0,0,0.35)]"
                    >
                        <div className="relative hidden md:flex w-1/2 flex-col justify-end px-12 py-16 bg-white/5 border-r border-white/10 overflow-hidden">
                            <img
                                src="https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1600&auto=format&fit=crop"
                                alt="Abstract visual"
                                className="absolute inset-0 w-full h-full object-cover opacity-40"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/90 via-[#020617]/65 to-transparent" />

                            <div className="relative z-10">
                                <p className="text-xs uppercase tracking-[0.3em] text-indigo-300 mb-4">
                                    AUTH EXPERIENCE
                                </p>

                                <h1 className="text-4xl font-semibold text-white leading-tight mb-4">
                                    Design that
                                    <br />
                                    moves you.
                                </h1>

                                <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
                                    Crafted with depth, motion, and restraint - built to feel as
                                    good as it looks.
                                </p>
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 flex flex-col justify-center px-10 py-12">
                            <div className="flex justify-center mb-8 text-xs tracking-widest text-gray-400 gap-6">
                                <button
                                    onClick={() => {
                                        setMode("Login");
                                        navigate("/user/login");
                                    }}
                                    className={mode === "Login" ? "text-white" : ""}
                                >
                                    LOGIN
                                </button>
                                <button
                                    onClick={() => {
                                        setMode("Signup");
                                        navigate("/user/signup");
                                    }}
                                    className={mode === "Signup" ? "text-white" : ""}
                                >
                                    SIGN UP
                                </button>
                            </div>

                            <div className="min-h-[420px] flex items-center justify-center p-6 bg-white/8 border border-white/15 rounded-xl">
                                <Outlet />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    );
};

export default AuthHomePage;
