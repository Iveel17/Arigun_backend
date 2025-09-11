// routes/videoRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import { uploadVideo, getVideos } from "../controllers/videoController.js";

const router = express.Router();

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "video") {
      cb(null, "uploads/videos/");
    } else if (file.fieldname === "cover") {
      cb(null, "uploads/covers/");
    } else {
      cb(null, "uploads/others/");
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Expect fields: one video, one cover
router.post(
  "/upload",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  uploadVideo
);

router.get("/", getVideos);
export default router;
