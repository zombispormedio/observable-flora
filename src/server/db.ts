import { MongoClient } from "mongodb";
// Connection URI
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.warn("MONGODB_URI not set");
  process.exit(0);
}
// Create a new MongoClient
const client = new MongoClient(uri);
async function connect() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    // Establish and verify connection
    await client.db("flora").command({ ping: 1 });
    console.log("Connected successfully to mongodb server");
  } catch {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

export const database = {
  connect,
  client,
};
