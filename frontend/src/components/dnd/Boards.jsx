import { useEffect, useMemo, useState } from "react";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import api from "../../api/axios";
import LoadingScreen from "../ui/LoadingScreen";
import MyTaskSection from "../Crud/MyTaskSection";
import EditTaskModal from "../Crud/EditTaskModal";
import DetailTaskModal from "../Crud/DetailTaskModal";

const tokenHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const emptyTaskForm = {
  id: null,
  boardId: null,
  taskTitle: "",
  taskDescription: "",
  assignedTo: "",
  urgency: "Medium",
  dueDate: "",
  status: "Todo",
  color: "#6366f1",
};

const Boards = () => {
  const [viewMode, setViewMode] = useState("board"); // 'board' | 'list'

  /* ============== BOARD VIEW STATE ============== */
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [users, setUsers] = useState([]);
  const [filterUserId, setFilterUserId] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardForm, setBoardForm] = useState({ title: "", description: "" });
  const [showCreateBoardForm, setShowCreateBoardForm] = useState(false);
  const [showAddColumnForm, setShowAddColumnForm] = useState(false);
  const [columnTitle, setColumnTitle] = useState("");
  const [editingBoard, setEditingBoard] = useState(null);
  const [boardEditModalOpen, setBoardEditModalOpen] = useState(false);
  const [boardEditForm, setBoardEditForm] = useState({ title: "", description: "" });
  const [boardEditSaving, setBoardEditSaving] = useState(false);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskSaving, setTaskSaving] = useState(false);
  const [columnEditModalOpen, setColumnEditModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [columnEditForm, setColumnEditForm] = useState({ title: "" });
  const [columnSaving, setColumnSaving] = useState(false);

  /* ============== TASK LIST VIEW STATE ============== */
  const [listLoading, setListLoading] = useState(false);
  const [assignedToMe, setAssignedToMe] = useState([]);
  const [assignedByMe, setAssignedByMe] = useState([]);
  const [countTaskAssignedToMe, setCountTaskAssignedToMe] = useState("");
  const [countTaskAssignedByMe, setCountTaskAssignedByMe] = useState("");
  const [taskByPersonsToMe, setTaskByPersonsToMe] = useState([]);
  const [taskByPersonsByMe, setTaskByPersonsByMe] = useState([]);
  const [searchTo, setSearchTo] = useState("");
  const [searchBy, setSearchBy] = useState("");
  const [sortPersonTo, setSortPersonTo] = useState("");
  const [sortPersonBy, setSortPersonBy] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [filtersToMe, setFiltersToMe] = useState({ status: "", urgency: "" });
  const [filtersByMe, setFiltersByMe] = useState({ status: "", urgency: "" });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  /* ============== INITIAL LOAD ============== */
  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, boardsRes] = await Promise.all([
          api.get("/user/profile", tokenHeader()),
          api.get("/boards", tokenHeader()),
        ]);

        const currentUser = profileRes.data.userDetail;
        setProfile(currentUser);
        setBoards(boardsRes.data.boards || []);
        if (currentUser.role === "ADMIN") {
          const usersRes = await api.get("/user/all", tokenHeader());
          setUsers([currentUser, ...(usersRes.data.existingUsers || [])]);
        } else {
          setUsers([currentUser]);
          setFilterUserId(currentUser.id);
        }
        setSelectedBoardId((boardsRes.data.boards || [])[0]?.id || null);
      } catch (error) {
        console.error("Board page load error:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ============== LOAD BOARD WHEN SELECTED ============== */
  useEffect(() => {
    if (!selectedBoardId) {
      setSelectedBoard(null);
      return;
    }
    void loadBoard(selectedBoardId);
  }, [selectedBoardId]);

  /* ============== LOAD TASK LIST DATA WHEN SWITCHING TO LIST VIEW ============== */
  useEffect(() => {
    if (viewMode === "list") {
      void fetchListData();
    }
  }, [viewMode]);

  const loadBoard = async (boardId) => {
    setBoardLoading(true);
    try {
      const res = await api.get(`/boards/${boardId}`, tokenHeader());
      setSelectedBoard(res.data.board);
    } catch (error) {
      console.error("Load board error:", error);
    } finally {
      setBoardLoading(false);
    }
  };

  const fetchListData = async () => {
    setListLoading(true);
    try {
      const res = await api.get("/user/mytasks", tokenHeader());
      setAssignedToMe(res.data.assignedToMe || []);
      setAssignedByMe(res.data.assignedByMe || []);
      setCountTaskAssignedToMe(res.data.countTaskAssignedToMe);
      setCountTaskAssignedByMe(res.data.countTaskAssignedByMe);
      setTaskByPersonsToMe(res.data.taskByPersonsToMe);
      setTaskByPersonsByMe(res.data.taskByPersonsByMe);
    } catch (err) {
      console.error("Error fetching mytasks:", err);
    } finally {
      setListLoading(false);
    }
  };

  const isAdmin = profile?.role === "ADMIN";

  /* ============== BOARD VIEW HELPERS ============== */
  const visibleColumns = useMemo(() => {
    if (!selectedBoard) return [];
    return selectedBoard.columns.map((column) => ({
      ...column,
      tasks: filterUserId
        ? column.tasks.filter((task) => task.assignedTo?.id === filterUserId)
        : column.tasks,
    }));
  }, [selectedBoard, filterUserId]);

  const openCreateTaskModal = (status = "Todo", boardId = null) => {
    setTaskForm({
      ...emptyTaskForm,
      boardId: boardId || selectedBoardId,
      assignedTo: users[0]?.id || "",
      status,
    });
    setTaskModalOpen(true);
  };

  const openEditTaskModal = (task) => {
    setTaskForm({
      id: task.id,
      boardId: task.boardId || selectedBoardId,
      taskTitle: task.taskTitle || "",
      taskDescription: task.taskDescription || "",
      assignedTo: task.assignedTo?.id || "",
      urgency: task.urgency || "Medium",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : "",
      status: task.status || "Todo",
      color: task.color || "#6366f1",
    });
    setTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setTaskModalOpen(false);
    setTaskForm(emptyTaskForm);
  };

  const openColumnEditModal = (column) => {
    setEditingColumn(column);
    setColumnEditForm({ title: column.title });
    setColumnEditModalOpen(true);
  };

  const closeColumnEditModal = () => {
    setColumnEditModalOpen(false);
    setEditingColumn(null);
    setColumnEditForm({ title: "" });
  };

  const openBoardEditModal = (board) => {
    setEditingBoard(board);
    setBoardEditForm({ title: board.title, description: board.description || "" });
    setBoardEditModalOpen(true);
  };

  const closeBoardEditModal = () => {
    setBoardEditModalOpen(false);
    setEditingBoard(null);
    setBoardEditForm({ title: "", description: "" });
  };

  const handleUpdateColumn = async () => {
    if (!editingColumn || !columnEditForm.title.trim() || !selectedBoard) return;
    setColumnSaving(true);
    try {
      const res = await api.patch(
        `/boards/${selectedBoard.id}/columns/${editingColumn.id}`,
        { title: columnEditForm.title.trim() },
        tokenHeader(),
      );
      setSelectedBoard(res.data.board);
      setBoards((prev) => prev.map((board) => (board.id === res.data.board.id ? res.data.board : board)));
      closeColumnEditModal();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update column");
    } finally {
      setColumnSaving(false);
    }
  };

  const handleDeleteColumn = async () => {
    if (!editingColumn || !selectedBoard) return;
    if (!window.confirm(`Delete column "${editingColumn.title}" and all its tasks?`)) return;
    setColumnSaving(true);
    try {
      const res = await api.delete(
        `/boards/${selectedBoard.id}/columns/${editingColumn.id}`,
        tokenHeader(),
      );
      setSelectedBoard(res.data.board);
      setBoards((prev) => prev.map((board) => (board.id === res.data.board.id ? res.data.board : board)));
      closeColumnEditModal();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete column");
    } finally {
      setColumnSaving(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!boardForm.title.trim()) return;
    try {
      const res = await api.post("/boards", boardForm, tokenHeader());
      const createdBoard = res.data.board;
      setBoards((prev) => [createdBoard, ...prev]);
      setSelectedBoardId(createdBoard.id);
      setBoardForm({ title: "", description: "" });
      setShowCreateBoardForm(false);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create board");
    }
  };

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm("Delete this board and all its tasks?")) return;
    try {
      await api.delete(`/boards/${boardId}`, tokenHeader());
      const nextBoards = boards.filter((board) => board.id !== boardId);
      setBoards(nextBoards);
      setSelectedBoardId(nextBoards[0]?.id || null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete board");
    }
  };

  const handleUpdateBoard = async () => {
    if (!editingBoard || !boardEditForm.title.trim()) return;
    setBoardEditSaving(true);
    try {
      const res = await api.patch(
        `/boards/${editingBoard.id}`,
        { title: boardEditForm.title.trim(), description: boardEditForm.description.trim() },
        tokenHeader(),
      );
      setBoards((prev) => prev.map((board) => (board.id === res.data.board.id ? res.data.board : board)));
      if (selectedBoardId === editingBoard.id) {
        setSelectedBoard(res.data.board);
      }
      closeBoardEditModal();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update board");
    } finally {
      setBoardEditSaving(false);
    }
  };

  const handleAddColumn = async () => {
    if (!selectedBoard || !columnTitle.trim()) return;
    try {
      const res = await api.post(
        `/boards/${selectedBoard.id}/columns`,
        { title: columnTitle.trim() },
        tokenHeader(),
      );
      setSelectedBoard(res.data.board);
      setBoards((prev) => prev.map((board) => (board.id === res.data.board.id ? res.data.board : board)));
      setColumnTitle("");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create column");
    }
  };

  const handleTaskSubmit = async (event) => {
    event.preventDefault();
    if (!taskForm.boardId || !taskForm.taskTitle.trim() || !taskForm.assignedTo) return;
    setTaskSaving(true);
    const payload = {
      taskTitle: taskForm.taskTitle.trim(),
      taskDescription: taskForm.taskDescription.trim(),
      assignedTo: taskForm.assignedTo,
      urgency: taskForm.urgency,
      dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : null,
      status: taskForm.status,
      color: taskForm.color,
      boardId: taskForm.boardId,
    };
    try {
      if (taskForm.id) {
        await api.patch(`/user/updatetask/${taskForm.id}`, payload, tokenHeader());
      } else {
        await api.post("/user/assigntask", payload, tokenHeader());
      }
      await loadBoard(taskForm.boardId);
      closeTaskModal();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save task");
    } finally {
      setTaskSaving(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/user/deletetask/${taskId}`, tokenHeader());
      if (selectedBoard) await loadBoard(selectedBoard.id);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete task");
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over || !selectedBoard) return;
    const taskId = String(active.id).replace("task:", "");
    const targetColumnId = String(over.id).replace("column:", "");
    const sourceColumn = selectedBoard.columns.find((column) =>
      column.tasks.some((task) => task.id === taskId),
    );
    const destinationColumn = selectedBoard.columns.find((column) => column.id === targetColumnId);
    if (!sourceColumn || !destinationColumn || sourceColumn.id === destinationColumn.id) return;
    const movingTask = sourceColumn.tasks.find((task) => task.id === taskId);
    if (!movingTask) return;
    setSelectedBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((column) => {
        if (column.id === sourceColumn.id) {
          return { ...column, tasks: column.tasks.filter((task) => task.id !== taskId) };
        }
        if (column.id === destinationColumn.id) {
          return { ...column, tasks: [...column.tasks, { ...movingTask, status: destinationColumn.title }] };
        }
        return column;
      }),
    }));
    try {
      await api.patch(`/user/updatetask/${taskId}`, { status: destinationColumn.title }, tokenHeader());
    } catch (error) {
      console.error("Move task error:", error);
      await loadBoard(selectedBoard.id);
    }
  };

  /* ============== TASK LIST VIEW HELPERS ============== */
  const searchResultToMe = assignedToMe.filter((task) => {
    const query = searchTo.toLowerCase().trim();
    return (
      task.taskTitle.toLowerCase().includes(query) ||
      task.status.toLowerCase().includes(query) ||
      (task.assignedBy?.name || "").toLowerCase().includes(query)
    );
  });

  const searchResultByMe = assignedByMe.filter((task) => {
    const query = searchBy.toLowerCase().trim();
    return (
      task.taskTitle.toLowerCase().includes(query) ||
      task.status.toLowerCase().includes(query) ||
      (task.assignedTo?.name || "").toLowerCase().includes(query)
    );
  });

  const applyFilters = (tasks, filters) =>
    tasks.filter((task) => {
      const statusMatch = filters.status ? task.status === filters.status : true;
      const urgencyMatch = filters.urgency ? task.urgency === filters.urgency : true;
      return statusMatch && urgencyMatch;
    });

  const finalToMeTasks = applyFilters(
    sortPersonTo ? searchResultToMe.filter((task) => task.assignedBy?.name === sortPersonTo) : searchResultToMe,
    filtersToMe,
  );

  const finalByMeTasks = applyFilters(
    sortPersonBy ? searchResultByMe.filter((task) => task.assignedTo?.name === sortPersonBy) : searchResultByMe,
    filtersByMe,
  );

  const handleEditTask = (task, type) => {
    setEditingTask(task);
    setEditingType(type);
  };

  const handleViewTask = (task) => setDetailTask(task);

  if (loading) {
    return <LoadingScreen label="Loading boards" />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#18314f_0%,#08111d_45%,#050b14_100%)] pt-24 text-white">
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {/* Header + View Toggle */}
        <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-semibold">Board & Task Management</h1>
            <p className="text-slate-300 mt-2">
              Create boards, manage tasks, assign users, and drag cards across columns.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex rounded-xl border border-white/10 overflow-hidden">
              <button
                onClick={() => setViewMode("board")}
                className={`px-4 py-2 text-sm font-medium transition ${viewMode === "board" ? "bg-cyan-500 text-slate-950" : "bg-gray-900 text-white hover:bg-white/10"
                  }`}
              >
                Board View
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 text-sm font-medium transition ${viewMode === "list" ? "bg-cyan-500 text-slate-950" : "bg-gray-900 text-white hover:bg-white/10"
                  }`}
              >
                Task List View
              </button>
            </div>
          </div>
        </div>

        {/* ============== BOARD VIEW ============== */}
        {viewMode === "board" && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
              <div className="flex flex-wrap gap-3">
                <select
                  value={filterUserId}
                  onChange={(e) => setFilterUserId(e.target.value)}
                  className="rounded-xl border border-white/10 bg-gray-900 px-4 py-2 text-sm"
                >
                  <option value="">All assignees</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>

                {isAdmin && (
                  <button
                    onClick={() => openCreateTaskModal()}
                    disabled={!selectedBoard}
                    className="rounded-xl bg-cyan-500 px-5 py-2.5 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                  >
                    Create Task
                  </button>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="mb-8 space-y-4">
                <button
                  onClick={() => setShowCreateBoardForm(!showCreateBoardForm)}
                  className="rounded-xl bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400"
                >
                  {showCreateBoardForm ? "Cancel" : "Create New Board"}
                </button>

                {showCreateBoardForm && (
                  <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
                    <div className="flex flex-wrap gap-3">
                      <input
                        value={boardForm.title}
                        onChange={(e) => setBoardForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Board title"
                        className="min-w-[220px] flex-1 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
                      />
                      <input
                        value={boardForm.description}
                        onChange={(e) => setBoardForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Description"
                        className="min-w-[220px] flex-[1.4] rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
                      />
                      <button
                        onClick={handleCreateBoard}
                        className="rounded-xl bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400"
                      >
                        Create Board
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mb-8 flex flex-wrap gap-3">
              {boards.map((board) => (
                <div key={board.id} className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedBoardId(board.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${selectedBoardId === board.id
                      ? "border-cyan-400 bg-cyan-500/15"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                  >
                    <div className="font-medium">{board.title}</div>
                    <div className="text-xs text-slate-300">{board.description || "No description"}</div>
                  </button>
                  {/* {isAdmin && selectedBoardId === board.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openBoardEditModal(board)}
                        className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200 transition hover:bg-cyan-500/20"
                        title="Edit board"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeleteBoard(board.id)}
                        className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/20"
                        title="Delete board"
                      >
                        🗑
                      </button>
                    </div>
                  )} */}
                </div>
              ))}
            </div>

            {!selectedBoard ? (
              boardLoading ? (
                <LoadingScreen label="Loading board" fullScreen={false} className="min-h-[320px]" />
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-slate-300">
                  No board available yet.
                </div>
              )
            ) : (
              <>
                {boardLoading && (
                  <LoadingScreen label="Refreshing board" fullScreen={false} className="mb-6 min-h-[180px]" />
                )}
                <div className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold">{selectedBoard.title}</h2>
                      <p className="mt-2 max-w-3xl text-slate-300">
                        {selectedBoard.description || "This board uses Todo, In Progress, and Done by default."}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cyan-300/80">
                        Owner: {selectedBoard.owner?.name || "Unknown"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openBoardEditModal(selectedBoard)}
                            className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5 text-cyan-200 transition hover:bg-cyan-500/20"
                          >
                            Edit Board
                          </button>
                          <button
                            onClick={() => setShowAddColumnForm(!showAddColumnForm)}
                            className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
                          >
                            {showAddColumnForm ? "Cancel" : "Add Column"}
                          </button>
                          <button
                            onClick={() => handleDeleteBoard(selectedBoard.id)}
                            className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-rose-200 transition hover:bg-rose-500/20"
                          >
                            Delete Board
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {showAddColumnForm && isAdmin && (
                    <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-6">
                      <input
                        value={columnTitle}
                        onChange={(e) => setColumnTitle(e.target.value)}
                        placeholder="New column title"
                        className="min-w-[220px] flex-1 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
                      />
                      <button
                        onClick={() => {
                          handleAddColumn();
                          setShowAddColumnForm(false);
                        }}
                        className="rounded-xl bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400"
                      >
                        Create Column
                      </button>
                    </div>
                  )}
                </div>

                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {visibleColumns.map((column) => (
                      <BoardColumn
                        key={column.id}
                        column={column}
                        canCreateTask={isAdmin}
                        canDeleteTask={isAdmin}
                        canEditColumn={isAdmin}
                        currentUserId={profile?.id}
                        onCreateTask={() => openCreateTaskModal(column.title)}
                        onEditTask={openEditTaskModal}
                        onDeleteTask={handleDeleteTask}
                        onEditColumn={() => openColumnEditModal(column)}
                      />
                    ))}
                  </div>
                </DndContext>
              </>
            )}

            {taskModalOpen && (
              <TaskModal
                boards={boards}
                users={users}
                form={taskForm}
                setForm={setTaskForm}
                saving={taskSaving}
                onClose={closeTaskModal}
                onSubmit={handleTaskSubmit}
              />
            )}

            {columnEditModalOpen && editingColumn && (
              <ColumnEditModal
                column={editingColumn}
                form={columnEditForm}
                setForm={setColumnEditForm}
                saving={columnSaving}
                onClose={closeColumnEditModal}
                onUpdate={handleUpdateColumn}
                onDelete={handleDeleteColumn}
              />
            )}

            {boardEditModalOpen && editingBoard && (
              <BoardEditModal
                board={editingBoard}
                form={boardEditForm}
                setForm={setBoardEditForm}
                saving={boardEditSaving}
                onClose={closeBoardEditModal}
                onUpdate={handleUpdateBoard}
              />
            )}
          </>
        )}

        {/* ============== TASK LIST VIEW ============== */}
        {viewMode === "list" && (
          <>
            {listLoading ? (
              <LoadingScreen label="Loading tasks" fullScreen={false} className="min-h-[320px]" />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-16">
                <MyTaskSection
                  type="toMe"
                  title="Assigned To Me"
                  subtitle="Incoming responsibilities"
                  loading={listLoading}
                  tasks={finalToMeTasks}
                  taskCount={countTaskAssignedToMe}
                  labelKey="assignedBy"
                  taskByPersonsToMe={taskByPersonsToMe}
                  search={searchTo}
                  setSearch={setSearchTo}
                  sortByPerson={sortPersonTo}
                  setSortByPerson={setSortPersonTo}
                  filters={filtersToMe}
                  setFilters={setFiltersToMe}
                  onEditTask={handleEditTask}
                  onViewTask={handleViewTask}
                />

                <MyTaskSection
                  type="byMe"
                  title="Assigned By Me"
                  subtitle="Tasks you've delegated"
                  loading={listLoading}
                  tasks={finalByMeTasks}
                  taskCount={countTaskAssignedByMe}
                  labelKey="assignedTo"
                  taskByPersonsByMe={taskByPersonsByMe}
                  search={searchBy}
                  setSearch={setSearchBy}
                  sortByPerson={sortPersonBy}
                  setSortByPerson={setSortPersonBy}
                  filters={filtersByMe}
                  setFilters={setFiltersByMe}
                  onEditTask={handleEditTask}
                  onViewTask={handleViewTask}
                />
              </div>
            )}

            <EditTaskModal
              isOpen={!!editingTask}
              task={editingTask}
              type={editingType}
              onClose={() => {
                setEditingTask(null);
                setEditingType(null);
              }}
              onSuccess={fetchListData}
            />

            <DetailTaskModal
              isOpen={!!detailTask}
              task={detailTask}
              onClose={() => setDetailTask(null)}
            />
          </>
        )}
      </div>
    </div>
  );
};

function BoardColumn({
  column,
  canCreateTask,
  canDeleteTask,
  canEditColumn,
  currentUserId,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onEditColumn,
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column:${column.id}`,
  });

  return (
    <section
      ref={setNodeRef}
      className={`rounded-3xl border p-4 backdrop-blur-xl transition ${isOver ? "border-cyan-300 bg-cyan-500/10" : "border-white/10 bg-white/10"
        }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{column.title}</h3>
          <p className="text-xs text-slate-300">{column.tasks.length} tasks</p>
        </div>

        <div className="flex gap-2">
          {canEditColumn && (
            <button
              onClick={onEditColumn}
              title="Edit column"
              className="rounded-lg border border-white/10 bg-white/10 px-2 py-1.5 text-xs transition hover:bg-white/20"
            >
              ✎
            </button>
          )}

          {canCreateTask && (
            <button
              onClick={onCreateTask}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs transition hover:bg-white/20"
            >
              Add Task
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 min-h-[280px]">
        {column.tasks.map((task) => (
          <TaskTile
            key={task.id}
            task={task}
            canEdit={canDeleteTask || task.assignedTo?.id === currentUserId}
            canDelete={canDeleteTask}
            onEdit={() => onEditTask(task)}
            onDelete={() => onDeleteTask(task.id)}
          />
        ))}

        {column.tasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-400">
            Drop a task here
          </div>
        )}
      </div>
    </section>
  );
}

function TaskTile({ task, canEdit, canDelete, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useDraggable({
    id: `task:${task.id}`,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-2xl border border-white/10 bg-slate-950/45 p-4 shadow-lg transition ${isDragging ? "opacity-60" : "hover:border-cyan-300/40"
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-medium">{task.taskTitle}</h4>
          <p className="mt-1 text-sm text-slate-300">{task.taskDescription || "No description"}</p>
        </div>

        <div
          className="h-3 w-3 rounded-full border border-white/30"
          style={{ backgroundColor: task.color || "#6366f1" }}
        />
      </div>

      <div className="mt-4 space-y-1 text-xs text-slate-300">
        <div>Assignee: {task.assignedTo?.name || "Unassigned"}</div>
        <div>Assigned by: {task.assignedBy?.name || "Unknown"}</div>
        <div>Priority: {task.urgency}</div>
        <div>Due: {task.dueDate ? new Date(task.dueDate).toLocaleString() : "No due date"}</div>
      </div>

      {(canEdit || canDelete) && (
        <div className="mt-4 flex gap-2">
          {canEdit && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs transition hover:bg-white/20"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              className="rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs text-rose-200 transition hover:bg-rose-500/25"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function TaskModal({ users, boards, form, setForm, saving, onClose, onSubmit }) {
  // Get columns for the selected board
  const selectedBoardForTask = boards.find((board) => board.id === form.boardId);
  const columns = selectedBoardForTask?.columns || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950/90 p-6 text-white shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{form.id ? "Edit Task" : "Create Task"}</h2>
            <p className="mt-1 text-sm text-slate-300">
              Manage task details, assignment, status, and due date.
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
          <select
            value={form.boardId || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, boardId: e.target.value }))}
            className="md:col-span-2 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
          >
            <option value="">Select Board</option>
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.title} {board.description ? `- ${board.description}` : ""}
              </option>
            ))}
          </select>

          <input
            value={form.taskTitle}
            onChange={(e) => setForm((prev) => ({ ...prev, taskTitle: e.target.value }))}
            placeholder="Task title"
            className="md:col-span-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
          />

          <textarea
            value={form.taskDescription}
            onChange={(e) => setForm((prev) => ({ ...prev, taskDescription: e.target.value }))}
            rows={4}
            placeholder="Description"
            className="md:col-span-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
          />

          <select
            value={form.assignedTo}
            onChange={(e) => setForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
            className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
          >
            <option value="">Assign to user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>

          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
          >
            {columns.length > 0 ? (
              columns.map((column) => (
                <option key={column.id} value={column.title}>
                  {column.title}
                </option>
              ))
            ) : (
              <option value="Todo">Todo</option>
            )}
          </select>

          <select
            value={form.urgency}
            onChange={(e) => setForm((prev) => ({ ...prev, urgency: e.target.value }))}
            className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <input
            type="datetime-local"
            value={form.dueDate}
            onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
          />

          <div className="md:col-span-2 flex items-center gap-4">
            <label className="text-sm text-slate-300">Task color</label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
            />
          </div>
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
            disabled={saving || !form.boardId}
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-200"
          >
            {saving ? "Saving..." : form.id ? "Save Task" : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}

function BoardEditModal({ board, form, setForm, saving, onClose, onUpdate }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/90 p-6 text-white shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Edit Board</h2>
            <p className="mt-1 text-sm text-slate-300">
              Update board name and description.
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

        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Board Name</label>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Board title"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Board description"
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            />
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-300">
            <strong>Current board:</strong> {board.title}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {board.columns?.length || 0} columns
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onUpdate}
            disabled={saving || !form.title.trim()}
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-200"
          >
            {saving ? "Saving..." : "Save Board"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ColumnEditModal({ column, form, setForm, saving, onClose, onUpdate, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/90 p-6 text-white shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Edit Column</h2>
            <p className="mt-1 text-sm text-slate-300">
              Manage column name or delete it entirely.
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

        <div className="mb-6">
          <label className="block text-sm text-slate-300 mb-2">Column Name</label>
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Column title"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </div>

        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-300">
            <strong>Current name:</strong> {column.title}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {column.tasks.length} tasks in this column
          </p>
        </div>

        <div className="flex justify-between gap-3">
          <button
            onClick={onDelete}
            disabled={saving}
            className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete Column
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm transition hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onUpdate}
              disabled={saving || !form.title.trim()}
              className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-200"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Boards;
