require("dotenv").config();

const Pool = require("pg").Pool;

const pool = new Pool({
  user: "postgres",
  password: process.env.POSTGRESQL_PASSWORD,
  host: "localhost",
  port: 5432,
  database: "spotifytest",
});

module.exports = pool;
