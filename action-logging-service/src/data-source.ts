import { DataSource } from "typeorm";
import { ActionLog } from "./entity/ActionLog";
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,  // Automatically create tables
  logging: true,
  entities: [ActionLog],
});
