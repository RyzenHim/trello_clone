const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;

app.use(
  cors({
    origin: ["http://localhost:5173", "https://trello-clone-sigma.vercel.app"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/user", require("./routes/userRoute"));
app.use("/boards", require("./routes/boardRoute"));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(port, () => console.log(`Server started at port ${port}`));
