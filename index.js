import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import pkg from "cloudinary";
const { v2: cloudinary } = pkg;
import { CloudinaryStorage } from "multer-storage-cloudinary";

import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/post.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postsRoutes from "./routes/posts.js";
import verifyToken from "./middleware/auth.js";

/* CONFIGURATIONS */
const __dirname = path.dirname(__filename);
dotenv.config();


const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
 app.use(
  cors({
    origin: "*",
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders:
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  })
app.use("/assets", express.static(path.join(__dirname, "public/assets")));


/* CLOUDINARY CONFIGURATION */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* FILE STORAGE */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Social App",
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

const upload = multer({ storage });

/* ROUTES WITH FILES */
app.post("/auth/register", upload.single("picture"), (req, res, next) => {
  console.log(req.file); // Check the file details
  register(req, res, next);
});

app.post("/posts", verifyToken, upload.single("picture"), (req, res, next) => {
  if (!req.file) {
    return res.status(400).send({ message: "File upload failed." });
  }
  createPost(req, res, next);
});

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postsRoutes);

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001;
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
    /* ADD DATA ONE TIME */
    // User.insertMany(users);
    // Post.insertMany(posts);
  })
  .catch((error) => console.log(`${error} did not connect`));
