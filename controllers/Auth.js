const User = require("../models/User");
const otpGenerator = require("otp-generator");
const Profile=require("../models/Profile")
const OTP = require("../models/OTP");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
require("dotenv").config();
const passwordUpdated=require("../mail/templates/passwordUpdate")

//sendOTP

exports.sendOTP = async (req, res) => {
  try {
    console.log("this is send otp")
    const { email } = req.body;
    const alreadyExist = await User.findOne({ email });

    if (alreadyExist) {
      return res.status(401).json({
        success: false,
        message: "User already registered",
      });
    }

    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    console.log("OTP Registered", otp);

    let result = await OTP.findOne({ otp });

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });

      result = await OTP.findOne({ otp });
    }

    const otpPayload = { email, otp };

    const otpBody = await OTP.create(otpPayload);

    res.status(200).json({
      success: true,
      message: "OTP Sent Successfully",
      otp,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: false,
      message: error.message,
    });
  }
};

//signUp

exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !accountType ||
      !contactNumber ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "all fiels required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(
        (400).json({
          success: false,
          message:
            "Password and ConfirmPassword Value does not match, please try again",
        })
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User is already registered",
      });
    }

    const recentOtp = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);

      console.log()

    console.log(recentOtp);

    if (recentOtp.length == 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid Otp",
      });
    } else if (recentOtp[0].otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid Otp",
      });
    }

    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    let approved = "";

    approved === "Instructor" ? (approved = false) : (approved = true);

    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType,
      approved,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    //return res
    return res.status(200).json({
      success: true,
      message: "User is registered Successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "User vannot be registerd please try again",
    });
  }
};

//Login

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validation data
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "All fields are required, please try again",
      });
    }

    const existUser = await User.findOne({ email }).populate(
      "additionalDetails"
    );

    if (!existUser) {
      return res.status(401).json({
        success: false,
        message: "User is not registrered, please signup first",
      });
    }

    if (await bcrypt.compare(password, existUser.password)) {
      const payload = {
        email: existUser.email,
        id: existUser._id,
        accountType: existUser.accountType,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });

      existUser.token = token;
      existUser.password = undefined;

      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };

      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        existUser,
        message: "Logged in successfully",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Login Failure, please try again",
    });
  }
};

//changePassword

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(req.user.id);

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "The Old Password is incorrect",
      });
    }

    // Match new password and confirm new password
    if (newPassword !== confirmPassword) {
      // If new password and confirm new password do not match, return a 400 (Bad Request) error
      return res.status(400).json({
        success: false,
        message: "The password and confirm password does not match",
      });
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 10);

    const updatedPassword = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    );

    //send notification email

    try {
      const emailResponse = await mailSender(
        user.email,
        "Change password email",
        passwordUpdated(
          user.email,
          `Password updated successfully for ${user.firstName} ${user.lastName}`
        )
      );

      console.log("Email sent successfully:", emailResponse.response);
    } catch (error) {
      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while sending email:", error);
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error("Error occurred while updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    });
  }
};
