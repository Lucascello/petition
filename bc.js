const bcrypt = require("bcryptjs");
let { genSalt, hash, compare } = bcrypt;

module.exports.compare = compare;
module.exports.hash = (plainTextPw) =>
    genSalt().then((salt) => hash(plainTextPw, salt));

/// DEMO OF HOW THESE FUNCITONS WORK
// genSalt will generate a salt for us
// genSalt()
//     .then((salt) => {
//         console.log("salt:", salt);
//         // hash expects to be given a cleartext password and a salt!
//         return hash("password123.", salt);
//     })
//     .then((hashedPW) => {
//         console.log("hashed and salted Password:", hashedPW);
//         // compare takes two arguments: a cleartext password and a hash
//         // compare returns a boolean on whether the cleatext can generate
//         // that hash when combined with the salt
//         return compare("password123", hashedPW);
//     })
//     .then((matchValue) => {
//         console.log("is the password correct:", matchValue);
//     });
