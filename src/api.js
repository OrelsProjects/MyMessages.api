const express = require("express");
const serverless = require("serverless-http");
const { v4 } = require('uuid');
const { runRequest } = require('./common/request_wrapper');
const { insert, query, selectAllByUserId } = require('./common/requests');
const { tables } = require('./common/constants');
const { toDate, now } = require('./common/utils/date');

const app = express();

app.use(express.json());

app.get("/users/:id", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const id = req.params.id;
    return (await query(`SELECT * FROM ${tables.users} WHERE id = '${id}'`, client)).rows;
  });
});

app.post("/users", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { first_name, last_name, gender, email, number } = req.body;
    const id = v4();
    await insert(
      tables.users,
      ['id', 'first_name', 'last_name', 'gender', 'email', 'number', 'created_at'],
      [id, first_name, last_name, gender, email, number, now()],
      client
    );
    return id;
  });
});

app.post("/folders", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { title, position, user_id } = req.body;
    const id = v4();
    await insert(tables.folders,
      ['id', 'title', 'times_used', 'position', 'user_id', 'is_active', 'created_at'],
      [id, title, 0, position ? position : 0, user_id, true, now()],
      client);
    return id;
  });
});

app.post("/messages", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { title, short_title, body, folder_id, position, user_id } = req.body;
    const message_id = v4();
    const message_in_folder_id = v4();
    await insert(tables.messages,
      ['id', 'title', 'short_title', 'body', 'position', 'times_used', 'user_id', 'is_active', 'created_at'],
      [message_id, title, short_title, body, position ? position : 0, 0, user_id, 'true', now()],
      client);
    await insert(tables.messages_in_folders,
      ['id', 'message_id', 'folder_id'],
      [message_in_folder_id, message_id, folder_id],
      client);
    return message_id;
  });
});

app.get("/messages/:user_id", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { user_id } = req.params;
    return (await query("SELECT folder_id, message_id, title, short_title, body, position ,times_used FROM (\n" +
      "(SELECT folder_id, message_id FROM messages_in_folders WHERE folder_id in (\n" +
      `SELECT id FROM folders WHERE user_id = '${user_id}' and is_active = true\n` +
      ") and is_active = true) m_f\n" +
      "JOIN (SELECT * FROM messages WHERE is_active = true) AS m\n" +
      "ON m.id = m_f.message_id\n)", client)).rows;
  });
});

app.post("/deletedCalls", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { user_id, number, deleted_at } = req.body;
    const id = v4();
    const deleted_at_date = toDate(deleted_at);
    await insert(tables.deleted_calls,
      ['id', 'user_id', 'deleted_at', 'number'],
      [id, user_id, deleted_at_date, number],
      client);
    return id;
  });
});

app.get("/deletedCalls/:user_id", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { user_id } = req.params;
    const result = (await selectAllByUserId(tables.deleted_calls, user_id, client)).rows;
    return result;
  });
});



app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
