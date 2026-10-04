const Listing = require("../models/listing.js");

const LISTING_CACHE_TTL = 120000;
const listingCache = new Map();

const getCachedListingData = (key) => {
    const cachedValue = listingCache.get(key);
    if (!cachedValue) return null;

    const isFresh = Date.now() - cachedValue.timestamp < LISTING_CACHE_TTL;
    if (!isFresh) {
        listingCache.delete(key);
        return null;
    }

    return cachedValue.data;
};

module.exports.clearListingCache = (key) => {
    listingCache.delete(key);
};

module.exports.index = async (req, res) => {
    const { q, category } = req.query;
    const cacheKey = `listings:${JSON.stringify({ q: q || "", category: category || "" })}`;
    const cachedData = getCachedListingData(cacheKey);

    if (cachedData) {
        return res.render("listings/index.ejs", {
            allListings: cachedData,
            q: q || "",
            selectedCategory: category || ""
        });
    }

    const filters = {};

    if (q && q.trim()) {
        filters.$text = { $search: q.trim() };
    }

    if (category) {
        filters.category = category;
    }

    const allListings = await Listing.find(filters)
        .select("title price image location country category")
        .lean();

    listingCache.set(cacheKey, {
        data: allListings,
        timestamp: Date.now(),
    });

    res.render("listings/index.ejs", { allListings, q: q || "", selectedCategory: category || "" });
}

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
}

module.exports.createListing = async (req, res, next) => {
    if (!req.file) {
        req.flash("error", "Please upload an image before creating the listing.");
        return res.redirect("/listings/new");
    }

    const { location, country } = req.validatedListing;
    const searchQuery = encodeURIComponent(`${location}, ${country}`);
    const geocodingResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${searchQuery}`,
        {
            headers: {
                "User-Agent": "WanderlustStudentProject/1.0"
            }
        }
    );

    if (!geocodingResponse.ok) {
        const error = new Error("Location service is currently unavailable. Please try again.");
        error.statusCode = 503;
        throw error;
    }

    const locations = await geocodingResponse.json();
    if (!locations.length) {
        const error = new Error("Location could not be found. Please enter a valid location and country.");
        error.statusCode = 400;
        throw error;
    }

    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.validatedListing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = {
        type: "Point",
        coordinates: [Number(locations[0].lon), Number(locations[0].lat)]
    };
    await newListing.save();
    req.flash("success", "New Listing Added!");
    res.redirect("/listings");
}

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const cacheKey = `listing:${id}`;
    const cachedListing = getCachedListingData(cacheKey);

    if (cachedListing) {
        return res.render("listings/show.ejs", { listing: cachedListing });
    }

    let listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            select: "comment rating createdAt author",
            populate: {
                path: "author",
                select: "username",
            }
        })
        .populate({
            path: "owner",
            select: "username",
        })
        .lean();

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist !");
        return res.redirect("/listings");
    }

    listingCache.set(cacheKey, {
        data: listing,
        timestamp: Date.now(),
    });

    res.render("listings/show.ejs", { listing });
}

module.exports.editListingForm = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist !");
        return res.redirect("/listings");
    }
    let originalUrl = listing.image.url;
originalUrl = originalUrl.replace("/upload/", "/upload/c_fill,h_300,w_250/");
    res.render("listings/edit.ejs", { listing,originalUrl });
}

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist !");
        return res.redirect("/listings");
    }

    const { location, country } = req.validatedListing;
    const locationChanged =
        listing.location !== location ||
        listing.country !== country;

    if (locationChanged) {
        const searchQuery = encodeURIComponent(`${location}, ${country}`);
        const geocodingResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${searchQuery}`,
            {
                headers: {
                    "User-Agent": "WanderlustStudentProject/1.0"
                }
            }
        );

        if (!geocodingResponse.ok) {
            const error = new Error("Location service is currently unavailable. Please try again.");
            error.statusCode = 503;
            throw error;
        }

        const locations = await geocodingResponse.json();
        if (!locations.length) {
            const error = new Error("Location could not be found. Please enter a valid location and country.");
            error.statusCode = 400;
            throw error;
        }

        listing.geometry = {
            type: "Point",
            coordinates: [Number(locations[0].lon), Number(locations[0].lat)]
        };
    }

    Object.assign(listing, req.validatedListing);

    if (typeof req.file !== "undefined") {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    }

    await listing.save();
    req.flash("success", "Listing Updated !");
    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted !");
    res.redirect("/listings");
}
