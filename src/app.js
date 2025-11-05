const express = require("express");
const cors = require("cors");
const apiRoutes = require("./api/routes");

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
// Mengizinkan akses dari frontend
app.use(express.json()); // Membaca body request sebagai JSON

// Gunakan routes yang sudah kita buat
app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.send("Server Backend MBG Berjalan!");
});

module.exports = app;
