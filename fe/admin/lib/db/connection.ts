import mysql from "mysql2/promise";
import {drizzle} from "drizzle-orm/mysql2";
import * as schema from './schema';


const poolWebsite = mysql.createPool(process.env.MYSQL_WEBSITE_URL || 'mysql://user:password@localhost:3306/db');
const poolGame = mysql.createPool(process.env.MYSQL_GAME_URL || 'mysql://user:password@localhost:3306/db');

export const db = drizzle(poolWebsite, {schema: schema, mode: "default"});
export const gameDB = drizzle(poolGame, {schema: schema, mode: "default"});