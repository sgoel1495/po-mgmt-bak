import {MongoClient} from "mongodb";
import {config} from "./index.js";

const connectionString = config.database.dsn;

const client = new MongoClient(connectionString);

let conn;
try {
    conn = await client.connect();
} catch (e) {
    console.error(e);
}

let db = conn.db(config.database.name);

export default db;