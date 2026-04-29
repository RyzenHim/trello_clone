import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import LoadingScreen from "../ui/LoadingScreen";
import DetailTaskModal from "../Crud/DetailTaskModal";

const tokenHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "USER",
};

const AdminUsers = () => {
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("name-asc");
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const profileRes = await api.get("/user/profile", tokenHeader());
        setProfile(profileRes.data.userDetail);

        if (profileRes.data.userDetail.role === "ADMIN") {
          const usersRes = await api.get("/user/all", tokenHeader());
          const nextUsers = usersRes.data.existingUsers || [];
          setUsers(nextUsers);
          setSelectedUserId(nextUsers[0]?.id || null);
        }
      } catch (error) {
        console.error("Admin users load error:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!selectedUserId || profile?.role !== "ADMIN") {
      setSelectedUserData(null);
      return;
    }

    void loadUserDetails(selectedUserId);
  }, [selectedUserId, profile?.role]);

  // Reset form when modal opens in create mode
  useEffect(() => {
    if (modalOpen && modalMode === "create") {
      setForm({
        name: "",
        email: "",
        password: "",
        role: "USER",
      });
    }
  }, [modalOpen, modalMode]);

  const loadUsers = async () => {
    const usersRes = await api.get("/user/all", tokenHeader());
    const nextUsers = usersRes.data.existingUsers || [];
    setUsers(nextUsers);

    if (nextUsers.length === 0) {
      setSelectedUserId(null);
      return;
    }

    setSelectedUserId((current) =>
      nextUsers.some((user) => user.id === current) ? current : nextUsers[0].id,
    );
  };

  const loadUserDetails = async (userId) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/user/admin/users/${userId}`, tokenHeader());
      setSelectedUserData(res.data);
    } catch (error) {
      console.error("Admin user detail error:", error);
      setSelectedUserData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setForm({
      name: "",
      email: "",
      password: "",
      role: "USER",
    });
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selectedUserData?.user) return;

    setModalMode("edit");
    setForm({
      name: selectedUserData.user.name || "",
      email: selectedUserData.user.email || "",
      password: "",
      role: selectedUserData.user.role || "USER",
    });
    setModalOpen(true);
  };

  const openViewModal = () => {
    if (!selectedUserData?.user) return;
    setUserDetailModalOpen(true);
  };

  const openDeleteModal = () => {
    if (!selectedUserData?.user) return;
    setDeleteModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm({
      name: "",
      email: "",
      password: "",
      role: "USER",
    });
  };

  const handleSaveUser = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (modalMode === "create") {
        await api.post("/user/admin/users", form, tokenHeader());
        await loadUsers();
      } else if (selectedUserData?.user) {
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
        };

        if (form.password.trim()) {
          payload.password = form.password;
        }

        await api.patch(`/user/admin/users/${selectedUserData.user.id}`, payload, tokenHeader());
        await loadUsers();
        await loadUserDetails(selectedUserData.user.id);
      }

      closeModal();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserData?.user) return;

    try {
      await api.delete(`/user/admin/users/${selectedUserData.user.id}`, tokenHeader());
      setDeleteModalOpen(false);
      await loadUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete user");
    }
  };

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const nextUsers = users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.name?.toLowerCase().includes(normalizedSearch) ||
        user.email?.toLowerCase().includes(normalizedSearch);
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });

    nextUsers.sort((left, right) => {
      switch (sortBy) {
        case "name-desc":
          return (right.name || "").localeCompare(left.name || "");
        case "email-asc":
          return (left.email || "").localeCompare(right.email || "");
        case "email-desc":
          return (right.email || "").localeCompare(left.email || "");
        case "role":
          return (left.role || "").localeCompare(right.role || "") || (left.name || "").localeCompare(right.name || "");
        case "newest":
          return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
        case "oldest":
          return new Date(left.createdAt || 0) - new Date(right.createdAt || 0);
        case "name-asc":
        default:
          return (left.name || "").localeCompare(right.name || "");
      }
    });

    return nextUsers;
  }, [roleFilter, searchTerm, sortBy, users]);

  if (loading) {
    return <LoadingScreen label="Loading user management" />;
  }

  if (profile?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#020617,#0f172a_55%,#111827)] pt-24 px-6 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          Only admins can manage users.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#020617,#0f172a_55%,#111827)] pt-24 text-white">
      <div className="mx-auto max-w-7xl px-6 pb-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Manage Users</h1>
            <p className="mt-2 text-slate-300">
              Create users, promote or demote roles, update credentials, and inspect task details.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="rounded-xl bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300"
          >
            Create User
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-300">Users</div>
              <div className="text-xs text-slate-400">{filteredUsers.length} results</div>
            </div>

            <div className="mb-4 space-y-3">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name or email"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Admins</option>
                  <option value="USER">Users</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white"
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="email-asc">Email A-Z</option>
                  <option value="email-desc">Email Z-A</option>
                  <option value="role">Role</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedUserId === user.id
                      ? "border-cyan-400 bg-cyan-500/15"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="mt-1 text-sm text-slate-300">{user.email}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.18em] text-cyan-300/80">
                    {user.role}
                  </div>
                </button>
              ))}

              {filteredUsers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                  No users match the current search or filters.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            {detailLoading ? (
              <LoadingScreen label="Loading user details" fullScreen={false} className="min-h-[420px]" />
            ) : !selectedUserData?.user ? (
              <div className="flex min-h-[420px] items-center justify-center text-slate-400">
                Select a user to view details.
              </div>
            ) : (
              <>
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">{selectedUserData.user.name}</h2>
                    <p className="mt-1 text-slate-300">{selectedUserData.user.email}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cyan-300/80">
                      {selectedUserData.user.role}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={openViewModal}
                      className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
                    >
                      View Details
                    </button>
                    <button
                      onClick={openEditModal}
                      className="rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm transition hover:bg-white/20"
                    >
                      Edit User
                    </button>
                    <button
                      onClick={openDeleteModal}
                      className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200 transition hover:bg-rose-500/20"
                    >
                      Delete User
                    </button>
                  </div>
                </div>

                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                  <InfoCard title="Assigned Tasks" value={selectedUserData.assignedTasks.length} />
                  <InfoCard title="Created Tasks" value={selectedUserData.createdTasks.length} />
                  <InfoCard
                    title="Joined"
                    value={selectedUserData.user.createdAt ? new Date(selectedUserData.user.createdAt).toLocaleDateString() : "-"}
                  />
                </div>

                <TaskSection
                  title="Tasks Assigned To User"
                  tasks={selectedUserData.assignedTasks}
                  onViewTask={setActiveTask}
                />

                <TaskSection
                  title="Tasks Created By User"
                  tasks={selectedUserData.createdTasks}
                  onViewTask={setActiveTask}
                />
              </>
            )}
          </div>
        </div>

        {modalOpen && (
          <UserFormModal
            mode={modalMode}
            form={form}
            setForm={setForm}
            saving={saving}
            onClose={closeModal}
            onSubmit={handleSaveUser}
          />
        )}

        <UserDetailModal
          isOpen={userDetailModalOpen}
          data={selectedUserData}
          onClose={() => setUserDetailModalOpen(false)}
          onViewTask={setActiveTask}
        />

        <DeleteUserModal
          isOpen={deleteModalOpen}
          user={selectedUserData?.user}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteUser}
        />

        <DetailTaskModal
          isOpen={!!activeTask}
          task={activeTask}
          onClose={() => setActiveTask(null)}
        />
      </div>
    </div>
  );
};

const InfoCard = ({ title, value }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</div>
    <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
  </div>
);

const TaskSection = ({ title, tasks, onViewTask }) => (
  <div className="mb-6">
    <h3 className="mb-3 text-lg font-medium">{title}</h3>
    <div className="space-y-3">
      {tasks.map((task) => (
        <button
          key={task.id}
          onClick={() => onViewTask(task)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">{task.taskTitle}</div>
              <div className="mt-1 text-sm text-slate-300">{task.taskDescription || "No description"}</div>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-200">
              {task.status}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
            <span>Priority: {task.urgency}</span>
            <span>Board: {task.board?.title || "-"}</span>
            <span>Assignee: {task.assignedTo?.name || "-"}</span>
          </div>
        </button>
      ))}

      {tasks.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-400">
          No tasks in this section.
        </div>
      )}
    </div>
  </div>
);

const UserFormModal = ({ mode, form, setForm, saving, onClose, onSubmit }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

    <form
      onSubmit={onSubmit}
      className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950/95 p-6 text-white shadow-2xl"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{mode === "create" ? "Create User" : "Edit User"}</h2>
          <p className="mt-1 text-sm text-slate-300">
            {mode === "create"
              ? "Choose a password and role while creating the account."
              : "Update profile details, password and role at any time."}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10"
        >
          Close
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Full name"
          autoComplete="off"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
        />

        <input
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          type="email"
          placeholder="Email address"
          autoComplete="off"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
        />

        <input
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          type="password"
          placeholder={mode === "create" ? "Password" : "New password (optional)"}
          autoComplete="new-password"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
        />

        <select
          value={form.role}
          onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
          className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
        >
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm transition hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-200"
        >
          {saving ? "Saving..." : mode === "create" ? "Create User" : "Save Changes"}
        </button>
      </div>
    </form>
  </div>
);

const UserDetailModal = ({ isOpen, data, onClose, onViewTask }) => {
  if (!isOpen || !data?.user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/95 p-6 text-white shadow-2xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{data.user.name}</h2>
            <p className="mt-1 text-slate-300">{data.user.email}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cyan-300/80">{data.user.role}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <InfoCard title="Assigned Tasks" value={data.assignedTasks.length} />
          <InfoCard title="Created Tasks" value={data.createdTasks.length} />
          <InfoCard
            title="Joined"
            value={data.user.createdAt ? new Date(data.user.createdAt).toLocaleDateString() : "-"}
          />
        </div>

        <TaskSection
          title="Tasks Assigned To User"
          tasks={data.assignedTasks}
          onViewTask={onViewTask}
        />

        <TaskSection
          title="Tasks Created By User"
          tasks={data.createdTasks}
          onViewTask={onViewTask}
        />
      </div>
    </div>
  );
};

const DeleteUserModal = ({ isOpen, user, onClose, onConfirm }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-3xl border border-rose-400/20 bg-slate-950/95 p-6 text-white shadow-2xl">
        <h2 className="text-2xl font-semibold text-rose-100">Delete User</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          This will permanently remove <span className="font-medium text-white">{user.name}</span> and cannot be undone.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <div>{user.email}</div>
          <div className="mt-2 text-xs uppercase tracking-[0.18em] text-rose-200/80">{user.role}</div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-5 py-3 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20"
          >
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
