import { useEffect, useState } from "react";
import MyTaskSection from "./MyTaskSection";
import EditTaskModal from "./EditTaskModal";
import DetailTaskModal from "./DetailTaskModal";
import api from "../../api/axios";

const Mytasks = () => {
    const [loading, setLoading] = useState(true);
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

    const [filtersToMe, setFiltersToMe] = useState({
        status: "",
        urgency: "",
    });

    const [filtersByMe, setFiltersByMe] = useState({
        status: "",
        urgency: "",
    });

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const res = await api.get("/user/mytasks", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            setAssignedToMe(res.data.assignedToMe || []);
            setAssignedByMe(res.data.assignedByMe || []);
            setCountTaskAssignedToMe(res.data.countTaskAssignedToMe);
            setCountTaskAssignedByMe(res.data.countTaskAssignedByMe);
            setTaskByPersonsToMe(res.data.taskByPersonsToMe);
            setTaskByPersonsByMe(res.data.taskByPersonsByMe);
        } catch (err) {
            console.error("Error fetching mytasks:", err);
        } finally {
            setLoading(false);
        }
    }

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
        sortPersonTo
            ? searchResultToMe.filter((task) => task.assignedBy?.name === sortPersonTo)
            : searchResultToMe,
        filtersToMe,
    );

    const finalByMeTasks = applyFilters(
        sortPersonBy
            ? searchResultByMe.filter((task) => task.assignedTo?.name === sortPersonBy)
            : searchResultByMe,
        filtersByMe,
    );

    const handleEditTask = (task, type) => {
        setEditingTask(task);
        setEditingType(type);
    };

    const handleViewTask = (task) => setDetailTask(task);

    return (
        <div className="min-h-screen w-screen bg-[linear-gradient(180deg,#020617,#0f172a_55%,#111827)] pt-16 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 pb-16">
                <MyTaskSection
                    type="toMe"
                    title="Assigned To Me"
                    subtitle="Incoming responsibilities"
                    loading={loading}
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
                    editingTask={editingTask}
                />

                <MyTaskSection
                    type="byMe"
                    title="Assigned By Me"
                    subtitle="Tasks you've delegated"
                    loading={loading}
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
                    editingTask={editingTask}
                />
            </div>

            <EditTaskModal
                isOpen={!!editingTask}
                task={editingTask}
                type={editingType}
                onClose={() => {
                    setEditingTask(null);
                    setEditingType(null);
                }}
                onSuccess={fetchData}
            />

            <DetailTaskModal
                isOpen={!!detailTask}
                task={detailTask}
                onClose={() => setDetailTask(null)}
            />
        </div>
    );
};

export default Mytasks;
