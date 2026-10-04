const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, validateHostOnboarding } = require("../middleware.js");
const hostOnboardingController = require("../controllers/hostOnboarding.js");

router.route("/become-a-host")
    .get(isLoggedIn, wrapAsync(hostOnboardingController.renderOnboarding))
    .post(isLoggedIn, validateHostOnboarding, wrapAsync(hostOnboardingController.completeOnboarding));

module.exports = router;
