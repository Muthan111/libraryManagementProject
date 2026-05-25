import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { getEnvFilePaths } from '../config/env-paths';

for (const envFilePath of getEnvFilePaths()) {
  config({ path: envFilePath, override: false });
}

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: true,
});
