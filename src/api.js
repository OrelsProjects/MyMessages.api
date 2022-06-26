const express = require("express");
const serverless = require("serverless-http");
const { v4 } = require('uuid');
const { Client } = require('pg')
require('dotenv').config();



const app = express();

const USERS_TABLE = 'users';
const PHONE_CALLS_TABLE = 'phone_calls';
const MESSAGES_SENT_TABLE = 'messages_sent';
const MESSAGES_TABLE = 'messages';
const FODLERS_TABLE = 'folders';
const MESSAGES_IN_FOLDERS_TABLE = 'messages_in_folders'

const client = new Client({
  host: process.env.POSTGRESQL_HOST,
  port: process.env.POSTGRESQL_PORT,
  database: process.env.DB_NAME,
  user: process.env.USERNAME,
  password: process.env.PASSWORD
});

/* USERS */


// const schema = yup.object().shape({
//   first_name: yup.string().required(),
//   last_name: yup.string().required(),
//   gender: yup.string().required(),
// });

app.use(express.json());

app.get("/users", async function (req, res) {
  try {
    console.log(process.env.USERNAME)
    client.connect();
    let users = await client.query(`SELECT * FROM users`)
    res.json({
      users,
      executionDate: `${(new Date()).getTime()}`,
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create user" });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
