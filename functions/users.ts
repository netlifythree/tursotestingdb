import { Database } from "@libsql/client";
import type { Handler } from "@netlify/functions";

const TURSO_DB_URL = process.env.TURSO_DB_URL!;
const TURSO_DB_AUTH_TOKEN = process.env.TURSO_DB_AUTH_TOKEN!;

if (!TURSO_DB_URL || !TURSO_DB_AUTH_TOKEN) {
  throw new Error("TURSO_DB_URL and TURSO_DB_AUTH_TOKEN must be set");
}

const db = new Database(TURSO_DB_URL, {
  authToken: TURSO_DB_AUTH_TOKEN,
});

export const handler: Handler = async (event, context) => {
  try {
    if (event.httpMethod === "GET") {
      const { results } = await db.execute("SELECT id, username, active FROM users");
      const users = results.map(row => ({
        id: row[0],
        username: row[1],
        active: row[2] === 1,
      }));
      return {
        statusCode: 200,
        body: JSON.stringify(users),
      };
    }

    if (event.httpMethod === "POST") {
      if (!event.body) {
        return { statusCode: 400, body: "Missing request body" };
      }
      const { username, password } = JSON.parse(event.body);

      if (!username || !password) {
        return { statusCode: 400, body: "Missing username or password" };
      }

      await db.execute(
        "INSERT INTO users (username, password, active) VALUES (?, ?, 1)",
        [username, password]
      );

      return {
        statusCode: 201,
        body: JSON.stringify({ message: "User created" }),
      };
    }

    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: "Internal Server Error: " + (error.message || error.toString()),
    };
  }
};
