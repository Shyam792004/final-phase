const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB(); // ⭐ MUST EXIST

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/family", require("./routes/familyAuthRoutes"));

app.get("/", (req, res) => {
  res.send("NightSafe Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});