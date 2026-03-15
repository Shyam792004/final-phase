const FamilyUser = require("../models/FamilyUser");

exports.familySignup = async (req, res) => {
  try {
    const { name, phone, memberType, username, password, location } = req.body;

    // check existing username or phone
    const existingUser = await FamilyUser.findOne({
      $or: [{ username }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    // create user (NO HASHING)
    const user = await FamilyUser.create({
      name,
      phone,
      memberType,
      username,
      password,
      location
    });

    // remove password from response
    const safeUser = {
      _id: user._id,
      name: user.name,
      username: user.username,
      phone: user.phone,
      memberType: user.memberType,
      location: user.location
    };

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: safeUser
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};