const spicedPg = require("spiced-pg");
const database = "petition";
const username = "postgres";
const password = "postgres";


const db = spicedPg(
    `postgres:${username}:${password}@localhost:5432/${database}`
);
console.log(`[db] connecting to:${database}`);


module.exports.getFullNames = () => {
    const q = "SELECT signatures.first, signatures.last FROM signatures";
    return db.query(q);
};


module.exports.addFullNames= (firstName, lastName, signature) => {
    const q = `INSERT INTO signatures (first, last, signature)
        VALUES ($1, $2, $3)`;
    const params = [firstName, lastName, signature)];
    return db.query(q, params);
    };