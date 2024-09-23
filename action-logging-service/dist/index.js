"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const data_source_1 = require("./data-source");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Function to ensure the database exists before connecting
async function createDatabaseIfNotExists() {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME } = process.env;
    const { Pool } = require('pg');
    const client = new Pool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        port: parseInt(DB_PORT || '5432', 10),
    });
    try {
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`);
        if (res.rowCount === 0) {
            await client.query(`CREATE DATABASE "${DB_NAME}";`);
            console.log(`Database ${DB_NAME} created.`);
        }
        else {
            console.log(`Database ${DB_NAME} already exists.`);
        }
    }
    catch (error) {
        console.error('Error creating database:', error);
    }
    finally {
        await client.end();
    }
}
(async () => {
    await createDatabaseIfNotExists();
    data_source_1.AppDataSource.initialize()
        .then(() => {
        app_1.app.listen(3002, () => {
            console.log('Action Logging Service is running on port 3002');
        });
    })
        .catch((err) => {
        console.error('Error during Data Source initialization:', err);
    });
})();
