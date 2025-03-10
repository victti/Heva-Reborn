import dotenv from 'dotenv';
dotenv.config();

export const ROOT_PATH = process.env.ROOT_PATH != undefined ? process.env.ROOT_PATH : __dirname;
export const PORT = process.env.PORT != undefined ? Number.parseInt(process.env.PORT) : 27050;