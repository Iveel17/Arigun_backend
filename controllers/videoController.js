import Video from "../models/Video.js";

export const uploadVideo = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    const { title, subtitle } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!req.files?.video?.[0]) {
      return res.status(400).json({ error: "Video file is required" });
    }

    const video = new Video({
      title,
      subtitle,
      filePath: req.files?.video?.[0]?.filename,   // multer stores video
      coverImage: req.files?.cover?.[0]?.filename, // multer stores cover pic
    });

    await video.save();
    res.json({ 
      message: "Video uploaded successfully!", 
      video: {
        _id: video._id,
        title: video.title,
        subtitle: video.subtitle,
        filePath: video.filePath,
        coverImage: video.coverImage,
        uploadedAt: video.uploadedAt,
        user: video.user
      } });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};

export const getVideos = async (req, res) => {
  try {
    const videos = await Video.find().sort({ uploadedAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};
