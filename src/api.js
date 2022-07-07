const express = require('express');
const serverless = require('serverless-http');
const { v4 } = require('uuid');
const { runRequest } = require('./common/request_wrapper');
const { query, selectAllByUserId, preparedInsertQuery } = require('./common/requests');
const { tables } = require('./common/constants');
const { toDate, now, startOfDayDate } = require('./common/utils/date');

const app = express();

app.use(express.json());

app.get('/users/:user_id', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { user_id } = req.params;
    const result = (await query(`SELECT * FROM ${tables.users} WHERE id = '${user_id}'`, client)).rows;
    if (result.length <= 0) {
      return null
    }
    return result[0];
  });
});

app.post('/users', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { first_name, last_name, gender, email, number } = req.body;
    const id = v4();
    await preparedInsertQuery(
      tables.users,
      ['id', 'first_name', 'last_name', 'gender', 'email', 'number', 'created_at'],
      [id, first_name, last_name, gender, email, number, now()],
      client, 'id'
    );
    return id;
  });
});

app.post('/folders', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { title, position, user_id } = req.body;
    const folder_id = v4();
    const folder_order = ['id', 'title', 'times_used', 'position', 'user_id', 'is_active', 'created_at'];
    const folder_data = [{ id: folder_id, title, times_used: 0, position: position ? position : 0, user_id, is_active: true, created_at: now() }];
    const folder_data_array = arrayToInsertArray(folder_order, folder_data);
    await preparedInsertQuery(tables.folders,
      folder_order,
      folder_data_array,
      client, 'id');
    return folder_id;
  });
});

app.patch("/folders", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { id, title, position, user_id, is_active, times_used } = req.body;
    await updateWithId(tables.folders,
      ['id', 'title', 'times_used', 'position', 'is_active'],
      [id, title, times_used, position ? position : 0, is_active],
      id,
      client);
      await updateWithWhere(tables.messages_in_folders,
        ['is_active'],
        [is_active],
        `WHERE folder_id = '${id}'`,
        client);
  });
});

app.get("/folders/:user_id", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { user_id } = req.params;
    const result = (await selectAllByUserId(tables.folders, user_id, client)).rows;
    return result;
  });
});

app.post('/messages', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { title, short_title, body, folder_id, position, user_id } = req.body;
    const message_id = v4();
    const message_in_folder_id = v4();
    const message_data = [{ id: message_id, title, short_title, body, position: position ? position : 0, times_used: 0, user_id, is_active: 'true', created_at: now() }];
    const message_order = ['id', 'title', 'short_title', 'body', 'position', 'times_used', 'user_id', 'is_active', 'created_at'];
    const message_data_array = arrayToInsertArray(message_order, message_data);
    await preparedInsertQuery(
      tables.messages,
      message_order,
      message_data_array,
      client);
      const message_in_folder_order = ['id', 'message_id', 'folder_id'];
      const message_in_folder_data = [{id: message_in_folder_id, message_id, folder_id}];
      const message_in_folder_array = arrayToInsertArray(message_in_folder_order, message_in_folder_data);
    await preparedInsertQuery(
      tables.messages_in_folders,
      message_in_folder_order,
      message_in_folder_array,
      client);
    return message_id;
  });
});

app.patch("/messages", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { id, title, short_title, body, folder_id, position, times_used, is_active, previous_folder_id } = req.body;
    await updateWithId(tables.messages,
      ['id', 'title', 'short_title', 'body', 'position', 'times_used', 'is_active'],
      [id, title, short_title, body, position ? position : 0, times_used, is_active],
      id,
      client);

    await updateWithWhere(tables.messages_in_folders,
      ['message_id', 'folder_id', 'is_active'],
      [id, folder_id, is_active],
      `WHERE folder_id = '${previous_folder_id}' AND message_id = '${id}'`,
      client);
  });
});

app.get("/messages/:user_id", async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { user_id } = req.params;
    return (await query('SELECT m_f.id as message_in_folder_id, folder_id, message_id, title, short_title, body, position ,times_used FROM (\n' +
      '(SELECT id, folder_id, message_id FROM messages_in_folders WHERE folder_id in (\n' +
      `SELECT id FROM folders WHERE user_id = '${user_id}' and is_active = true\n` +
      ') and is_active = true) m_f\n' +
      'JOIN (SELECT * FROM messages WHERE is_active = true) AS m\n' +
      'ON m.id = m_f.message_id\n)', client)).rows;
  });
});


app.post('/deletedCalls', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { user_id, number, deleted_at } = req.body;
    const id = v4();
    const deleted_at_date = toDate(deleted_at);
    const deleted_calls_order = ['id', 'user_id', 'deleted_at', 'number'];
    const deleted_calls_data = [{id, user_id, deleted_at: deleted_at_date, number}];
    const deleted_calls_array = arrayToInsertArray(deleted_calls_order, deleted_calls_data);
    await preparedInsertQuery(
      tables.deleted_calls,
      deleted_calls_order,
      deleted_calls_array,
      client, 'id');
    return id;
  });
});

app.get('/deletedCalls/:user_id', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { user_id } = req.params;
    const result = (await selectAllByUserId(tables.deleted_calls, user_id, client, false, `deleted_at > '${startOfDayDate()}'`)).rows;
    return result;
  });
});

app.post('/phoneCall', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { number, contact_name, start_date, end_date, is_answered, type, messages_sent, user_id } = req.body;
    const phone_call_id = v4();
    const phone_call_insert_order = ['id', 'number', 'user_id', 'start_date', 'end_date', 'contact_name', 'type', 'is_answered', 'is_active', 'created_at'];
    const phone_call_data = [{
      id: phone_call_id,
      phone_call_id,
      number,
      contact_name,
      start_date: toDate(start_date),
      end_date: toDate(end_date),
      is_answered,
      type,
      user_id,
      is_active: true,
      created_at: now(),
    }];
    const phone_call_values = arrayToInsertArray(
      phone_call_insert_order,
      phone_call_data
    );
    console.log(phone_call_values);
    await preparedInsertQuery(
      tables.phone_calls,
      phone_call_insert_order,
      phone_call_values,
      client,
      'id'
    );
    prepareMessagesSent(messages_sent, phone_call_id);
    const messages_sent_order = ['sent_at', 'id', 'message_id', 'phone_call_id', 'is_active'];
    const values_array = arrayToInsertArray(messages_sent_order, messages_sent);
    await preparedInsertQuery(tables.messages_sent, messages_sent_order, values_array, client, 'id');
    return phone_call_id;
  });
});

// app.patch('/test', async function (req, res) {
//   runRequest(req, res, async function (req, client) {
//     try {
//     const { text } = req.body;
//     const text_values = arrayToInsertArray(['value', 'new_column'], text);
//     let result = preparedInsertQuery('test', ['value', 'new_column'], text_values, client, 'value');
//     return result;
//     } catch(exception) {
//       console.log(exception);
//     }
//   });
// });

app.post('/phoneCalls', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const phone_calls = req.body;
    if (!Array.isArray(phone_calls)) throw Error('Not array exception');
    const phone_calls_array = [];
    const messages_sent_array = [];
    const phone_calls_order = [
      'id',
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
      await preparedInsertQuery(tables.phone_calls, phone_calls_order, phone_calls_values_array, client, 'id');
    }
    if (messages_sent_values_array.length > 0) {
      await preparedInsertQuery(tables.messages_sent, messages_sent_order, messages_sent_values_array, client, 'id');
    }
    return phone_calls_array.map((value) => value.id);
  });
});

app.patch('/messages', async function (req, res) {
  const { title, short_title, body, folder_id, position, user_id } = req.body;

});


app.use((req, res, next) => {
  return res.status(404).json({
    error: 'Not Found',
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
      console.log(orderKey);
      console.log(value[orderKey]);
      array.push(value[orderKey]);
    });
    arrayOfArrays.push(array);
    array = [];
  });
  return arrayOfArrays;
};

module.exports.handler = serverless(app);
