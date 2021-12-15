const spicedPg = require("spiced-pg");
const database = "petition";
const username = "postgres";
const password = "postgres";

const db = spicedPg(
    process.env.DATABASE_URL ||
        `postgres:${username}:${password}@localhost:5432/${database}`
);
console.log(`[db] connecting to:${database}`);

// module.exports.addFullNames = (firstName, lastName, signature) => {
//     const q = `INSERT INTO signatures (first, last, signature)
//                 VALUES ($1, $2, $3)
//                 RETURNING id`;
//     const params = [firstName, lastName, signature];
//     // console.log(firstName, lastName, signature);
//     return db.query(q, params);
// }; FROM PART 1 AND 2, BUT NOT VALID ANYMORE

module.exports.addSignatures = (signature, user_id) => {
    const q = `INSERT INTO signatures (signature, user_id)
                VALUES ($1, $2)
                RETURNING id`;
    const params = [signature, user_id];
    // console.log(firstName, lastName, signature);
    return db.query(q, params);
};

module.exports.addUsersInfo = (firstName, lastName, email, password) => {
    const q = `INSERT INTO users (first, last, email, password)
                VALUES ($1, $2, $3, $4)
                RETURNING id`;
    const params = [firstName, lastName, email, password];
    return db.query(q, params);
};

module.exports.addUserProfiles = (age, city, url, user_id) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id)
                VALUES ($1, $2, $3, $4)
                RETURNING id`;
    const params = [age, city, url, user_id];
    return db.query(q, params);
};

// module.exports.getFullNames = () => {
//     const q = "SELECT first, last FROM signatures";
//     return db.query(q);
// }; FROM PART 1 AND 2, BUT NOT VALID ANYMORE

module.exports.getFullNames = () => {
    const q = "SELECT first, last FROM users";
    return db.query(q);
};

module.exports.getAllSigners = () => {
    const q = `SELECT signatures.user_id, users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url 
        FROM signatures 
        JOIN users 
        ON signatures.user_id = users.id 
        LEFT OUTER JOIN user_profiles 
        ON signatures.user_id = user_profiles.user_id`;
    return db.query(q);
};

module.exports.getSignatures = () => {
    const q = "SELECT COUNT(*) FROM signatures";
    return db.query(q);
};

module.exports.getAllUsers = () => {
    const q = "SELECT COUNT(*) FROM users";
    return db.query(q);
};

module.exports.getAllExtraInfo = () => {
    const q = "SELECT COUNT(*) FROM user_profiles";
    return db.query(q);
};

module.exports.getSignatureById = (id) => {
    const q = "SELECT signature, id FROM signatures WHERE id=$1";
    return db.query(q, [id]);
};

module.exports.getSignatureByUserId = (id) => {
    const q = "SELECT id FROM signatures WHERE user_id=$1";
    return db.query(q, [id]);
};

module.exports.getPasswords = (email) => {
    const q = "SELECT id, password FROM users WHERE email = $1";
    return db.query(q, [email]);
};

module.exports.getSignersByCity = (city) => {
    const q = `SELECT signatures.user_id, users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url 
        FROM signatures 
        JOIN users 
        ON signatures.user_id = users.id 
        LEFT OUTER JOIN user_profiles 
        ON signatures.user_id = user_profiles.user_id
        WHERE LOWER(user_profiles.city) = LOWER($1)`;
    return db.query(q, [city]);
};
