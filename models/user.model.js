import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verifyOTP: { type: String, default: "" },
  vOTPexpireAt: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  resetOTP: { type: String, default: "" },
  rOTPexpireAt: { type: Number, default: 0 },
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;

