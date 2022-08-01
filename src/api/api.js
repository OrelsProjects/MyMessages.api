const express = require('express');
const serverless = require('serverless-http');
const { v4 } = require('uuid');
const { runRequest } = require('../common/request_wrapper');
const { query, selectAllByUserId, insert, updateWithId, updateWithWhere, querySafe } = require('../common/requests');
const { tables } = require('../common/constants');
const { toDate, now, startOfDayDate } = require('../common/utils/date');
const { onConflict } = require('../common/utils/query');

const app = express();

app.use(express.json({ limit: '2mb' }));
// ToDo make queries anti sql injection

app.get('/users', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const user_id = resolveUserId(req);
    const result = (await query(`SELECT * FROM ${tables.users} WHERE id = '${user_id}'`, client)).rows;
    if (result.length <= 0) {
      return null
    }
    return result[0];
  });
});

app.post('/users', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const user_id = resolveUserId(req);
    const { first_name, last_name, gender, email, number } = req.body;
    const id = user_id;
    const users_order = ['id', 'first_name', 'last_name', 'gender', 'email', 'number', 'created_at', 'is_active'];
    const users_data = [{ id, first_name, last_name, gender, email, number, created_at: now(), is_active: true }];
    const users_data_array = arrayToInsertArray(users_order, users_data);
    await insert(
      tables.users,
      users_order,
      users_data_array,
      client,
      null,
      'id'
    );
    return id;
  });
});

app.post('/folders', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const user_id = resolveUserId(req);
    const { title, position } = req.body;
    const folder_id = v4();
    const folder_order = ['id', 'title', 'times_used', 'position', 'user_id', 'is_active', 'created_at'];
    const folder_data = [{ id: folder_id, title, times_used: 0, position: position ? position : 0, user_id, is_active: true, created_at: now() }];
    const folder_data_array = arrayToInsertArray(folder_order, folder_data);
    await insert(tables.folders,
      folder_order,
      folder_data_array,
      client,
      null,
      'id');
    return folder_id;
  });
});

app.patch('/folders', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { id, title, position, is_active, times_used } = req.body;
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

app.get('/folders', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const user_id = resolveUserId(req);
    const result = (await selectAllByUserId(tables.folders, user_id, client)).rows;
    return result;
  });
});

app.post('/messages', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const message_ids = [];
    let user_id = resolveUserId(req);
    let { messages } = req.body;
    if (!Array.isArray(messages)) {
      const { title, short_title, body, folder_id, position, times_used, user_id } = req.body;
      messages = [];
      messages.push({ title, short_title, body, folder_id, position, times_used, user_id });
    }
    for (let i = 0; i < messages.length; i += 1) {
      const message_id = v4();
      const message_in_folder_id = v4();
      const message_data = [{
        id: message_id,
        title: messages[i].title,
        short_title: messages[i].short_title,
        body: messages[i].body,
        position: messages[i].position ? messages[i].position : 0,
        times_used: messages[i].times_used ? messages[i].times_used : 0,
        user_id,
        is_active: true,
        created_at: now()
      }];
      const message_order = ['id', 'title', 'short_title', 'body', 'position', 'times_used', 'user_id', 'is_active', 'created_at'];
      const message_data_array = arrayToInsertArray(message_order, message_data);
      await insert(
        tables.messages,
        message_order,
        message_data_array,
        client);
      const message_in_folder_order = ['id', 'message_id', 'folder_id'];
      const message_in_folder_data = [{
        id: message_in_folder_id,
        message_id,
        folder_id: messages[i].folder_id,
        is_active: true,
        created_at: now()

      }];
      const message_in_folder_array = arrayToInsertArray(message_in_folder_order, message_in_folder_data);
      await insert(
        tables.messages_in_folders,
        message_in_folder_order,
        message_in_folder_array,
        client);
      message_ids.push(message_id);
    }
    return message_ids;
  });
});

app.patch('/messages', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const { id, title, short_title, body, folder_id, position, times_used, is_active, previous_folder_id } = req.body;
    await updateWithId(tables.messages,
      ['title', 'short_title', 'body', 'position', 'times_used', 'is_active'],
      [title, short_title, body, position ? position : 0, times_used, is_active],
      id,
      'id',
      client);
    if (previous_folder_id && folder_id) {
      await updateWithWhere(tables.messages_in_folders,
        ['message_id', 'folder_id', 'is_active'],
        [id, folder_id, is_active],
        `WHERE folder_id = '${previous_folder_id}' AND message_id = '${id}'`,
        client);
    }
  });
});

app.get('/messages', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const user_id = resolveUserId(req);
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
    const user_id = resolveUserId(req);
    const { number, deleted_at } = req.body;
    const id = v4();
    const deleted_at_date = toDate(deleted_at);
    const deleted_calls_order = ['id', 'user_id', 'deleted_at', 'number'];
    const deleted_calls_data = [{ id, user_id, deleted_at: deleted_at_date, number }];
    const deleted_calls_array = arrayToInsertArray(deleted_calls_order, deleted_calls_data);
    await insert(
      tables.deleted_calls,
      deleted_calls_order,
      deleted_calls_array,
      client,
      null,
      'id'
    );
    return id;
  });
});

app.get('/deletedCalls', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const user_id = resolveUserId(req);
    const result = (await selectAllByUserId(tables.deleted_calls, user_id, client, false, `deleted_at > '${startOfDayDate()}'`)).rows;
    return result;
  });
});

app.post('/phoneCall', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const user_id = resolveUserId(req);
    const { number, contact_name, start_date, end_date, is_answered, type, messages_sent } = req.body;
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
    await insert(
      tables.phone_calls,
      phone_call_insert_order,
      phone_call_values,
      client,
      null,
      'id'
    );
    prepareMessagesSent(messages_sent, phone_call_id);
    const messages_sent_order = ['sent_at', 'id', 'message_id', 'phone_call_id', 'is_active'];
    const values_array = arrayToInsertArray(messages_sent_order, messages_sent);
    await insert(tables.messages_sent, messages_sent_order, values_array, client, null, 'id');
    return phone_call_id;
  });
});

app.post('/phoneCalls', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const phone_calls = req.body;
    const user_id = resolveUserId(req);
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
      const {
        number,
        contact_name,
        start_date,
        end_date,
        is_answered,
        type,
        messages_sent
      } = phone_call;
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
      await insert(
        tables.phone_calls,
        phone_calls_order,
        phone_calls_values_array,
        client,
        onConflict.doNothing(['start_date', 'user_id']),
        'id'
      );
    }
    if (messages_sent_values_array.length > 0) {
      await insert(
        tables.messages_sent,
        messages_sent_order,
        messages_sent_values_array,
        client,
        onConflict.doNothing([
          'sent_at',
          'message_id',
        ]),
        'id'
      );
    }
    return phone_calls_array.map((value) => value.id);
  });
});

app.patch('/settings', async function (req, res) {
  runRequest(req, res, async function (req, client) {
    const user_id = resolveUserId(req);
    const { key, value } = req.body;
    const modified_at = now();
    const order = ['key', 'value', 'user_id', 'modified_at'];
    const data = [{ key, value, user_id, modified_at }];
    const data_array = arrayToInsertArray(order, data);
    const result = insert(
      tables.settings,
      order,
      data_array,
      client,
      onConflict.update(order, ['key', 'user_id'], ['value', 'modified_at']),
      null,
    );
    return result;
  });
});

app.get('/settings/:key?', async function (req, res) {
  runRequest(req, res, async function (req, client) {
    const { key } = req.params;
    const user_id = resolveUserId(req);
    let selectQuery = `SELECT * FROM ${tables.settings} WHERE user_id = '${user_id}' ${key ? `AND key = '${key}'` : ''}`
    const results = (await query(selectQuery, client)).rows;
    return results;

  });
});

app.delete('/messagesInFolders', async function (req, res) {
  runRequest(req, res, async function (req, client) {
    const { folder_id } = req.body;
    updateWithWhere(tables.messages_in_folders, ['is_active'], [false], `WHERE folder_id = '${folder_id}'`, client);
  });
});


/* Statistics */

app.get('/statistics/callsCount', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const user_id = resolveUserId(req);
    const incoming_query = 'select COUNT(*) '
      + 'from phone_calls '
      + 'where type = \'INCOMING\' and user_id = $1';

    const outgoing_query = 'select COUNT(*) '
      + 'from phone_calls '
      + 'where type = \'OUTGOING\' and user_id = $1';

    const missed_query = 'select COUNT(*) '
      + 'from phone_calls '
      + 'where type = \'MISSED\' and user_id = $1';

    const rejected_query = 'select COUNT(*) '
      + 'from phone_calls '
      + 'where type = \'REJECTED\' and user_id = $1';

    const values = [user_id];
    const incoming_count = await querySafe(incoming_query, values, client);
    const outgoing_count = await querySafe(outgoing_query, values, client);
    const missed_count = await querySafe(missed_query, values, client);
    const rejected_count = await querySafe(rejected_query, values, client);

    return {
      incoming_count: incoming_count.length > 0 ? incoming_count[0].count : 0,
      outgoing_count: outgoing_count.length > 0 ? outgoing_count[0].count : 0,
      missed_count: missed_count.length > 0 ? missed_count[0].count : 0,
      rejected_count: rejected_count.length > 0 ? rejected_count[0].count : 0,
    }
  });
});

app.get('/statistics/messagesSentCount', async function (req, res) {
  runRequest(req, res, async (req, client) => {
    const user_id = resolveUserId(req);
    const query = 'select Count( m_ms.title), m_ms.title\n'
      + 'from (\n'
      + 'messages_sent\n'
      + 'join messages\n'
      + 'on messages_sent.message_id = messages.id\n'
      + ') as m_ms\n'
      + 'where user_id = $1\n'
      + 'group by m_ms.title;'
    const values = [user_id];
    const messages_sent_count = await querySafe(query, values, client);
    if (messages_sent_count.length <= 0) return null
    return messages_sent_count
  });
});

/* Statistics */


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
      array.push(value[orderKey]);
    });
    arrayOfArrays.push(array);
    array = [];
  });
  return arrayOfArrays;
};

const resolveUserId = (req) => {
  const { userid } = req.headers;
  if (!userid) {
    throw Error('Did you add UserId to the headers?');
  }
  const regexExpUUID = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
  if (regexExpUUID.test(userid)) {
    return userid;
  } else {
    throw Error('userId is not a uuid.');
  }
}

module.exports.handler = serverless(app);
