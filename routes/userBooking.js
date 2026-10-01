const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

router.get("/", isLoggedIn, wrapAsync(bookingController.renderMyBookings));

router.patch("/:id/cancel", isLoggedIn, wrapAsync(bookingController.cancelBooking));

module.exports = router;
