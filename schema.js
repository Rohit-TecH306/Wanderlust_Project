// Server Side Validation for Listing Schema :-
const Joi = require("joi");

module.exports.listingSchema = Joi.object({
    title: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().min(10).max(2000).required(),
    price: Joi.number().min(0).required(),
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