// Server Side Validation for Listing Schema :-
const Joi = require("joi");

module.exports.listingSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().required().min(0),
    location: Joi.string().required(),
    country: Joi.string().required(),
    category: Joi.string().valid("Trending", "Rooms", "Iconic Cities", "Mountains", "Castles", "Campings", "Farms", "Arctic", "Boats").required(),
    image: Joi.any().optional()
}).required().messages({
    "any.required": "Listing data is required"
});;

// Server Side Validation for Review Schema :-
module.exports.ReviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required()
    }).required()
}).required();