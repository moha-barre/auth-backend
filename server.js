import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mogodb.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
const app = express();

const port = process.env.PORT || 4000;
const msg = `server is running on http:localhost:${port}`;

connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true }));

// API endpoints
app.get("/", (req, res) => {
  res.send(msg);
});
app.use("/api/auth", authRouter);
app.use('/api/users', userRouter)

app.listen(port, () => {
  console.log(msg);
});
