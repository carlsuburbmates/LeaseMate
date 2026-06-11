import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.query("SHOW TABLES");
console.log("Existing tables:", rows.map(r => Object.values(r)[0]));
await connection.end();
