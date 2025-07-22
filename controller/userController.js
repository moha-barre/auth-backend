import userModel from "../models/user.model.js";

export const getUserData = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      userData: {
        username: user.username,
        isVerified: user.isVerified,
        email: user.email
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
