const express = require("express");

const app = express();

const res = require("express/lib/response");

const { engine } = require("express-handlebars");

const db = require("./db");

const cookieSession = require("cookie-session");

const secrets = require("./secrets.json");

//////////////////prevent clickjacking/////////////////////////////
app.use((req, res, next) => {
    res.setHeader("x-frame-options", "deny");
    next();
});
////////////////////////////////////////////////////////////////////

app.engine("handlebars", engine());

app.set("view engine", "handlebars");

// app.use(
//     cookieSession({
//         secret: secrets.COOKIE_SECRET,
//         maxAge: 1000 * 60 * 60 * 24 * 14,
//         sameSite: true,
//     })
// );

app.use(express.static("./public"));

app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.render("home", { layout: "main", db });
});

app.post("/", (req, res) => {
    console.log(req.body);

    const person = req.body;

    db.addFullNames(person.first, person.last, person.signature)
        .then(() => {
            res.cookie(person.first);
            res.cookie(person.last);
            res.cookie(person.signature);
            res.redirect("/signed");
        })
        .catch((err) => console.log("err in getFullNames:", err));

    res.redirect("/something_went_wrong");
});

app.get("/something_went_wrong", (req, res) => {
    res.render("wrong", { layout: "main", db });
});

app.post("/something_went_wrong", (req, res) => {
    console.log("returning to the home page");
    res.redirect("/");
});

app.get("/signed", (req, res) => {
    res.render("signed", { layout: "main", db });
});

app.get("/signers", (req, res) => {
    res.render("signers", { layout: "main", db });
});

app.get("/signatures", (req, res) => {
    let allSigns = "";

    let names = "";
    db.getFullNames()
        .then(({ rows }) => {
            console.log("getFullNames db results", rows);
            names = rows;
            return /* ? */ db.addAllSigners();
        })
        .catch((err) => console.log("err in getFullNames:", err));
});

app.listen(8080, () => console.log("petition-project server listening"));
