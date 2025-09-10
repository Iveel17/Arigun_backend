import Video from "../models/Video.js";

export const uploadVideo = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    const { title, subtitle } = req.body;

    const video = new Video({
      title,
      subtitle,
      filePath: req.files?.video?.[0]?.filename,   // multer stores video
      coverImage: req.files?.cover?.[0]?.filename, // multer stores cover pic
      user: req.user?._id, // only if you’re using auth
    });

    await video.save();
    res.json({ message: "Video uploaded successfully!", video });
  } catch (err) {
    console.error(err);
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
