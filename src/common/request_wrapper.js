const { Client } = require('pg')
require('dotenv').config();

const client = new Client({
  host: process.env.POSTGRESQL_HOST,
  port: process.env.POSTGRESQL_PORT,
  database: process.env.DB_NAME,
  user: process.env.USERNAME,
  password: process.env.PASSWORD
});


const runRequest = async (req, res, request) => {
  try {
    client.connect();
    const result = await request(req, client);
    res.json({
      result,
    });
    client.end();
  } catch (error) {
    res.status(500).json({ error: "Request failed." });
    console.log(error);
  }
}

module.exports = {
  runRequest,
};