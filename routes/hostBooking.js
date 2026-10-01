const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, validateBookingStatus } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

router.get("/", isLoggedIn, wrapAsync(bookingController.renderHostBookings));

router.patch("/:id", isLoggedIn, validateBookingStatus, wrapAsync(bookingController.updateBookingStatus));

module.exports = router;
