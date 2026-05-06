import express from "express";
import dotenv from "dotenv";

const config = dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;