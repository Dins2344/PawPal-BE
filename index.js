require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const logger = require("./src/utils/logger");
const connectToDatabase = require("./src/db/connection");
const userRouter = require("./src/routes/user");
const authRouter = require("./src/routes/auth");
const adminRouter = require("./src/routes/admin");
const petRouter = require("./src/routes/pet");

const app = express();

// ─── Global Middleware ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── HTTP Request Logging (Morgan → Winston) ────────────────────────────────
const morganStream = {
    write: (message) => logger.info(message.trim()),
};

app.use(
    morgan(":method :url :status :res[content-length] - :response-time ms", {
        stream: morganStream,
    })
);


// ─── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/pets", petRouter);

// ─── Start Server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

connectToDatabase();

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});