const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prismaClient");
const transporter = require("../utils/mailer");
const { serializeTask, serializeUser } = require("../utils/transformers");

const secretKey = process.env.SECRET_KEY;

const TASK_INCLUDE = {
  assignedTo: true,
  createdBy: true,
  board: true,
  column: true,
};

function isAdmin(user) {
  return user?.role === "ADMIN";
}

function generatePassword() {
  return crypto.randomBytes(4).toString("hex");
}

function getPriorityValue(value = "Medium") {
  const normalized = String(value).trim().toUpperCase();

  if (["LOW", "MEDIUM", "HIGH"].includes(normalized)) {
    return normalized;
  }

  return "MEDIUM";
}

async function getBoardColumn(boardId, status = "Todo") {
  return prisma.column.findUnique({
    where: {
      boardId_title: {
        boardId,
        title: status,
      },
    },
  });
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

async function sendMailIfPossible(payload) {
  try {
    await transporter.sendMail(payload);
  } catch (error) {
    console.error("Mail error:", error.message);
  }
}

async function getUserTaskDetails(userId) {
  const [user, assignedTasksRaw, createdTasksRaw] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
    }),
    prisma.task.findMany({
      where: { assignedToId: userId },
      include: TASK_INCLUDE,
      orderBy: { createdAt: "desc" },
    }),
    prisma.task.findMany({
      where: { createdById: userId },
      include: TASK_INCLUDE,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    user,
    assignedTasks: assignedTasksRaw.map(serializeTask),
    createdTasks: createdTasksRaw.map(serializeTask),
  };
}

exports.signup = async (req, res) => {
  try {
    let { name, email, password, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    email = email.trim().toLowerCase();
    name = name.trim();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const userCount = await prisma.user.count();
    const canCreateAdmin = userCount === 0 || isAdmin(req.user);
    const finalRole =
      canCreateAdmin && role === "ADMIN" ? "ADMIN" : userCount === 0 ? "ADMIN" : "USER";

    let generatedPassword = null;

    if (!password) {
      generatedPassword = generatePassword();
      password = generatedPassword;
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role: finalRole,
      },
    });

    if (generatedPassword) {
      await sendMailIfPossible({
        from: `"Task Manager" <${process.env.EMAILID}>`,
        to: email,
        subject: "Your account has been created",
        html: `
          <h3>Welcome to Task Manager</h3>
          <p>Hello <b>${name}</b>,</p>
          <p>Your account has been created.</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Password:</b> ${generatedPassword}</p>
          <p>Please login and change your password.</p>
        `,
      });
    }

    return res.status(201).json({
      message: "User created successfully",
      autoPasswordSent: Boolean(generatedPassword),
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Password is wrong" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      secretKey,
      { expiresIn: "1h" },
    );

    return res.status(200).json({
      message: "Welcome",
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.all = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Only admins can view all users" });
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user.id },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({
      message: "Users fetched",
      existingUsers: users.map(serializeUser),
    });
  } catch (error) {
    console.error("Fetch users error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.adminCreateUser = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Only admins can create users" });
    }

    let { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    email = String(email).trim().toLowerCase();
    name = String(name).trim();
    const finalRole = role === "ADMIN" ? "ADMIN" : "USER";

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role: finalRole,
      },
    });

    return res.status(201).json({
      message: "User created successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Admin create user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.adminGetUser = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Only admins can view user details" });
    }

    const { user, assignedTasks, createdTasks } = await getUserTaskDetails(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: serializeUser(user),
      assignedTasks,
      createdTasks,
    });
  } catch (error) {
    console.error("Admin get user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.adminUpdateUser = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Only admins can update users" });
    }

    const targetId = req.params.id;
    const existingUser = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email, password, role } = req.body;
    const data = {};

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ message: "Name is not valid" });
      }

      data.name = String(name).trim();
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({ message: "Email is not valid" });
      }

      const emailOwner = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (emailOwner && emailOwner.id !== targetId) {
        return res.status(400).json({ message: "Email already exists" });
      }

      data.email = normalizedEmail;
    }

    if (password !== undefined) {
      if (!String(password).trim()) {
        return res.status(400).json({ message: "Password is not valid" });
      }

      data.password = await bcrypt.hash(String(password), 10);
    }

    if (role !== undefined) {
      data.role = role === "ADMIN" ? "ADMIN" : "USER";
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data,
    });

    return res.status(200).json({
      message: "User updated successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Admin update user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.profile = async (req, res) => {
  try {
    const [countTaskAssignedToMe, countTaskAssignedByMe, countTodoTask, countDoneTask] =
      await Promise.all([
        prisma.task.count({ where: { assignedToId: req.user.id } }),
        prisma.task.count({ where: { createdById: req.user.id } }),
        prisma.task.count({
          where: {
            assignedToId: req.user.id,
            column: { title: { in: ["Todo", "In Progress"] } },
          },
        }),
        prisma.task.count({
          where: {
            assignedToId: req.user.id,
            column: { title: "Done" },
          },
        }),
      ]);

    return res.status(200).json({
      userDetail: serializeUser(req.user),
      countTaskAssignedToMe,
      countTaskAssignedByMe,
      countPendingTask: countTodoTask,
      countCompletedTask: countDoneTask,
    });
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ message: "Failed to load profile" });
  }
};

exports.assigntask = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Only admins can assign tasks" });
    }

    const { taskTitle, assignedTo, urgency, color, taskDescription, boardId, status, dueDate } =
      req.body;

    if (!taskTitle || !assignedTo || !boardId) {
      return res.status(400).json({ message: "Board, title and assigned user are required" });
    }

    const [assignee, board, column] = await Promise.all([
      prisma.user.findUnique({ where: { id: assignedTo } }),
      prisma.board.findUnique({ where: { id: boardId } }),
      getBoardColumn(boardId, status || "Todo"),
    ]);

    if (!assignee) {
      return res.status(404).json({ message: "Assigned user not found" });
    }

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const hasAccess = await canAccessBoard(req.user, boardId);

    if (!hasAccess) {
      return res.status(403).json({ message: "You do not have access to this board" });
    }

    if (!column) {
      return res.status(400).json({ message: "Invalid task status column" });
    }

    const task = await prisma.task.create({
      data: {
        title: taskTitle,
        description: taskDescription || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: getPriorityValue(urgency),
        color: color || "#6366f1",
        boardId,
        columnId: column.id,
        assignedToId: assignedTo,
        createdById: req.user.id,
      },
      include: TASK_INCLUDE,
    });

    await sendMailIfPossible({
      from: `"Task Manager" <${process.env.EMAILID}>`,
      to: assignee.email,
      subject: "New task assigned",
      html: `
        <h3>New task assigned</h3>
        <p>Hello <b>${assignee.name}</b>,</p>
        <p>You have been assigned a task on <b>${board.title}</b>.</p>
        <p><b>Title:</b> ${task.title}</p>
        <p><b>Status:</b> ${task.column.title}</p>
      `,
    });

    return res.status(201).json({
      message: "Task created successfully",
      task: serializeTask(task),
    });
  } catch (error) {
    console.error("Assign task error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, password, confirmPassword } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Name is not valid" });
    }

    const updateData = {
      name: String(name).trim(),
    };

    if (password || confirmPassword) {
      if (!password || !confirmPassword) {
        return res.status(400).json({ message: "Both password fields are required" });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    return res.status(200).json({
      message: "User updated successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.mytasks = async (req, res) => {
  try {
    const [userList, assignedToMeRaw, assignedByMeRaw] = await Promise.all([
      prisma.user.findMany({
        where: { id: { not: req.user.id } },
        orderBy: { name: "asc" },
      }),
      prisma.task.findMany({
        where: { assignedToId: req.user.id },
        include: TASK_INCLUDE,
        orderBy: { createdAt: "desc" },
      }),
      prisma.task.findMany({
        where: { createdById: req.user.id },
        include: TASK_INCLUDE,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const assignedToMe = assignedToMeRaw.map(serializeTask);
    const assignedByMe = assignedByMeRaw.map(serializeTask);

    const toMeGrouped = Object.values(
      assignedToMe.reduce((acc, task) => {
        const key = task.assignedBy?.id;
        if (!key) return acc;

        if (!acc[key]) {
          acc[key] = {
            userId: key,
            name: task.assignedBy.name,
            email: task.assignedBy.email,
            taskCount: 0,
          };
        }

        acc[key].taskCount += 1;
        return acc;
      }, {}),
    );

    const byMeGrouped = Object.values(
      assignedByMe.reduce((acc, task) => {
        const key = task.assignedTo?.id;
        if (!key) return acc;

        if (!acc[key]) {
          acc[key] = {
            userId: key,
            name: task.assignedTo.name,
            email: task.assignedTo.email,
            taskCount: 0,
          };
        }

        acc[key].taskCount += 1;
        return acc;
      }, {}),
    );

    return res.status(200).json({
      userList: userList.map(serializeUser),
      countTaskAssignedToMe: assignedToMe.length,
      countTaskAssignedByMe: assignedByMe.length,
      taskByPersonsToMe: toMeGrouped,
      taskByPersonsByMe: byMeGrouped,
      assignedToMe,
      assignedByMe,
      userId: req.user.id,
    });
  } catch (error) {
    console.error("My tasks error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: TASK_INCLUDE,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isAssignee = task.assignedToId === req.user.id;
    const admin = isAdmin(req.user);

    if (!admin && !isAssignee) {
      return res.status(403).json({ message: "You are not authorized to update this task" });
    }

    const data = {};
    const { taskTitle, taskDescription, urgency, color, assignedTo, boardId, status, dueDate } =
      req.body;

    if (admin || isAssignee) {
      if (taskTitle !== undefined) data.title = taskTitle;
      if (taskDescription !== undefined) data.description = taskDescription || null;
      if (urgency !== undefined) data.priority = getPriorityValue(urgency);
      if (color !== undefined) data.color = color;
      if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (admin) {
      if (assignedTo !== undefined) {
        const assignee = await prisma.user.findUnique({ where: { id: assignedTo } });

        if (!assignee) {
          return res.status(404).json({ message: "Assigned user not found" });
        }

        data.assignedToId = assignedTo;
      }
    }

    if (boardId && admin) {
      const targetBoard = await prisma.board.findUnique({ where: { id: boardId } });

      if (!targetBoard) {
        return res.status(404).json({ message: "Board not found" });
      }

      data.boardId = boardId;
    }

    if (status !== undefined) {
      const targetBoardId = data.boardId || task.boardId;
      const targetColumn = await getBoardColumn(targetBoardId, status);

      if (!targetColumn) {
        return res.status(400).json({ message: "Invalid task status" });
      }

      data.columnId = targetColumn.id;
    }

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data,
      include: TASK_INCLUDE,
    });

    return res.status(200).json({
      message: `Task "${updatedTask.title}" has been updated`,
      task: serializeTask(updatedTask),
    });
  } catch (error) {
    console.error("Update task error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!isAdmin(req.user) && task.createdById !== req.user.id) {
      return res.status(403).json({ message: "Only task creator can delete this task" });
    }

    await prisma.task.delete({ where: { id: task.id } });

    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.practice = async (req, res) => {
  try {
    const [tasks, totalTaskAssignedToMe, totalTaskAssignedByMe, otherUsers] =
      await Promise.all([
        prisma.task.findMany({ include: TASK_INCLUDE, orderBy: { createdAt: "desc" } }),
        prisma.task.count({ where: { assignedToId: req.user.id } }),
        prisma.task.count({ where: { createdById: req.user.id } }),
        prisma.user.findMany({ where: { id: { not: req.user.id } } }),
      ]);

    return res.status(200).json({
      name: req.user.name,
      tasks: tasks.map(serializeTask),
      totalTasksCount: tasks.length,
      totalTaskAssignedToMe,
      totalTaskAssignedByMe,
      otherUserNameThanMe: otherUsers.map(serializeUser),
      detailsOfTask: tasks.filter((task) => task.createdById === req.user.id).map(serializeTask),
    });
  } catch (error) {
    console.error("Practice error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const where = isAdmin(req.user)
      ? {}
      : {
          OR: [{ assignedToId: req.user.id }, { createdById: req.user.id }],
        };

    const tasks = await prisma.task.findMany({
      where,
      include: TASK_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      message: "All tasks fetched",
      tasks: tasks.map(serializeTask),
    });
  } catch (error) {
    console.error("Get all tasks error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.reassignTask = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Only admins can reassign tasks" });
    }

    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      include: TASK_INCLUDE,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const nextAssignee = await prisma.user.findUnique({
      where: { id: req.body.newUserId },
    });

    if (!nextAssignee) {
      return res.status(404).json({ message: "User not found" });
    }

    const todoColumn = await getBoardColumn(task.boardId, "Todo");

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        assignedToId: nextAssignee.id,
        columnId: todoColumn ? todoColumn.id : task.columnId,
      },
      include: TASK_INCLUDE,
    });

    return res.status(200).json({
      message: "Task reassigned",
      task: serializeTask(updatedTask),
      previous: {
        assignedTo: task.assignedToId,
        status: task.column.title,
      },
    });
  } catch (error) {
    console.error("Reassign task error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Only admins can delete users" });
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "Admin cannot delete own account here" });
    }

    await prisma.$transaction([
      prisma.task.deleteMany({
        where: {
          OR: [{ assignedToId: req.params.id }, { createdById: req.params.id }],
        },
      }),
      prisma.board.deleteMany({ where: { ownerId: req.params.id } }),
      prisma.user.delete({ where: { id: req.params.id } }),
    ]);

    return res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ message: "Failed to delete user" });
  }
};
