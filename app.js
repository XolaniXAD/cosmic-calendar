import express from "express";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files in /public
app.use(express.static("public"));

// View engine (EJS example — you can change this)
app.set("view engine", "ejs");
app.set("views", "./views");

// Import routes
import indexRoutes from "./routes/index.js";
import apiRoutes from "./routes/api.js";

// Register routes
app.use("/", indexRoutes);
app.use("/api", apiRoutes);

// PORT from .env or fallback
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
