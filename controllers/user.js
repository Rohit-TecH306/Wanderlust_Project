const User = require("../models/user.js");

module.exports.signUpForm = (req, res) => {
    res.render("user/signup.ejs");
}

module.exports.signUp = async (req, res, next) => {
    try {
        let { username, email, password } = req.body;
        username = username ? username.trim() : "";
        email = email ? email.trim().toLowerCase() : "";

        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });
        if (existingUser) {
            req.flash("error", "An account with this username or email already exists. Please log in.");
            return res.redirect("/signup");
        }

        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, async (err) => {
            if (err) {
                return next(err);
            }
            await User.updateOne(
                { _id: registeredUser._id },
                { $set: { activeSessionId: req.sessionID } }
            );
            req.flash("success", "Welcome to Wanderlust");
            res.redirect("/listings");
        });
    }
    catch (err) {
        if (err.name === "UserExistsError" || err.code === 11000) {
            req.flash("error", "An account with this username or email already exists. Please log in.");
        } else {
            req.flash("error", err.message);
        }
        res.redirect("/signup");
    }
}

module.exports.loginForm = (req, res) => {
    res.render("user/login.ejs");
}

module.exports.login = async (req, res) => {
    const existingSessionId = req.user.activeSessionId;

    if (existingSessionId && existingSessionId !== req.sessionID) {
        const isSessionAlive = await new Promise((resolve) => {
            req.sessionStore.get(existingSessionId, (err, sess) => {
                if (err || !sess) return resolve(false);
                if (sess.cookie && sess.cookie.expires && new Date(sess.cookie.expires) <= new Date()) {
                    return resolve(false);
                }
                resolve(true);
            });
        });

        if (isSessionAlive) {
            return req.logout((err) => {
                req.flash("error", "This account is already logged in on another device. Please log out from that device to continue.");
                res.redirect("/login");
            });
        }
    }

    const claimed = await User.findOneAndUpdate(
        {
            _id: req.user._id,
            $or: [
                { activeSessionId: null },
                { activeSessionId: existingSessionId },
                { activeSessionId: req.sessionID }
            ]
        },
        { $set: { activeSessionId: req.sessionID } },
        { new: true }
    );

    if (!claimed) {
        return req.logout((err) => {
            req.flash("error", "This account is already logged in on another device. Please log out from that device to continue.");
            res.redirect("/login");
        });
    }

    req.flash("success", "Welcome back to Wanderlust!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
}

module.exports.logout = async (req, res, next) => {
    try {
        if (req.user && req.sessionID) {
            await User.updateOne(
                { _id: req.user._id, activeSessionId: req.sessionID },
                { $set: { activeSessionId: null } }
            );
        }
    } catch (e) {
        console.error("Error clearing active session on logout:", e);
    }
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("error", "You are logged out!");
        req.session.save((err) => {
            if (err) {
                return next(err);
            }
            res.redirect("/listings");
        });
    });
}
