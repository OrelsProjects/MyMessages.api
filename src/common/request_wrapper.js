require('dotenv').config();
const pg = require('pg');

const pool = new pg.Pool(
  {
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  }
);

const runRequest = async (req, res, request) => {
  pool.connect(async function (err, client, done) {
    try {
      const result = await request(req, client);
      res.status(200).json({
        body: result,
      });
    } catch (error) {
      res.status(500).json(
        {
          body: null,
          error: "Request failed."
        });
      console.log(error);
    } finally {
      done();
    }
  });
}

module.exports = {
  runRequest,
};