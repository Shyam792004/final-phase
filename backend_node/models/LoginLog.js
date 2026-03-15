const mongoose = require("mongoose");

const loginLogSchema = new mongoose.Schema(
  {
    userId: String,
    username: String,
    deviceInfo: String,
    loginTime: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoginLog", loginLogSchema);