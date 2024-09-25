const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");

//resetPasswordToken

exports.resetPasswordToken = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.json({
        success: false,
        message: "Your Email is not registered with us",
      });
    }

    const token = crypto.randomUUID();
    const updatedDetails = await User.findOneAndUpdate(
      { email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 5 * 60 * 1000,
      },
      { new: true }
    );

    //create url
    const url = `http://localhost:3000/update-password/${token}`;

    await mailSender(email, "Password Reset Link", `Password Reset : ${url}`);

    return res.json({
      success: true,
      message: "Email sent successfully, please check email and change pwd",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending reset pwd mail",
    });
  }
};

//resetPassword

exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword, token } = req.body;
    if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: "Password not matching",
      });
    }
    const userDetails = await User.findOne({ token: token });

    //if no entry - invalid token
    if (!userDetails) {
      return res.json({
        success: false,
        message: "Token is invalid",
      });
    }

    //token time check
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.json({
        success: false,
        message: "Token is expired, please regenerate your token",
      });
    }
    //hash pwd
    const hashedPassword = await bcrypt.hash(password, 10);

    //password update
    await User.findOneAndUpdate(
      { token: token },
      { password: hashedPassword },
      { new: true }
    );

    //return response
    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending reset pwd mail",
    });
  }
};
