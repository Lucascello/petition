const spicedPg = require("spiced-pg");
const database = "petition";
const username = "postgres";
const password = "postgres";

const db = spicedPg(
    `postgres:${username}:${password}@localhost:5432/${database}`
);
console.log(`[db] connecting to:${database}`);

module.exports.addFullNames = (firstName, lastName, signature) => {
    const q = `INSERT INTO signatures (first, last, signature)
                VALUES ($1, $2, $3)
                RETURNING id`;
    const params = [firstName, lastName, signature];
    console.log(firstName, lastName, signature);
    return db.query(q, params);
};

module.exports.getFullNames = () => {
    const q = "SELECT first, last FROM signatures";
    return db.query(q);
};

module.exports.addAllSigners = () => {
    const q = "SELECT COUNT(*) FROM signatures";
    return db.query(q);
};
