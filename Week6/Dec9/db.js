const spicedPg = require("spiced-pg");
const database = "onion";
const username = "postgres";
const password = "postgres";

const db = spicedPg(
    `postgres:${username}:${password}@localhost:5432/${database}`
);
console.log(`[db] connecting to:${database}`);

module.exports.getActors = () => {
    const q = "SELECT * FROM actors";
    return db.query(q);
};

module.exports.addActor = (actorName, actorAge) => {
    const q = `INSERT INTO actors (name, age)
                VALUES ($1, $2)`;
    const params = [actorName, actorAge];
    return db.query(q, params);
};

// db.query("SELECT * FROM actors")
//     .then((dbResult) => {
//         console.log("result from the database:", dbResult);
//     })
//     .catch((err) => console.log("err in query:", err));
