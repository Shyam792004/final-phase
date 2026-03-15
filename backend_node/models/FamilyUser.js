const mongoose = require("mongoose");

const familyUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, unique: true },
    phone: { type: String, unique: true },
    password: { type: String, required: true },
    memberType: String,
    location: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("FamilyUser", familyUserSchema);