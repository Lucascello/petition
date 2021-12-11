const express = require("express");

const app = express();

const res = require("express/lib/response");

const { engine } = require("express-handlebars");

const db = require("./db");

const cookieSession = require("cookie-session");

const secrets = require("./secrets.json");

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
    res.render("home", { layout: "main", db });
});

app.get("/petition", (req, res) => {
    res.render("home", { layout: "main", db });
});

app.post("/", (req, res) => {
    console.log("REQUESTED BODY", req.body);

    const person = req.body;

    db.addFullNames(person.first, person.last, person.signature)
        .then(() => {
            res.cookie(person.first);
            res.cookie(person.last);
            res.cookie(person.signature);
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("err in getFullNames:", err);
            res.render("home", { layout: "main", db });
        });
});

app.post("/petition", (req, res) => {
    const { first, last, signature } = req.body;

    db.addFullNames(first, last, signature)
        .then(() => {
            res.cookie(first, "Fabrício bonitão");
            res.cookie(last, "bonitão");
            res.cookie(signature);
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("error in getFullNames:", err);
            res.render("home", { layout: "main", db, error: "need to sign" });
        });
});

app.get("/thanks", (req, res) => {
    db.getAllSigners()
        .then(({ rows }) => {
            res.render("thanks", { layout: "main", db, count: rows[0].count });
        })
        .catch((err) => {
            console.error("error in getting signatures", err);
        });
});

app.get("/signers", (req, res) => {
    db.getFullNames()
        .then(({ rows }) => {
            res.render("signers", {
                allSigners: rows,
            });
        })
        .catch((err) => console.log("error getting names or signatures:", err));
});

app.listen(8080, () => console.log("petition-project server listening"));
