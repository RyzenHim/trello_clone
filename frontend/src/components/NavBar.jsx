import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../api/axios";

const NavBar = () => {
    const navigate = useNavigate();
    const outSideCloseRef = useRef(null);
    const mobileMenuRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [name, setName] = useState("User");
    const [role, setRole] = useState("USER");

    /* ================= FLOATING NEON CURSOR ================= */
    const navRef = useRef(null);
    const [cursorStyle, setCursorStyle] = useState({
        left: 0,
        width: 0,
        opacity: 0,
    });

    const moveCursor = (e) => {
        const target = e.target.closest("[data-nav-item]");
        if (!target || !navRef.current) return;

        const navRect = navRef.current.getBoundingClientRect();
        const itemRect = target.getBoundingClientRect();

        setCursorStyle({
            left: itemRect.left - navRect.left,
            width: itemRect.width,
            opacity: 1,
        });
    };

    const hideCursor = () => {
        setCursorStyle((p) => ({ ...p, opacity: 0 }));
    };

    /* ================= FETCH USER ================= */
    useEffect(() => {
        const fetchFunc = async () => {
            try {
                const fetchApi = await api.get("/user/profile", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });

                setName(fetchApi.data.userDetail.name);
                setRole(fetchApi.data.userDetail.role || "USER");
            } catch (err) { }
        };

        fetchFunc();
    }, []);

    /* ================= OUTSIDE CLICK ================= */
    useEffect(() => {
        const handleBackdropClick = (e) => {
            if (
                outSideCloseRef.current &&
                !outSideCloseRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener("mousedown", handleBackdropClick);
        }

        return () => {
            document.removeEventListener("mousedown", handleBackdropClick);
        };
    }, [open]);

    /* ================= MOBILE MENU CLOSE OUTSIDE CLICK ================= */
    useEffect(() => {
        const handleBackdropClick = (e) => {
            if (
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(e.target)
            ) {
                setMobileMenuOpen(false);
            }
        };

        if (mobileMenuOpen) {
            document.addEventListener("mousedown", handleBackdropClick);
        }

        return () => {
            document.removeEventListener("mousedown", handleBackdropClick);
        };
    }, [mobileMenuOpen]);

    /* ================= LOGOUT ================= */
    const handleLogOut = () => {
        localStorage.removeItem("token");
        navigate("/user");
    };

    /* ================= LINK STYLE ================= */
    const linkClass = ({ isActive }) =>
        `relative text-sm font-medium tracking-wide transition
     ${isActive ? "text-white" : "text-white/70 hover:text-white"}
     after:content-[''] after:absolute after:left-0 after:-bottom-1
     after:h-[2px] after:bg-indigo-400 after:transition-all
     ${isActive ? "after:w-full" : "after:w-0 hover:after:w-full"}`;

    return (
        <nav
            className="
                fixed top-0 z-50 w-full h-16
                bg-slate-950/90
                border-b border-white/10
                shadow-[0_10px_24px_rgba(0,0,0,0.28)]
                transition-all duration-300
            "
        >
            <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
                {/* LOGO */}
                <h1
                    onClick={() => {
                        navigate("/");
                        setMobileMenuOpen(false);
                    }}
                    className="
                        text-lg sm:text-xl font-semibold tracking-wide text-white cursor-pointer
                        drop-shadow-[0_0_12px_rgba(99,102,241,0.8)]
                        hover:scale-[1.03] transition
                    "
                >
                    TODO
                </h1>

                {/* DESKTOP LINKS */}
                <div
                    ref={navRef}
                    onMouseMove={moveCursor}
                    onMouseLeave={hideCursor}
                    className="hidden md:flex items-center gap-6 lg:gap-8"
                >
                    <NavLink to="/" data-nav-item className={linkClass}>
                        Dash Board
                    </NavLink>

                    {role === "ADMIN" && (
                        <NavLink
                            to="/admin/users"
                            data-nav-item
                            className={linkClass}
                        >
                            Manage Users
                        </NavLink>
                    )}

                    <NavLink to="/boards" data-nav-item className={linkClass}>
                        My Boards
                    </NavLink>

                    {/* FLOATING NEON CURSOR */}
                    <span
                        className="
                            pointer-events-none absolute bottom-[-6px] h-[3px]
                            bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-500
                            rounded-full
                            transition-all duration-300 ease-out
                        "
                        style={{
                            left: cursorStyle.left,
                            width: cursorStyle.width,
                            opacity: cursorStyle.opacity,
                        }}
                    />
                </div>

                {/* RIGHT SECTION - PROFILE MENU + HAMBURGER */}
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* PROFILE MENU - Desktop */}
                    <div ref={outSideCloseRef} className="hidden sm:block relative">
                        <button
                            onClick={() => setOpen(!open)}
                            className="
                                flex items-center gap-2 text-white/80
                                hover:text-white transition
                            "
                        >
                            <div
                                className="
                                    h-8 w-8 sm:h-9 sm:w-9 rounded-full
                                    bg-white/15
                                    border border-white/20
                                    flex items-center justify-center
                                    text-xs sm:text-sm font-semibold text-white
                                "
                            >
                                {name?.[0].toUpperCase() || "U"}
                            </div>

                            <span className="hidden sm:block text-xs sm:text-sm font-medium">
                                {name.charAt(0).toUpperCase() + name.slice(1)}
                            </span>
                        </button>

                        {open && (
                            <div
                                className="
                                    absolute right-0 mt-3 w-48
                                    bg-slate-950
                                    border border-white/20
                                    rounded-xl shadow-xl overflow-hidden
                                "
                            >
                                <NavLink
                                    to="/profile"
                                    onClick={() => setOpen(false)}
                                    className={({ isActive }) =>
                                        `block px-4 py-3 text-sm transition
                                     ${isActive
                                            ? "bg-white/10 text-white"
                                            : "text-white/80 hover:bg-white/10"
                                        }`
                                    }
                                >
                                    View Profile
                                </NavLink>

                                <button
                                    onClick={handleLogOut}
                                    className="
                                        w-full text-left px-4 py-3 text-sm
                                        text-red-400 hover:bg-red-500/10 transition
                                    "
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>

                    {/* HAMBURGER MENU - Mobile */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden flex flex-col gap-1.5 w-6 h-6 items-center justify-center"
                        aria-label="Toggle menu"
                    >
                        <span
                            className={`
                                w-6 h-0.5 bg-white rounded transition-all duration-300
                                ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}
                            `}
                        />
                        <span
                            className={`
                                w-6 h-0.5 bg-white rounded transition-all duration-300
                                ${mobileMenuOpen ? "opacity-0" : ""}
                            `}
                        />
                        <span
                            className={`
                                w-6 h-0.5 bg-white rounded transition-all duration-300
                                ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}
                            `}
                        />
                    </button>
                </div>
            </div>

            {/* MOBILE MENU */}
            {mobileMenuOpen && (
                <div
                    ref={mobileMenuRef}
                    className="
                        md:hidden absolute top-16 left-0 right-0
                        bg-slate-950/95 backdrop-blur-sm
                        border-b border-white/10
                        shadow-lg
                        animate-slideDown
                    "
                >
                    <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
                        <NavLink
                            to="/"
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                                `px-4 py-3 rounded-lg text-sm font-medium transition
                                ${isActive
                                    ? "bg-white/10 text-white"
                                    : "text-white/80 hover:bg-white/10"
                                }`
                            }
                        >
                            Dash Board
                        </NavLink>

                        {role === "ADMIN" && (
                            <NavLink
                                to="/admin/users"
                                onClick={() => setMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `px-4 py-3 rounded-lg text-sm font-medium transition
                                    ${isActive
                                        ? "bg-white/10 text-white"
                                        : "text-white/80 hover:bg-white/10"
                                    }`
                                }
                            >
                                Manage Users
                            </NavLink>
                        )}

                        <NavLink
                            to="/boards"
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                                `px-4 py-3 rounded-lg text-sm font-medium transition
                                ${isActive
                                    ? "bg-white/10 text-white"
                                    : "text-white/80 hover:bg-white/10"
                                }`
                            }
                        >
                            My Boards
                        </NavLink>

                        {/* PROFILE SECTION - Mobile Only */}
                        <div className="sm:hidden border-t border-white/10 mt-2 pt-2">
                            <NavLink
                                to="/profile"
                                onClick={() => setMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `block px-4 py-3 rounded-lg text-sm font-medium transition
                                    ${isActive
                                        ? "bg-white/10 text-white"
                                        : "text-white/80 hover:bg-white/10"
                                    }`
                                }
                            >
                                Profile
                            </NavLink>

                            <button
                                onClick={() => {
                                    handleLogOut();
                                    setMobileMenuOpen(false);
                                }}
                                className="
                                    w-full text-left px-4 py-3 rounded-lg text-sm font-medium
                                    text-red-400 hover:bg-red-500/10 transition
                                "
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default NavBar;
