const express = require("express");

const app = express();

const res = require("express/lib/response");

const { engine } = require("express-handlebars");

const db = require("./db");

const cookieSession = require("cookie-session");

const secrets = require("./secrets.json");

const req = require("express/lib/request");

const { hash, compare } = require("./bc");

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

app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.redirect("/petition");
});

app.get("/petition", (req, res) => {
    // console.log("get/petition", req.session);
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

                    res.redirect("/petition");
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
                        req.session.userId = rows[0].id;
                        db.getSignatureById(req.session.userId).then(
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
                    // console.log("err in compare:", err);
                    res.render("login", { getPasswordsError: true });
                });
        })
        .catch((err) => {
            // console.log("err on  getting email:", err);
            res.render("login", { getPasswordsError: true });
        });
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

app.get("/thanks", (req, res) => {
    // console.log(req.session);
    // if (req.session.signatureId) {
    const signature = db.getSignatureById(req.session.signatureId);
    const allSigners = db.getAllSigners();

    Promise.all([signature, allSigners])
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
        db.getFullNames()
            .then(({ rows }) => {
                res.render("signers", {
                    allSigners: rows,
                });
            })
            .catch((err) =>
                console.log("error getting names or signatures:", err)
            );
    } else {
        res.redirect("/");
    }
});

app.get("*", (req, res) => {
    res.redirect("/");
});

app.listen(8080, () => console.log("petition-project server listening"));
