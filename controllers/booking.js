const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const startOfTodayUtc = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

module.exports.createBooking = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    throw new ExpressError(404, "Listing not found.");
  }

  if (!listing.owner || listing.owner.equals(req.user._id)) {
    throw new ExpressError(403, "You cannot book your own listing.");
  }

  const { checkIn, checkOut, guests, guestMessage } = req.validatedBooking;
  if (checkIn < startOfTodayUtc()) {
    throw new ExpressError(400, "Check-in date cannot be in the past.");
  }

  const maxGuests = listing.maxGuests || 1;
  if (guests > maxGuests) {
    throw new ExpressError(400, `This listing allows a maximum of ${maxGuests} guests.`);
  }

  const nights = (checkOut.getTime() - checkIn.getTime()) / DAY_IN_MILLISECONDS;
  if (!Number.isInteger(nights) || nights < 1) {
    throw new ExpressError(400, "Choose a valid check-in and check-out date.");
  }

  const pricePerNightPaise = Math.round(Number(listing.price) * 100);
  if (!Number.isSafeInteger(pricePerNightPaise) || pricePerNightPaise < 0) {
    throw new ExpressError(500, "This listing has an invalid price.");
  }

  const totalAmountPaise = pricePerNightPaise * nights;
  if (!Number.isSafeInteger(totalAmountPaise)) {
    throw new ExpressError(500, "Booking total could not be calculated safely.");
  }

  const hasConfirmedConflict = await Booking.exists({
    listing: listing._id,
    status: "confirmed",
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  });

  if (hasConfirmedConflict) {
    throw new ExpressError(409, "These dates are no longer available.");
  }

  await Booking.create({
    listing: listing._id,
    guest: req.user._id,
    checkIn,
    checkOut,
    guests,
    nights,
    pricePerNightPaise,
    totalAmountPaise,
    guestMessage,
  });

  req.flash("success", "Booking request sent to the host.");
  res.redirect(`/listings/${listing._id}`);
};

module.exports.renderMyBookings = async (req, res) => {
  const bookings = await Booking.find({ guest: req.user._id })
    .populate("listing", "title image location country")
    .sort({ createdAt: -1 });

  res.render("bookings/index.ejs", { bookings });
};

module.exports.renderHostBookings = async (req, res) => {
  const listings = await Listing.find({ owner: req.user._id }).select("_id");
  const listingIds = listings.map((listing) => listing._id);

  const bookings = await Booking.find({ listing: { $in: listingIds } })
    .populate("listing", "title location country")
    .populate("guest", "username")
    .sort({ createdAt: -1 });

  res.render("bookings/host.ejs", { bookings });
};

module.exports.updateBookingStatus = async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("listing", "owner title");
  if (!booking) {
    throw new ExpressError(404, "Booking not found.");
  }

  if (!booking.listing || !booking.listing.owner.equals(req.user._id)) {
    throw new ExpressError(403, "You can only manage bookings for your own listings.");
  }

  if (booking.status !== "pending") {
    throw new ExpressError(400, "Only pending booking requests can be updated.");
  }

  const newStatus = req.validatedBookingStatus;
  if (newStatus === "confirmed") {
    const hasConfirmedConflict = await Booking.exists({
      listing: booking.listing._id,
      status: "confirmed",
      _id: { $ne: booking._id },
      checkIn: { $lt: booking.checkOut },
      checkOut: { $gt: booking.checkIn },
    });

    if (hasConfirmedConflict) {
      throw new ExpressError(409, "These dates conflict with an existing confirmed booking.");
    }
  }

  booking.status = newStatus;
  booking.statusUpdatedAt = new Date();
  await booking.save();

  req.flash("success", `Booking request ${newStatus}.`);
  res.redirect("/host/bookings");
};
