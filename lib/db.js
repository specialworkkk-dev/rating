import mongoose from "mongoose";

// One cached connection per server instance. On Vercel, opening a new
// connection per request exhausts the free Atlas cluster's connection limit.
let cached = globalThis._mongoose;
if (!cached) cached = globalThis._mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set (see .env.example)");

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, { bufferCommands: false, maxPoolSize: 10 })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}
