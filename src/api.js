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

app.get("/users/:id", async function (req, res) {
  try {
    client.connect();
    const id = req.params.id;
    let user = (await client.query(`SELECT * FROM users WHERE id = '${id}'`)).rows;
    res.json({
      result: user,
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create user" });
  }
});

app.post("/users", async function (req, res) {
  try {
    client.connect();
    const { first_name, last_name, gender, email, number } = req.body;
    const id = v4();
    let result = (await insert(
      USERS_TABLE,
      ['id', 'first_name', 'last_name', 'gender', 'email', 'number'],
      [id, first_name, last_name, gender, email, number]
    ));
    res.json({
      result,
      executionDate: ` ${(new Date()).getTime()}`,
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create user" });
  }
});

app.post("/folders", async function (req, res) {
  try {
    client.connect();
    const { title, position, user_id } = req.body;
    const id = v4();
    let result = (await client.query(`insert into folders(id, title, times_used, position, user_id)
    values ('${id}', '${title}', 0, ${position ? position : 0}, '${user_id}')`));
    res.json({
      result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create folder" });
  }
});

app.get("/folders/:user_id", async function (req, res) {
  try {
    client.connect();
    const { user_id } = req.params;
    let result = (await client.query(`SELECT * FROM ${FODLERS_TABLE} WHERE user_id = ${user_id}`)).rows;
    res.json({
      result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create folder" });
  }
});

/**
 * Inserts [values] into [columns] in [table_name], according
 * to the order of columns and values. ex.: columns[0] = values[0].
 * @param {string} table_name is the name of the table
 * @param {[string]} columns are the columns to insert
 * @param {[string]} values are the values to insert
 * @returns the row inserted.
 */
const insert = async (table_name, columns, values) => {
  if (!Array.isArray(columns) || !Array.isArray(values)) {
    throw Error('columns and values must be arrays');
  }
  try {
    let query = `insert into ${table_name}(`;
    columns.forEach((column) => query += `${column}, `);
    query = `${query.substring(0, query.length - 2)})\n`;
    query += `values (`;
    values.forEach((value) => query += `'${value}', `);
    query = `${query.substring(0, query.length - 2)})\n`;
    console.log(query)
    let result = await client.query(query);
    console.log(result);
    return result;
  } catch (error) {
    throw error;
  }

}

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
