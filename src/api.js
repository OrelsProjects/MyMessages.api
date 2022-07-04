const express = require("express");
const serverless = require("serverless-http");
const { v4 } = require('uuid');
const { runRequest } = require('./common/request_wrapper');
const { insert, insertMultiple, query, selectAllByUserId } = require('./common/requests');
const { tables } = require('./common/constants');
const { toDate, now } = require('./common/utils/date');

const app = express();

app.use(express.json());

app.get("/users/:user_id", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { user_id } = req.params;
    const result = (await query(`SELECT * FROM ${tables.users} WHERE id = '${user_id}'`, client)).rows;
    if (result.length <= 0) {
      return null
    }
    return result[0];
  });
});

app.post("/users", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { first_name, last_name, gender, email, number, user_id } = req.body;
    await insert(
      tables.users,
      ['id', 'first_name', 'last_name', 'gender', 'email', 'number', 'created_at'],
      [user_id, first_name, last_name, gender, email, number, now()],
      client
    );
    return id;
  });
});

app.post("/folders", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { title, position, user_id } = req.body;
    const folder_id = v4();
    await insert(tables.folders,
      ['id', 'title', 'times_used', 'position', 'user_id', 'is_active', 'created_at'],
      [folder_id, title, 0, position ? position : 0, user_id, true, now()],
      client);
    return folder_id;
  });
});

app.get("/folders/:user_id", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { user_id } = req.params;
    const result = (await selectAllByUserId(tables.folders, user_id, client)).rows;
    return result;
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
    return (await query("SELECT m_f.id as message_in_folder_id, folder_id, message_id, title, short_title, body, position ,times_used FROM (\n" +
      "(SELECT id, folder_id, message_id FROM messages_in_folders WHERE folder_id in (\n" +
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

// ToDo: Get today's deleted calls. the rest is useless for the app
app.get("/deletedCalls/:user_id", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { user_id } = req.params;
    const result = (await selectAllByUserId(tables.deleted_calls, user_id, client, false)).rows;
    return result;
  });
});

app.post("/phoneCall", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { number, contact_name, start_date, end_date, is_answered, type, messages_sent, user_id } = req.body;
    const phone_call_id = v4();
    await insert(
      tables.phone_calls,
      ['id', 'number', 'user_id', 'start_date', 'end_date', 'contact_name', 'type', 'is_answered', 'is_active', 'created_at'],
      [phone_call_id, number, user_id, toDate(start_date), toDate(end_date), contact_name, type, is_answered, true, now()], client);
    prepareMessagesSent(messages_sent, phone_call_id);
    const messages_sent_order = ['sent_at', 'id', 'message_id', 'phone_call_id', 'is_active'];
    const values_array = arrayToInsertArray(messages_sent_order, messages_sent);
    await insertMultiple(tables.messages_sent, messages_sent_order, values_array, client);
    return phone_call_id;
  });
});

app.post("/phoneCalls", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const phone_calls = req.body;
    if (!Array.isArray(phone_calls)) throw Error("Not array exception");
    const phone_calls_array = [];
    const messages_sent_array = [];
    const phone_calls_order = ['id',
      'number',
      'user_id',
      'start_date',
      'end_date',
      'contact_name',
      'type',
      'is_answered',
      'is_active',
      'created_at'
    ];
    const messages_sent_order = ['sent_at', 'id', 'message_id', 'phone_call_id', 'is_active', 'created_at'];
    phone_calls.forEach((phone_call) => {
      const { number, contact_name, start_date, end_date, is_answered, type, messages_sent, user_id } = phone_call;
      const phone_call_id = v4();
      const start_date_formatted = toDate(start_date);
      const end_date_formatted = toDate(end_date);
      phone_calls_array.push(
        {
          id: phone_call_id,
          phone_call_id,
          number,
          contact_name,
          start_date: start_date_formatted,
          end_date: end_date_formatted,
          is_answered,
          type,
          user_id,
          is_active: true,
          created_at: now(),
        }
      );
      prepareMessagesSent(messages_sent, phone_call_id);
      messages_sent.forEach((value) => messages_sent_array.push(value));
    });
    const phone_calls_values_array = arrayToInsertArray(phone_calls_order, phone_calls_array);
    const messages_sent_values_array = arrayToInsertArray(messages_sent_order, messages_sent_array);

    if (phone_calls_values_array.length > 0) {
      await insertMultiple(tables.phone_calls, phone_calls_order, phone_calls_values_array, client);
    }
    if (messages_sent_values_array.length > 0) {
      await insertMultiple(tables.messages_sent, messages_sent_order, messages_sent_values_array, client);
    }
    return phone_calls_array.map((value) => value.id);
  });
});

app.patch("/messages", async function (req, res) {
  const { title, short_title, body, folder_id, position, user_id } = req.body;

});


app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

const prepareMessagesSent = (messages_sent, phone_call_id) => {
  messages_sent.map((value) => {
    value['id'] = v4();
    value['is_active'] = true;
    value['phone_call_id'] = phone_call_id;
    value['sent_at'] = toDate(value['sent_at']);
    value['created_at'] = now();
  });
}

const arrayToInsertArray = (order, values) => {
  if (!Array.isArray(order) || !Array.isArray(values)) {
    return [];
  }
  let arrayOfArrays = [];
  let array = [];
  values.forEach((value) => {
    order.forEach((orderKey) => {
      array.push(value[orderKey]);
    });
    arrayOfArrays.push(array);
    array = [];
  });
  return arrayOfArrays;
}

module.exports.handler = serverless(app);
