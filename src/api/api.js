const express = require('express');
const serverless = require('serverless-http');
const { v4 } = require('uuid');
const { runRequest } = require('../common/request_wrapper');
const { tables } = require('../common/constants');
const { toDate, now, startOfDayDate } = require('../common/utils/date');
const { knex } = require('../common/request_wrapper');

const app = express();

app.use(express.json({ limit: '2mb' }));


app.get('/users', async function (req, res) {
  runRequest(req, res, async (req) => {
    const user_id = resolveUserId(req);
    const result = await knex(tables.users)
      .where('id', user_id)
      .first();
    return result;
  });
});

app.post('/users', async function (req, res) {
  runRequest(req, res, async (req) => {
    const { first_name, last_name, gender, email, number, user_id: id } = req.body;
    await knex(tables.users)
      .insert({
        id,
        first_name,
        last_name,
        gender,
        email,
        number,
        created_at: now(),
        is_active: true
      });
    return id;
  });
});

app.post('/folders', async function (req, res) {
  runRequest(req, res, async (req) => {
    const user_id = resolveUserId(req);
    const { title, position } = req.body;
    const id = v4();
    await knex(tables.folders)
      .insert(
        {
          id,
          title,
          times_used: 0,
          position: position ? position : 0,
          user_id, is_active: true,
          created_at: now()
        });
    return id;
  });
});

app.patch('/folders', async function (req, res) {
  runRequest(req, res, async (req) => {
    const { id, title, position, is_active, times_used } = req.body;
    await knex(tables.folders)
      .update({
        title,
        position: position ? position : 0,
        is_active,
        times_used
      })
      .where('id', id);
    await knex(tables.messages_in_folders)
      .update({ is_active })
      .where('folder_id', id);
  });
});

app.get('/folders', async function (req, res) {
  runRequest(req, res, async (req) => {
    const user_id = resolveUserId(req);
    const result = await knex(tables.folders)
      .select('*')
      .where('user_id', user_id);
    return result;
  });
});

app.post('/messages', async function (req, res) {
  runRequest(req, res, async (req) => {
    const user_id = resolveUserId(req);
    let { messages } = req.body;
    if (!Array.isArray(messages)) {
      const { title, short_title, body, folder_id, position, times_used, user_id } = req.body;
      messages = [];
      messages.push({ title, short_title, body, folder_id, position, times_used, user_id });
    }
    const messages_data = [];
    const messages_in_folder_data = [];
    for (let i = 0; i < messages.length; i += 1) {
      const message_id = v4();
      const message_in_folder_id = v4();
      messages_data.push({
        id: message_id,
        title: messages[i].title,
        short_title: messages[i].short_title,
        body: messages[i].body,
        position: messages[i].position ? messages[i].position : 0,
        times_used: messages[i].times_used ? messages[i].times_used : 0,
        user_id,
        is_active: true,
        created_at: now()
      });
      messages_in_folder_data.push({
        id: message_in_folder_id,
        message_id,
        folder_id: messages[i].folder_id,
        is_active: true,
        created_at: now()

      });
    }
    await knex(tables.messages)
      .insert(messages_data);

    await knex(tables.messages_in_folders)
      .insert(messages_in_folder_data);

    return messages_data.map((message) => message.id);
  });
});

app.patch('/messages', async function (req, res) {
  runRequest(req, res, async (req) => {
    const { id, title, short_title, body, folder_id, position, times_used, is_active, previous_folder_id } = req.body;
    await knex(tables.messages)
      .update(
        { title, short_title, body, position, times_used, is_active }
      )
      .where('id', id);

    if (previous_folder_id && folder_id) {
      await knex(tables.messages_in_folders)
        .update({
          message_id: id,
          folder_id,
          is_active
        })
        .where('folder_id', previous_folder_id)
        .andWhere('message_id', id);
    }
  });
});

app.get('/messages', async function (req, res) {
  runRequest(req, res, async (req) => {
    const user_id = resolveUserId(req);
    const result = await knex.raw('SELECT m_f.id as message_in_folder_id, folder_id, message_id, title, short_title, body, position ,times_used'
      + ' FROM (\n' +
      '(SELECT id, folder_id, message_id FROM messages_in_folders WHERE folder_id in (\n' +
      `SELECT id FROM folders WHERE user_id = ? and is_active = true\n` +
      ') and is_active = true) m_f\n' +
      'JOIN (SELECT * FROM messages WHERE is_active = true) AS m\n' +
      'ON m.id = m_f.message_id\n)', user_id);
    return result.rows;
  });
});


app.post('/deletedCalls', async function (req, res) {
  runRequest(req, res, async (req) => {
    const user_id = resolveUserId(req);
    const { number, deleted_at } = req.body;
    const id = v4();
    const deleted_at_date = toDate(deleted_at);
    await knex(tables.deleted_calls)
      .insert({ id, user_id, deleted_at: deleted_at_date, number });
    return id;
  });
});

app.get('/deletedCalls', async function (req, res) {
  runRequest(req, res, async (req) => {
    const user_id = resolveUserId(req); // ToDo: Move to runRequest?
    const result = await knex(tables.deleted_calls).select('*')
      .where('user_id', user_id)
      .andWhere('deleted_at', '>', `'${startOfDayDate()}'`);
    return result;
  });
});

app.post('/phoneCall', async function (req, res) {
  runRequest(req, res, async (req) => {
    const user_id = resolveUserId(req);
    const { number, contact_name, start_date, end_date, is_answered, type, messages_sent } = req.body;
    const phone_call_id = v4();
    await knex(tables.phone_calls)
      .insert({
        id: phone_call_id,
        number,
        contact_name,
        start_date: toDate(start_date),
        end_date: toDate(end_date),
        is_answered,
        type,
        user_id,
        is_active: true,
        created_at: now(),
      });
    prepareMessagesSent(messages_sent, phone_call_id);
    await knex(tables.messages_sent)
      .insert(messages_sent);
    return phone_call_id;
  });
});

app.post('/phoneCalls', async function (req, res) {
  runRequest(req, res, async (req) => {
    const phone_calls = req.body;
    const user_id = resolveUserId(req);
    if (!Array.isArray(phone_calls)) throw Error('Not array exception in phoneCalls');
    const phone_calls_array = [];
    const messages_sent_array = [];
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

    await knex(tables.phone_calls)
      .insert(phone_calls_array)
      .onConflict(['start_date', 'user_id'])
      .ignore();
    await knex(tables.messages_sent)
      .insert(messages_sent_array)

    return phone_calls_array.map((value) => value.id);
  });
});

app.patch('/settings', async function (req, res) {
  runRequest(req, res, async function (req) {
    const user_id = resolveUserId(req);
    const { key, value } = req.body;
    const modified_at = now();
    const data = [{ key, value, user_id, modified_at }];
    await knex(tables.settings)
      .insert(data)
      .onConflict(['key', 'user_id'])
      .merge({
        value,
        modified_at
      });
  });
});

app.get('/settings/:key?', async function (req, res) {
  runRequest(req, res, async function (req) {
    const { key } = req.params;
    const user_id = resolveUserId(req);
    let result = null;
    if (key) {
      result = await knex(tables.settings).select('*')
        .where('user_id', user_id).andWhere('key', key);
    } else {
      result = await knex(tables.settings).select('*')
        .where('user_id', user_id)
    }
    return result;

  });
});

app.delete('/messagesInFolders', async function (req, res) {
  runRequest(req, res, async function (req) {
    const { folder_id } = req.body;
    await knex(tables.messages_in_folders).update({
      'is_active': false
    }).where('folder_id', folder_id);
  });
});


/* Statistics */

app.get('/statistics/callsCount', async function (req, res) {
  runRequest(req, res, async (req) => {
    const user_id = resolveUserId(req);
    const incoming_query = 'select COUNT(*) '
      + 'from phone_calls '
      + 'where type = \'INCOMING\' and user_id = ?';

    const outgoing_query = 'select COUNT(*) '
      + 'from phone_calls '
      + 'where type = \'OUTGOING\' and user_id = ?';

    const missed_query = 'select COUNT(*) '
      + 'from phone_calls '
      + 'where type = \'MISSED\' and user_id = ?';

    const rejected_query = 'select COUNT(*) '
      + 'from phone_calls '
      + 'where type = \'REJECTED\' and user_id = ?';

    const incoming_count = (await knex.raw(incoming_query, user_id)).rows;
    const outgoing_count = (await knex.raw(outgoing_query, user_id)).rows;
    const missed_count = (await knex.raw(missed_query, user_id)).rows;
    const rejected_count = (await knex.raw(rejected_query, user_id)).rows;
    return {
      incoming_count: incoming_count.length > 0 ? incoming_count[0].count : 0,
      outgoing_count: outgoing_count.length > 0 ? outgoing_count[0].count : 0,
      missed_count: missed_count.length > 0 ? missed_count[0].count : 0,
      rejected_count: rejected_count.length > 0 ? rejected_count[0].count : 0,
    }
  });
});

app.get('/statistics/messagesSentCount', async function (req, res) {
  runRequest(req, res, async (req) => {
    const user_id = resolveUserId(req);
    const query = 'select Count( m_ms.title), m_ms.title\n'
      + 'from (\n'
      + 'messages_sent\n'
      + 'join messages\n'
      + 'on messages_sent.message_id = messages.id\n'
      + ') as m_ms\n'
      + 'where user_id = ?\n'
      + 'group by m_ms.title;'
    const messages_sent_count = (await knex.raw(query, user_id)).rows;
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
};

module.exports.handler = serverless(app);
