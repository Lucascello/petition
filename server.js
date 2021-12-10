const express = require("express");

const app = express();

const res = require("express/lib/response");

const { engine } = require("express-handlebars");

const db = require("./db");

const cookieSession = require("cookie-session");

const secrets = require("./secrets.json");

//////////////////prevent clickjacking/////////////////////////////
// app.use((req, res, next) => {
//     res.setHeader("x-frame-options", "deny");
//     next();
// });
////////////////////////////////////////////////////////////////////

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
            res.redirect("/signed");
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
            res.cookie(first);
            res.cookie(last);
            res.cookie(signature);
            res.redirect("/signed");
        })
        .catch((err) => {
            console.log("err in getFullNames:", err);
            res.redirect("/something_went_wrong");
        });
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

//Who is runnng signatures.sql?
// app.get("/signatures", (req, res) => {
//     db.getFullNames()
//         .then(({ rows }) => {
//             console.log("getFullNames db results", rows);
//             let names = rows;
//             return /* ? */ db.addAllSigners();
//         })
//         .then((names) => {
//             let allSigners = names[0].count;
//             res.render("names from all who signed so far", {
//                 names,
//                 allSigners,
//             });
//         })
//         .catch((err) => console.log("error getting names or signatures:", err));
// });

app.listen(8080, () => console.log("petition-project server listening"));
