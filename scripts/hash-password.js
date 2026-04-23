#!/usr/bin/env node
// Usage: node scripts/hash-password.js "yourpassword"
// Output: bcrypt hash → paste into OWNER_PASSWORD_HASH in .env

const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.js <password>");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Error: password must be at least 8 characters");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log("\nBcrypt hash (copy to OWNER_PASSWORD_HASH):");
console.log(hash);
console.log(
  "\nOwner can now login at /login → 'Login sebagai Owner' using:"
);
console.log(`  Email: ${process.env.OWNER_EMAIL ?? "(set OWNER_EMAIL in .env)"}`);
console.log(`  Password: ${password}`);
