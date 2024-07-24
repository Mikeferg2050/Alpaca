import mysql from "mysql2";
import util from "util";
import fs from "fs";

(async () => {
    const conn = mysql.createConnection({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
    });

    const query = util.promisify(conn.query).bind(conn);
    const db = process.env.DATABASE_NAME;

    try {
        await query(
            `CREATE DATABASE IF NOT EXISTS ${db} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
        );

        await query(`USE ${db}`);

        const queries = fs
            .readFileSync("./lib/db/tables.sql")
            .toString()
            .split(";");

        queries.forEach(async (q) => {
            if (q.trim() !== "") {
                const result = await query(q);
                console.log("\nQuery:\n", q, "\nResult:\n", result);
            }
        });
    } catch (error) {
        console.error(error);
    } finally {
        conn.end();
    }
})();