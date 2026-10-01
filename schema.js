// Server Side Validation for Listing Schema :-
const Joi = require("joi");

module.exports.listingSchema = Joi.object({
    title: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().min(10).max(2000).required(),
    price: Joi.number().min(0).required(),
    maxGuests: Joi.number().integer().min(1).max(50).required(),
    location: Joi.string().trim().min(2).max(100).required(),
    country: Joi.string().trim().min(2).max(100).required(),
    category: Joi.string().valid("Trending", "Rooms", "Iconic Cities", "Mountains", "Castles", "Campings", "Farms", "Arctic", "Boats").required()
}).required().unknown(false).messages({
    "any.required": "Listing data is required"
});;

// Server Side Validation for Review Schema :-
module.exports.ReviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required()
    }).required()
}).required();

// This validates only data sent by a guest while creating a booking request.
// Pricing and status are calculated and assigned by the server, never accepted
// from a browser request.
module.exports.bookingSchema = Joi.object({
    booking: Joi.object({
        checkIn: Joi.date().iso().required(),
        checkOut: Joi.date().iso().greater(Joi.ref("checkIn")).required(),
        guests: Joi.number().integer().min(1).max(50).required(),
        guestMessage: Joi.string().trim().max(500).allow("").optional()
    }).required().unknown(false)
}).required().unknown(false);

module.exports.bookingStatusSchema = Joi.object({
    booking: Joi.object({
        status: Joi.string().valid("confirmed", "rejected").required()
    }).required().unknown(false)
}).required().unknown(false);
