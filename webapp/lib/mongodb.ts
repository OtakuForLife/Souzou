import { Db, MongoClient, MongoClientOptions } from "mongodb";

const MONGODB_URI: string = process.env.MONGODB_URI ? process.env.MONGODB_URI : "";
const MONGODB_DB: string = process.env.MONGODB_DB ? process.env.MONGODB_DB : "";

// check the MongoDB URI
if (!MONGODB_URI) {
  throw new Error("Define the MONGODB_URI environmental variable");
}

// check the MongoDB DB
if (!MONGODB_DB) {
  throw new Error("Define the MONGODB_DB environmental variable");
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  // check the cached.
  if (cachedClient && cachedDb) {
    // load from cache
    return {
      client: cachedClient,
      db: cachedDb,
    };
  }

  // set the connection options
  const opts: MongoClientOptions = {

  };

  // Connect to cluster
  cachedClient = new MongoClient(MONGODB_URI, opts);
  await cachedClient.connect();
  cachedDb = cachedClient.db(MONGODB_DB);

  return {
    client: cachedClient,
    db: cachedDb,
  };
}