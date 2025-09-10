import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String }, // 🆕 small note or description
  coverImage: { type: String }, // 🆕 filename for cover picture
  filePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional if linked to auth
});

export default mongoose.model("Video", videoSchema);
