import express from "express";
import multer from "multer";
import path from "path";
import { uploadVideo, getVideos } from "../controllers/videoController.js";

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// Routes
router.post(
  "/upload",
  upload.fields([{ name: "video" }, { name: "cover" }]),
  uploadVideo
);

router.post("/test", (req, res) => {
  res.json({ message: "Test route works!" });
});

router.get("/", getVideos);

export default router;
