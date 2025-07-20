import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import cookie from "cookie-parser";
import transporter from "../config/nodemailer.js";

// register controller function
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "missing details" });
  }
  try {
    const exstingUser = await userModel.findOne({ email });

    if (exstingUser) {
      return res.json({ success: false, message: "user alreasy exists" });
    }
    const hashedPass = await bcrypt.hash(password, 10);

    const user = new userModel({ name, email, password: hashedPass });

    await user.save();

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1000 ms in a second
    });

    // sending welcome message to email

    const mailoptions = {
      from: process.env.USER_EMAIL,
      to: email,
      subject: "welcome message",
      text: `welcome to mobarre your account has created with email id of ${email} succesfully`,
    };
    await transporter.sendMail(mailoptions);

    return res.json({ success: true, message: "registered in succesfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// login controller function

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: "email and password required" });
  }
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "invalid email" });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "invalid password" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1000 ms in a second
    });

    return res.json({ success: true, message: "loged in succesfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
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
    return res.json({ success: true, message: "loged out succesfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
export const sendVerifyOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "user not found" });
    }

    if (user.isVerified) {
      return res.json({ success: false, message: "user already verified" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.verifyOTP = otp;
    user.vOTPexpireAt = Date.now() + 15 * 60 * 1000;

    await user.save();

    const mailoption = {
      from: process.env.USER_EMAIL,
      to: user.email, // fixed here
      subject: "verification OTP",
      text: `your OTP is ${otp} verify your account using this`,
    };
    await transporter.sendMail(mailoption);
    return res.json({ success: true, message: "sent otp succesfully" }); // fixed key
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// verify email otp controller function

export const verifyEmailOtp = async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) {
    return res.json({ success: false, message: "missing details" });
  }
  try {
    const user = await userModel.findById(userId); // <-- add await
    if (!user) {
      return res.json({ success: false, message: "invalid user" });
    }
    if (!user.verifyOTP || user.verifyOTP !== otp) {
      return res.json({ success: false, message: "invalid otp" });
    }
    if (user.vOTPexpireAt < Date.now()) {
      // <-- fix logic
      return res.json({
        success: false,
        message: "invalid otp, sorry otp expired",
      });
    }

    user.isVerified = true;
    user.verifyOTP = "";
    user.vOTPexpireAt = 0;

    await user.save();

    return res.json({ success: true, message: "email verified succesfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
// check if user is authanticated
export const isAuthanticated = async (req, res) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
// reset otp
export const resetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.json({ success: false, message: "email is reqiured" });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "user not found" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.resetOTP = otp;
    user.rOTPexpireAt = Date.now() + 10 * 60 * 1000;

    await user.save();

    const mailoption = {
      from: process.env.USER_EMAIL,
      to: user.email, // fixed here
      subject: "Reset password OTP",
      text: `your  reset OTP is ${otp} use this otp to proceed reserting your passsword`,
    };
    await transporter.sendMail(mailoption);
    return res.json({ success: true, message: "sent reset otp succesfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
// reset passwprd
export const resetingPass = async (req, res) => {

  try {
    
 
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.json({ success: false, message: "missing datils to reset" });
  }

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.json({ success: false, message: "user not found" });
  }
  if(user.resetOTP === '' || user.resetOTP !== otp){
        return res.json({success: false, message: 'invalid reset otp'})

  }

  if(user.rOTPexpireAt < Date.now()){
        return res.json({success: false, message: 'otp expired'})

  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  user.password = hashedPassword;
  user.rOTPexpireAt =0;
  user.resetOTP = '';

  await user.save()

      return res.json({success: true, message: 'Reseted password succesfuly'})

   } 
   catch (error) {
        return res.json({success: false, message: error.message})

  }
};
