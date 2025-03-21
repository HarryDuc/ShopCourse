import BannedWord from "../models/BannedWord.js";

// Lấy danh sách từ cấm
export const getBannedWords = async (req, res) => {
  try {
    const bannedWords = await BannedWord.find().sort("-createdAt");
    res.status(200).json({
      success: true,
      data: bannedWords,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Thêm từ cấm mới
export const addBannedWord = async (req, res) => {
  try {
    const { word, category } = req.body;

    // Kiểm tra từ đã tồn tại chưa
    const existingWord = await BannedWord.findOne({ word: word.toLowerCase() });
    if (existingWord) {
      return res.status(400).json({
        success: false,
        message: "Từ này đã có trong danh sách cấm",
      });
    }

    const bannedWord = new BannedWord({
      word: word.toLowerCase(),
      category,
    });

    await bannedWord.save();

    res.status(201).json({
      success: true,
      data: bannedWord,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Xóa từ cấm
export const deleteBannedWord = async (req, res) => {
  try {
    const { id } = req.params;
    const bannedWord = await BannedWord.findByIdAndDelete(id);

    if (!bannedWord) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy từ cấm",
      });
    }

    res.status(200).json({
      success: true,
      message: "Đã xóa từ cấm thành công",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Cập nhật từ cấm
export const updateBannedWord = async (req, res) => {
  try {
    const { id } = req.params;
    const { word, category } = req.body;

    const bannedWord = await BannedWord.findById(id);
    if (!bannedWord) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy từ cấm",
      });
    }

    // Kiểm tra nếu từ mới đã tồn tại (trừ từ hiện tại)
    if (word && word !== bannedWord.word) {
      const existingWord = await BannedWord.findOne({
        word: word.toLowerCase(),
        _id: { $ne: id },
      });
      if (existingWord) {
        return res.status(400).json({
          success: false,
          message: "Từ này đã có trong danh sách cấm",
        });
      }
      bannedWord.word = word.toLowerCase();
    }

    if (category) {
      bannedWord.category = category;
    }

    await bannedWord.save();

    res.status(200).json({
      success: true,
      data: bannedWord,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
