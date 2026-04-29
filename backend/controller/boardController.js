const prisma = require("../config/prismaClient");
const { serializeBoard } = require("../utils/transformers");

const BOARD_INCLUDE = {
  owner: true,
  columns: {
    include: {
      tasks: {
        include: {
          assignedTo: true,
          createdBy: true,
          board: true,
          column: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { order: "asc" },
  },
};

function isAdmin(user) {
  return user?.role === "ADMIN";
}

async function canAccessBoard(user, boardId) {
  if (isAdmin(user)) return true;

  const taskCount = await prisma.task.count({
    where: {
      boardId,
      assignedToId: user.id,
    },
  });

  return taskCount > 0;
}

exports.listBoards = async (req, res) => {
  try {
    const boards = await prisma.board.findMany({
      where: isAdmin(req.user)
        ? {}
        : {
            tasks: {
              some: {
                assignedToId: req.user.id,
              },
            },
          },
      include: BOARD_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      boards: boards.map(serializeBoard),
    });
  } catch (error) {
    console.error("List boards error:", error);
    return res.status(500).json({ message: "Failed to fetch boards" });
  }
};

exports.getBoard = async (req, res) => {
  try {
    const hasAccess = await canAccessBoard(req.user, req.params.id);

    if (!hasAccess) {
      return res
        .status(403)
        .json({ message: "You do not have access to this board" });
    }

    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
      include: BOARD_INCLUDE,
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    return res.status(200).json({
      board: serializeBoard(board),
    });
  } catch (error) {
    console.error("Get board error:", error);
    return res.status(500).json({ message: "Failed to fetch board" });
  }
};

exports.createBoard = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Only admins can create boards" });
    }

    const { title, description } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Board title is required" });
    }

    const board = await prisma.board.create({
      data: {
        title: String(title).trim(),
        description: description?.trim() || null,
        ownerId: req.user.id,
        columns: {
          create: [
            { title: "Todo", order: 0 },
            { title: "In Progress", order: 1 },
            { title: "Done", order: 2 },
          ],
        },
      },
      include: BOARD_INCLUDE,
    });

    return res.status(201).json({
      message: "Board created successfully",
      board: serializeBoard(board),
    });
  } catch (error) {
    console.error("Create board error:", error);
    return res.status(500).json({ message: "Failed to create board" });
  }
};

exports.deleteBoard = async (req, res) => {
  try {
    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
      select: { ownerId: true },
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Only admins can delete boards" });
    }

    await prisma.board.delete({
      where: { id: req.params.id },
    });

    return res.status(200).json({ message: "Board deleted successfully" });
  } catch (error) {
    console.error("Delete board error:", error);
    return res.status(500).json({ message: "Failed to delete board" });
  }
};

exports.addColumn = async (req, res) => {
  try {
    const boardId = req.params.id;
    const title = String(req.body.title || "").trim();

    if (!title) {
      return res.status(400).json({ message: "Column title is required" });
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { columns: { orderBy: { order: "asc" } } },
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Only admins can add columns" });
    }

    const nextOrder = board.columns.length;

    await prisma.column.create({
      data: {
        title,
        order: nextOrder,
        boardId,
      },
    });

    const refreshedBoard = await prisma.board.findUnique({
      where: { id: boardId },
      include: BOARD_INCLUDE,
    });

    return res.status(201).json({
      message: "Column created successfully",
      board: serializeBoard(refreshedBoard),
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return res
        .status(400)
        .json({ message: "Column title already exists on this board" });
    }

    console.error("Add column error:", error);
    return res.status(500).json({ message: "Failed to create column" });
  }
};

exports.updateColumn = async (req, res) => {
  try {
    const boardId = req.params.id;
    const columnId = req.params.columnId;
    const title = String(req.body.title || "").trim();

    if (!title) {
      return res.status(400).json({ message: "Column title is required" });
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { columns: true },
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const columnExists = board.columns.some((col) => col.id === columnId);
    if (!columnExists) {
      return res
        .status(404)
        .json({ message: "Column not found on this board" });
    }

    if (!isAdmin(req.user)) {
      return res
        .status(403)
        .json({ message: "Only admins can update columns" });
    }

    await prisma.column.update({
      where: { id: columnId },
      data: { title },
    });

    const refreshedBoard = await prisma.board.findUnique({
      where: { id: boardId },
      include: BOARD_INCLUDE,
    });

    return res.status(200).json({
      message: "Column updated successfully",
      board: serializeBoard(refreshedBoard),
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return res
        .status(400)
        .json({ message: "Column title already exists on this board" });
    }

    console.error("Update column error:", error);
    return res.status(500).json({ message: "Failed to update column" });
  }
};

exports.deleteColumn = async (req, res) => {
  try {
    const boardId = req.params.id;
    const columnId = req.params.columnId;

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { columns: true },
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const columnExists = board.columns.some((col) => col.id === columnId);
    if (!columnExists) {
      return res
        .status(404)
        .json({ message: "Column not found on this board" });
    }

    if (!isAdmin(req.user)) {
      return res
        .status(403)
        .json({ message: "Only admins can delete columns" });
    }

    // Delete all tasks in the column first (Prisma restricts column deletion when tasks exist)
    await prisma.task.deleteMany({
      where: { columnId },
    });

    await prisma.column.delete({
      where: { id: columnId },
    });

    const refreshedBoard = await prisma.board.findUnique({
      where: { id: boardId },
      include: BOARD_INCLUDE,
    });

    return res.status(200).json({
      message: "Column and its tasks deleted successfully",
      board: serializeBoard(refreshedBoard),
    });
  } catch (error) {
    console.error("Delete column error:", error);
    return res.status(500).json({ message: "Failed to delete column" });
  }
};
