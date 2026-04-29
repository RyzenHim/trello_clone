const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

function serializeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function serializeTask(task) {
  if (!task) return null;

  return {
    id: task.id,
    _id: task.id,
    taskTitle: task.title,
    taskDescription: task.description || "",
    urgency: PRIORITY_LABELS[task.priority] || "Medium",
    status: task.column?.title || "Todo",
    dueDate: task.dueDate,
    color: task.color,
    boardId: task.boardId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    assignedTo: serializeUser(task.assignedTo),
    assignedBy: serializeUser(task.createdBy),
    board: task.board
      ? {
          id: task.board.id,
          _id: task.board.id,
          title: task.board.title,
          description: task.board.description,
        }
      : null,
    attachments: task.attachmentUrl
      ? [
          {
            url: task.attachmentUrl,
            public_id: task.attachmentPublicId,
          },
        ]
      : [],
  };
}

function serializeBoard(board) {
  if (!board) return null;

  return {
    id: board.id,
    _id: board.id,
    title: board.title,
    description: board.description || "",
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    owner: serializeUser(board.owner),
    columns: (board.columns || [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((column) => ({
        id: column.id,
        _id: column.id,
        title: column.title,
        order: column.order,
        tasks: (column.tasks || []).map(serializeTask),
      })),
  };
}

module.exports = {
  PRIORITY_LABELS,
  serializeBoard,
  serializeTask,
  serializeUser,
};
