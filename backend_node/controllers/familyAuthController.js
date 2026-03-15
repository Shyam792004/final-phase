const FamilyUser = require("../models/FamilyUser");
const LoginLog = require("../models/LoginLog");
const jwt = require("jsonwebtoken");

exports.familyLogin = async (req, res) => {
  try {
    // ⭐ receive device info from frontend
    const { emailOrUsername, password, deviceInfo } = req.body;

    const user = await FamilyUser.findOne({
      $or: [
        { username: emailOrUsername },
        { phone: emailOrUsername },
        { name: emailOrUsername }
      ]
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    // simple password check (NO HASHING)
    if (password !== user.password) {
      return res.status(400).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    // ⭐ SAVE LOGIN LOG (THIS WAS MISSING)
    await LoginLog.create({
      userId: user._id,
      username: user.username,
      deviceInfo: deviceInfo || "Unknown Device"
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const safeUser = {
      _id: user._id,
      name: user.name,
      username: user.username,
      phone: user.phone,
      memberType: user.memberType,
      location: user.location
    };

    res.json({
      success: true,
      token,
      user: safeUser
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};