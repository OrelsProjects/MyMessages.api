const express = require("express");
const serverless = require("serverless-http");
const { v4 } = require('uuid');
const { runRequest } = require('./common/request_wrapper');
const { insert, query, selectAllByUserId } = require('./common/requests');
const { tables } = require('./common/constants')

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
      ['id', 'first_name', 'last_name', 'gender', 'email', 'number'],
      [id, first_name, last_name, gender, email, number],
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
      ['id', 'title', 'times_used', 'position', 'user_id', 'is_active'],
      [id, title, 0, position ? position : 0, user_id, true],
      client);
    return id;
  });
});

app.get("/folders/:user_id", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { user_id } = req.params;
    return (await selectAllByUserId(tables.folders, user_id, client)).rows;
  });
});

app.post("/messages", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { title, short_title, body, folder_id, position, user_id } = req.body;
    const message_id = v4();
    const message_in_folder_id = v4();
    await insert(tables.messages,
      ['id', 'title', 'short_title', 'body', 'position', 'times_used', 'user_id', 'is_active'],
      [message_id, title, short_title, body, position ? position : 0, 0, user_id, 'true'],
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
    return (await query("select folder_id, message_id, title, short_title, body, position ,times_used from (\n" +
      "(select folder_id, message_id from messages_in_folders where folder_id in (\n" +
      `select id from folders where user_id = '${user_id}' and is_active = true\n` +
      ") and is_active = true) m_f\n" +
      "join (select * from messages where is_active = true) as m\n" +
      "on m.id = m_f.message_id\n)", client)).rows;
  });
});


app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
