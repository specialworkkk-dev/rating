// Create or reset the admin login.
// Usage: npm run create-admin -- you@example.com 'a-strong-password' "Your Name"
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";

const [email, password, name = "Admin"] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: npm run create-admin -- <email> <password> [name]");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const passwordHash = await bcrypt.hash(password, 10);
const user = await User.findOneAndUpdate(
  { email: email.toLowerCase() },
  { $set: { name, passwordHash, role: "admin" }, $unset: { shopId: 1 } },
  { upsert: true, returnDocument: "after" }
);
console.log(`Admin ready: ${user.email}`);
await mongoose.disconnect();
