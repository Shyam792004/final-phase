const router = require("express").Router();

const { familyLogin } = require("../controllers/familyAuthController");
const { familySignup } = require("../controllers/familySignupController");

router.post("/login", familyLogin);
router.post("/signup", familySignup);

module.exports = router;