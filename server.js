const express = require("express");

const app = express();

const res = require("express/lib/response");

const { engine } = require("express-handlebars");

const db = require("./db");

const cookieSession = require("cookie-session");

app.engine("handlebars", engine());

app.set("view engine", "handlebars");

app.use(
    cookieSession({
        secret: COOKIE_SECRET,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.use(express.static("./public"));

app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.render("home", { layout: "main", db });
});

app.post("/", (req, res) => {
    // console.log("coming from the home page, without signatures");
    // if () {
    // }
    // else {
    //     res.redirect("/something_went_wrong");
    // }
});

app.get("/something_went_wrong", (req, res) => {
    res.render("wrong", { layout: "main", db });
});

app.post("/something_went_wrong", (req, res) => {
    console.log("returning to the home page");
    res.redirect("/");
});

app.post("/something_went_wrong", (req, res) => {
    res.render("home", { layout: "main", db });
});

app.get("/signed", (req, res) => {
    res.render("signed", { layout: "main", db });
});

app.get("/signers", (req, res) => {
    res.render("signers", { layout: "main", db });
});

app.post("/signed", (req, res) => {
    res.render("signers", { layout: "main", db });
});

app.get("/signatures", (req, res) => {
    db.getFullNames()
        .then(({ rows }) => {
            console.log("getFullNames db results", rows);
        })
        .catch((err) => console.log("err in getFullNames:", err));
});

// app.post("/add-actor", (req, res) => {
//     db.addActor("Janelle Monáe", 36)
//         .then(() => {
//             console.log("yayyyyy actor added");
//         })
//         .catch((err) => console.log("no actor added :(", err));
// });

app.listen(8080, () => console.log("petition-project server listening"));
