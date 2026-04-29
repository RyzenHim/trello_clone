const express = require("express");
const auth = require("../middleware/auth");
const boardController = require("../controller/boardController");

const router = express.Router();

router.get("/", auth, boardController.listBoards);
router.post("/", auth, boardController.createBoard);
router.post("/:id/columns", auth, boardController.addColumn);
router.patch("/:id/columns/:columnId", auth, boardController.updateColumn);
router.delete("/:id/columns/:columnId", auth, boardController.deleteColumn);
router.get("/:id", auth, boardController.getBoard);
router.delete("/:id", auth, boardController.deleteBoard);

module.exports = router;
