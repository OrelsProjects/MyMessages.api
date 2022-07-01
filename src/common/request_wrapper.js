require('dotenv').config();
const pg = require('pg');
const { Client } = require('pg')

const pool = new pg.Pool(
  {
    host: process.env.POSTGRESQL_HOST,
    port: process.env.POSTGRESQL_PORT,
    database: process.env.DB_NAME,
    user: process.env.USERNAME,
    password: process.env.PASSWORD
  }
);

const runRequest = async (req, res, request) => {
  pool.connect(async function (err, client, done) {
    try {
      const result = await request(req, client);
      res.json({
        body: result,
      });
    } catch (error) {
      res.status(500).json({ error: "Request failed." });
      console.log(error);
    } finally {
      done();
    }
  });
}

module.exports = {
  runRequest,
};