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
    // console.log("get/", req.session);
    if (req.session.userId) {
        return res.redirect("/thanks");
    }
    res.redirect("/petition");
});

app.get("/petition", (req, res) => {
    // console.log("get/petition", req.session);
    if (req.session.userId) {
        return res.redirect("/thanks");
    }
    res.render("home", { layout: "main", db });
});

app.get("/register", (req, res) => {
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
            console.log("hashedPWd :", hashedPw);
            db.addUsersInfo(first, last, email, hashedPw).then(({ rows }) => {
                req.session.userId = rows[0].id;
                res.redirect("/petition");
            });

            // at this point in time you want to inser the user's data
            // into your db; you want to insert first, last, email and hashedPW
            // I WILL HARD CODE A STATUS RESPONSE
        })
        .catch((err) => console.log("err in hash", err));
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    res.redirect("/petition");
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
            console.error("error in getting signatures", err);
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

app.listen(8080, () => console.log("petition-project server listening"));
