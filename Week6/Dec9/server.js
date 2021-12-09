const express = require("express");
const res = require("express/lib/response");

const app = express();

const db = require("./db");

app.get("/actors", (req, res) => {
    db.getActors()
        .then((/*results*/ { rows }) => {
            console.log("results.rows", rows);
        })
        .catch((err) => console.log("err in getActors:", err));
});

app.post("/add-actor", (req, res) => {
    db.addActor("Janelle Monáe", 36)
        .then(() => {
            console.log("huray, actor added");
        })
        .catch((err) => console.log("no actor added", err));
});

app.listen(8080, () => console.log("petition server listening"));
