require('dotenv').config();
const pg = require('pg');

const knex = require('knex')({
  client: 'pg',
  connection: {
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  },
  migrations: {
    tableName: 'migrations'
  }
});

const runRequest = async (req, res, request) => {
  try {
    const result = await request(req);
    console.log(`query result: ${result}, at: ${new Date()}`);
    res.status(200).json({
      body: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(
      {
        body: null,
        error: "Request failed."
      });
  }
}

const runRequestCallback = async (req, res, request) => {
  try {
    request(req, callback, callbackError);
  } catch (error) {
    console.log(error);
    res.status(500).json(
      {
        body: null,
        error: "Request failed."
      });
  }
}

const callbackError = (res, error) => {
  console.log(error);
  res.status(500).json(
    {
      body: null,
      error: "Request failed."
    });
}

const callback = (res, queryResult) => {
  try {
    res.status(200).json({
      body: queryResult,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(
      {
        body: null,
        error: "Request failed."
      });
  }
}

module.exports = {
  runRequest,
  knex,
  runRequestCallback,
};