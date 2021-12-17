const express = require("express");

const app = express();

const res = require("express/lib/response");

const { engine } = require("express-handlebars");

const db = require("./db");

const cookieSession = require("cookie-session");

// const helmet = require("helmet");

let sessionSescret = process.env.COOKIE_SECRET;

if (!sessionSecret) {
    sessionSecret = require("./secrets").COOKIE_SECRET;
}

const req = require("express/lib/request");

const { hash, compare } = require("./bc");
const { redirect } = require("express/lib/response");

////////////////prevent clickjacking/////////////////////////////
app.use((req, res, next) => {
    res.setHeader("x-frame-options", "deny");
    next();
});
//////////////////////////////////////////////////////////////////

app.engine("handlebars", engine());

app.set("view engine", "handlebars");

app.use(
    cookieSession({
        secret: secrets.COOKIE_SECRET,
        maxAge: 1000 * 60 * 60 * 24 * 14,
        sameSite: true,
    })
);

app.use(express.static("./public"));

if (process.env.NODE_ENV == "production") {
    app.use((req, res, next) => {
        if (req.headers["x-forwarded-proto"].startsWith("https")) {
            return next();
        }
        res.redirect(`https://${req.hostname}${req.url}`);
    });
}

app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.redirect("/petition");
});

app.get("/petition", (req, res) => {
    console.log("get/petition", req.session);
    if (req.session.userId) {
        if (req.session.signatureId) {
            return res.redirect("/thanks");
        } else {
            res.render("home", { layout: "main", db });
        }
    } else {
        return res.redirect("/register");
    }
});

app.post("/petition", (req, res) => {
    // console.log("post/petition");
    const { signature } = req.body;

    db.addSignatures(signature, req.session.userId)
        .then(({ rows }) => {
            req.session.signatureId = rows[0].id;
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("error in getFullNames:", err);
            res.render("home", { addFullNamesError: true });
        });
});

app.get("/register", (req, res) => {
    if (req.session.userId) {
        res.redirect("/petition");
    }
    res.render("register");
});

app.post("/register", (req, res) => {
    const { first, last, email, password } = req.body;
    // this is where we will receive the user's data that
    // want to register
    // before we insert first, last, email and PW into the db
    // we want to make the PW more secure by hashing it
    hash(password)
        .then((hashedPw) => {
            // console.log("hashedPWd :", hashedPw);
            db.addUsersInfo(first, last, email, hashedPw)
                .then(({ rows }) => {
                    req.session.userId = rows[0].id;

                    res.redirect("/profile");
                })
                .catch((err) => {
                    // console.log("1st err in hash", err);
                    return res.render("register", { addUsersInfoError: true });
                });
        })
        .catch((err) => {
            // console.log("2nd err in hash", err);
            return res.render("register", { addUsersInfoError: true });
        });
});

// app.get("/profile", (req, res) => {
//     res.render("profile");
// });

app.get("/profile", (req, res) => {
    if (req.session.userId) {
        res.render("profile");
    } else {
        return res.redirect("/register");
    }
});

app.post("/profile", (req, res) => {
    let { age, city, url } = req.body;

    console.log("req.body post profile", req.body);

    if (!age && !city && !url) {
        console.log("user didn't give extra data");
        return res.redirect("/petition");
    }
    if (
        url &&
        !url.startsWith("http:") &&
        !url.startsWith("https:") &&
        !url.startsWith("//")
    ) {
        console.log("got my url", url);
        return res.render("profile", {
            addUserProfilesError: true,
        });
    }
    if (age === "") {
        console.log("type of parseint", parseInt(age));
        age = undefined;
    } else if (isNaN(parseInt(age))) {
        console.log("type of parseint", parseInt(age));
        return res.render("profile", {
            addUserProfilesError: true,
        });
    }

    db.addUserProfiles(age, city, url, req.session.userId)
        .then(({ rows }) => {
            console.log("AM I getting here", req.session.profileId);
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("Whats wrong", err);
            console.log("age", age);
            console.log("type of age", typeof age);
            // return res.render("profile", {
            //     addUserProfilesError: true,
            // });
        });
    // }
    // }
});

app.get("/login", (req, res) => {
    if (req.session.userId) {
        res.redirect("/petition");
    }
    res.render("login");
});

app.post("/login", (req, res) => {
    // this is where we will want to use compare
    // we'd first go to the database to retrieve the hash
    // for the email that the user provided
    // const hashFromDatabase =
    //     "I am not a hashed password and when you code this you will use actual value from your database";
    const { email, password } = req.body;

    db.getPasswords(email)
        .then(({ rows }) => {
            // console.log(rows);
            compare(password, rows[0].password)
                .then((match) => {
                    if (match) {
                        console.log("Whats the request", req.session);
                        req.session.userId = rows[0].id;
                        db.getSignatureByUserId(req.session.userId).then(
                            (results) => {
                                if (results.rows.length) {
                                    // console.log("user has signed ");
                                    req.session.signatureId =
                                        results.rows[0].id;
                                }
                                // console.log(
                                //     "requested session for the userID",
                                //     req.session
                                // );
                                res.redirect("/petition");
                            }
                        );
                    } else {
                        // console.log("password incorrect");
                        res.render("login", { getPasswordsError: true });
                    }
                })
                .catch((err) => {
                    console.log("err in compare:", err);
                    res.render("login", { getPasswordsError: true });
                });
        })
        .catch((err) => {
            console.log("err on  getting email:", err);
            res.render("login", { getPasswordsError: true });
        });
});

app.get("/thanks", (req, res) => {
    // console.log(req.session);
    // if (req.session.signatureId) {
    const signature = db.getSignatureById(req.session.signatureId);
    const allSignatures = db.getSignatures();

    Promise.all([signature, allSignatures])
        .then(([result1, result2]) => {
            res.render("thanks", {
                layout: "main",
                db,
                count: result2.rows[0].count,
                signature: result1.rows[0].signature,
            });
        })
        .catch((err) => {
            // console.error("error in getting signatures", err);
            res.redirect("/");
        });
    // }
    // res.redirect("/");
});

app.get("/signers", (req, res) => {
    if (req.session.signatureId) {
        db.getAllSigners()
            .then(({ rows }) => {
                console.log("Whats coming with the rows", rows);
                res.render("signers", {
                    Signatures: rows,
                    helpers: {
                        capitalizeLetter: function (str) {
                            return str[0].toUpperCase() + str.slice(1);
                        },
                    },
                });
            })
            .catch((err) =>
                console.log("error getting names or signatures:", err)
            );
    } else {
        res.redirect("/");
    }
});

app.get("/signers/:city", (req, res) => {
    if (req.session.signatureId) {
        db.getSignersByCity(req.params.city)
            .then(({ rows }) => {
                res.render("signers", {
                    Signatures: rows,
                    city: req.params.city,
                    helpers: {
                        capitalizeLetter: function (str) {
                            return str[0].toUpperCase() + str.slice(1);
                        },
                    },
                });
            })
            .catch((err) =>
                console.log(
                    "error getting names or signatures from each cities:",
                    err
                )
            );
    } else {
        res.redirect("/");
    }
});

app.get("/profile/edit", (req, res) => {
    // console.log("requested session for the edit", req.session);
    if (req.session.userId && req.session.signatureId) {
        db.getDataToEditProfile(req.session.userId)
            .then((result) => {
                const allData = result.rows[0];
                res.render("edit", { allData });
            })
            .catch((err) => console.log("ERROR in geting allData", err));
    } else {
        res.redirect("/");
    }
});

app.post("/profile/edit", (req, res) => {
    // console.log(req.body);
    // console.log(req.session.userId);
    const { first, last, email, password, age, city, url } = req.body;
    if (!req.body.password) {
        const simpleUpdate = db.updateUsersInfoSimple(
            first,
            last,
            email,
            req.session.userId
        );

        const extraInfoUpdate = db.updateUsersExtraInfo(
            age,
            city,
            url,
            req.session.userId
        );

        const updatePassword = db.updatePassword(password, req.session.userId);

        Promise.all([simpleUpdate, extraInfoUpdate])
            .then(([result1, result2]) => {
                res.redirect("/thanks", {
                    layout: "main",
                    db,
                });
            })
            .catch((err) => {
                console.error("error in updating all besides password", err);
                res.redirect("/");
            });
    } else {
        const simpleUpdate = db.updateUsersInfoSimple(
            first,
            last,
            email,
            req.session.userId
        );

        const extraInfoUpdate = db.updateUsersExtraInfo(
            age,
            city,
            url,
            req.session.userId
        );

        const updatePassword = db.updatePassword(password, req.session.userId);

        hash(password).then((hashedPw) => {
            Promise.all([simpleUpdate, extraInfoUpdate, updatePassword])
                .then(([result1, result2, result3]) => {
                    res.redirect("/thanks", {
                        layout: "main",
                        db,
                    });
                })
                .catch((err) => {
                    console.error("error in updating with password", err);
                    res.redirect("/");
                });
        });
    }
});

app.get("*", (req, res) => {
    res.redirect("/");
});

// app.listen(8080, () => console.log("petition-project server listening"));

app.listen(process.env.PORT || 8080, () =>
    console.log("petition-project server listening")
);
