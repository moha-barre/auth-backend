import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import cookie from "cookie-parser";
import transporter from "../config/nodemailer.js";

// register controller function
export const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: "Missing details" });
  }
  try {
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }
    const hashedPass = await bcrypt.hash(password, 10);

    const user = new userModel({ username, email, password: hashedPass });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const mailoptions = {
      from: process.env.USER_EMAIL,
      to: email,
      subject: "Welcome message",
      text: `Welcome to mobarre! Your account has been created with email id ${email} successfully.`,
    };
    await transporter.sendMail(mailoptions);

    return res.json({ success: true, message: "Registered successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// login controller function
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required" });
  }
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true, message: "Logged in successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// log out controller function
export const logOut = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendVerifyOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "User already verified" });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOTP = otp;
    user.vOTPexpireAt = Date.now() + 15 * 60 * 1000;
    await user.save();
    const mailoption = {
      from: process.env.USER_EMAIL,
      to: user.email,
      subject: "Verification OTP",
      text: `Your OTP is ${otp}. Verify your account using this code.`,
    };
    await transporter.sendMail(mailoption);
    return res.json({ success: true, message: "Sent OTP successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// verify email otp controller function
export const verifyEmailOtp = async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) {
    return res.status(400).json({ success: false, message: "Missing details" });
  }
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid user" });
    }
    if (!user.verifyOTP || user.verifyOTP !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    if (user.vOTPexpireAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }
    user.isVerified = true;
    user.verifyOTP = "";
    user.vOTPexpireAt = 0;
    await user.save();
    return res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const isAuthanticated = async (req, res) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOTP = otp;
    user.rOTPexpireAt = Date.now() + 10 * 60 * 1000;
    await user.save();
    const mailoption = {
      from: process.env.USER_EMAIL,
      to: user.email,
      subject: "Reset password OTP",
      text: `Your reset OTP is ${otp}. Use this OTP to proceed resetting your password.`,
    };
    await transporter.sendMail(mailoption);
    return res.json({ success: true, message: "Sent reset OTP successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resetingPass = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Missing details to reset" });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (!user.resetOTP || user.resetOTP !== otp) {
      return res.status(400).json({ success: false, message: "Invalid reset OTP" });
    }
    if (user.rOTPexpireAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.rOTPexpireAt = 0;
    user.resetOTP = '';
    await user.save();
    return res.json({ success: true, message: 'Reset password successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
