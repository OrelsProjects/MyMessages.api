const express = require('express');
const serverless = require('serverless-http');
const { v4 } = require('uuid');
const { runRequest, runRequestCallback } = require('../common/request_wrapper');
const { tables } = require('../common/constants');
const { toDate, now, startOfDayDate, formatStartAndEndDate } = require('../common/utils/date');
const { knex } = require('../common/request_wrapper');
const { log } = require('../common/log');

const app = express();

app.use(express.json({ limit: '5mb' }));

/* Users */

app.get('/users', async function (req, res) {
  runRequest(req, res, async (_, user_id) => {
    const result = await knex(tables.users)
      .where('id', user_id)
      .first();
    return result;
  });
});

app.post('/users', async function (req, res) {
  runRequest(req, res, async (req, user_id) => {
    const { first_name, last_name, gender, email, number } = req.body;
    await knex(tables.users)
      .insert({
        id: user_id,
        first_name,
        last_name,
        gender,
        email,
        number,
        created_at: now(),
        is_active: true
      })
      .onConflict(['id'])
      .ignore();
    return user_id;
  });
});

/* Users */

/* Folders */

app.post('/folders', async function (req, res) {
  runRequest(req, res, async (req, user_id) => {
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
  runRequest(req, res, async (req, user_id) => {
    const { id, title, position, is_active, times_used } = req.body;
    const folder_data = { title, position: position ? position : 0, is_active, times_used }
    const message_in_folder_data = { folder_id: id, is_active, user_id };
    await knex(tables.folders)
      .update(folder_data)
      .where('id', id);
    await knex(tables.messages_in_folders)
      .update({ is_active })
      .where('folder_id', id);

    log(tables.folders, folder_data, user_id, knex);
    log(tables.messages_in_folders, message_in_folder_data, user_id, knex);
  });
});


app.delete('/folders/:id', async function (req, res) {
  runRequest(req, res, async (req, user_id) => {
    const { id } = req.params;
    const is_active = false
    await knex.transaction(function (trx) {
      knex(tables.folders)
        .update({ is_active })
        .where('id', id)
        .transacting(trx)
        .then(async () => {
          await knex(tables.messages_in_folders)
            .update({ is_active })
            .where('folder_id', id)
            .transacting(trx)
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })

    log(tables.folders, { id, is_active }, user_id, knex);
    log(tables.messages_in_folders, { folder_id: id, is_active }, user_id, knex);
  });
});

app.get('/folders', async function (req, res) {
  runRequest(req, res, async (_, user_id) => {
    const result = await knex(tables.folders)
      .select('*')
      .where('user_id', user_id);
    return result;
  });
});

/* Folders */

/* Messages */

app.post('/messages', async function (req, res) {
  runRequest(req, res, async (req, user_id) => {
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

    if (messages_data.length == 0) {
      return [];
    }
    await knex(tables.messages)
      .insert(messages_data);
    await knex(tables.messages_in_folders)
      .insert(messages_in_folder_data);

    await log(tables.messages, messages_data, user_id, knex);
    await log(tables.messages_in_folders, messages_in_folder_data, user_id, knex);
    return messages_data.map((message) => message.id);
  });
});

app.patch('/messages', async function (req, res) {
  runRequest(req, res, async (req, user_id) => {
    const { id, title, short_title, body, folder_id, position, times_used, is_active, previous_folder_id } = req.body;
    const message_data = { title, short_title, body, position, times_used, is_active };
    await knex(tables.messages)
      .update(
        message_data
      )
      .where('id', id);
    const message_in_folder_data = {
      message_id: id,
      folder_id,
      is_active
    };
    if (previous_folder_id && folder_id) {
      await knex(tables.messages_in_folders)
        .update(message_in_folder_data)
        .where('folder_id', previous_folder_id)
        .andWhere('message_id', id);
      message_in_folder_data.id = id;
      message_in_folder_data.user_id = user_id;
      await log(tables.messages_in_folders, message_in_folder_data, user_id, knex);
    }
    message_data.id = id;
    message_data.user_id = user_id;
    await log(tables.messages, message_data, user_id, knex);
  });
});

app.get('/messages', async function (req, res) {
  runRequest(req, res, async (_, user_id) => {
    const result = await knex.raw('SELECT m_f.id as message_in_folder_id, folder_id, message_id, title, is_active, short_title, body, position ,times_used'
      + ' FROM (\n' +
      '(SELECT id, folder_id, message_id FROM messages_in_folders WHERE folder_id in (\n' +
      `SELECT id FROM folders WHERE user_id = ?\n` +
      ')) m_f\n' +
      'JOIN (SELECT * FROM messages) AS m\n' +
      'ON m.id = m_f.message_id\n)', user_id);
    return result.rows;
  });
});

/* Messages */

/* Deleted Calls */

app.post('/deletedCalls', async function (req, res) {
  runRequest(req, res, async (req, user_id) => {
    const { number, deleted_at } = req.body;
    const deleted_at_date = toDate(deleted_at);
    const id = await knex(tables.deleted_calls)
      .insert({ id: v4(), user_id, deleted_at: deleted_at_date, number }, ['id'])
      .onConflict(['user_id', 'deleted_at'])
      .ignore()
    console.log(id)
    if (id[0] && id[0].id) {
      return id[0].id;
    }
  })
});

app.get('/deletedCalls/:from_date', async function (req, res) {
  runRequest(req, res, async (req, user_id) => {
    const { from_date } = req.params;
    const result = await knex(tables.deleted_calls).select('*')
      .where('user_id', user_id)
      .andWhere('deleted_at', '>', `'${toDate(from_date)}'`);
    return result;
  });
});

/**
 * @deprecated(27.08.2022, 19:11)
 */
app.get('/deletedCalls', async function (req, res) {
  runRequest(req, res, async (_, user_id) => {
    console.log('deleted calls deprecated')
    const result = await knex(tables.deleted_calls).select('*')
      .where('user_id', user_id)
      .andWhere('deleted_at', '>', `'${startOfDayDate()}'`);
    return result;
  });
});

/* Deleted Calls */

/* Phone Calls */

app.post('/phoneCall', async function (req, res) {
  runRequest(req, res, async (req, user_id) => {
    const { number, contact_name, start_date, end_date, is_answered, type, messages_sent, actual_end_date } = req.body;
    const { start_date_formatted, end_date_formatted } = formatStartAndEndDate(start_date, end_date)
    const phone_call_id = v4();
    await knex(tables.phone_calls)
      .insert({
        id: phone_call_id,
        number,
        contact_name,
        start_date: start_date_formatted,
        end_date: end_date_formatted,
        actual_end_date: actual_end_date ? toDate(actual_end_date) : end_date_formatted,
        is_answered,
        type,
        user_id,
        is_active: true,
        created_at: now(),
      })
      .onConflict(['user_id', 'start_date'])
      .merge()
    prepareMessagesSent(messages_sent, phone_call_id);
    await knex(tables.messages_sent)
      .insert(messages_sent)
      .onConflict(['phone_call_id', 'sent_at', 'message_id'])
      .ignore();
    return phone_call_id;
  });
});

app.post('/phoneCalls', async function (req, res) {
  runRequestCallback(req, res, (req, user_id, callback, callbackError) => {
    const phone_calls = req.body;
    if (!Array.isArray(phone_calls)) throw Error('Not array exception in phoneCalls');
    const phone_calls_array = [];
    let messages_sent_array = [];

    phone_calls.forEach((phone_call) => {
      const {
        number,
        contact_name,
        start_date,
        end_date,
        actual_end_date,
        is_answered,
        type,
        messages_sent,
      } = phone_call;
      const phone_call_id = v4();
      const { start_date_formatted, end_date_formatted } = formatStartAndEndDate(start_date, end_date)
      phone_calls_array.push(
        {
          id: phone_call_id,
          number,
          contact_name,
          start_date: start_date_formatted,
          end_date: end_date_formatted,
          actual_end_date: actual_end_date ? toDate(actual_end_date) : end_date_formatted,
          is_answered,
          type,
          user_id,
          is_active: true,
          created_at: now(),
        }
      );
      prepareMessagesSent(messages_sent, phone_call_id);
      messages_sent?.forEach((value) => messages_sent_array.push(value));
    });
    knex.transaction(function (trx) {
      knex.insert(phone_calls_array, 'id')
        .into(tables.phone_calls)
        .transacting(trx)
        .onConflict(['user_id', 'start_date'])
        .ignore()
        .transacting(trx)
        .then(async function (ids) {
          console.log(ids);
          messages_sent_array = messages_sent_array?.filter((ms) => {
            return ids.map((id) => id.id).includes(ms['phone_call_id'])
          });

          if (messages_sent_array && messages_sent_array.length > 0) {
            console.log(`After upload: ${JSON.stringify(messages_sent_array)}`);
            return await knex
              .insert(messages_sent_array)
              .into(tables.messages_sent)
              .onConflict(['phone_call_id', 'sent_at', 'message_id'])
              .ignore()
              .transacting(trx)
          }
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
      .then(function () {
        const result = phone_calls_array.map((value) => value.id);
        callback(res, result)
      })
      .catch(function (error) {
        callbackError(res, error);
      }); // transaction
  }); // runRequestCallback
});

/* Phone Calls */

/* Settings */

app.patch('/settings', async function (req, res) {
  runRequest(req, res, async function (req, user_id) {
    let settings_list = req.body;
    if (!Array.isArray(settings_list)) {
      settings_list = [settings_list];
    }
    prepareSettingsList(settings_list, user_id);
    await knex(tables.settings)
      .insert(settings_list)
      .onConflict(['key', 'user_id'])
      .merge(['value', 'modified_at']);
    await log(tables.settings, settings_list, user_id, knex);
  });
});

/* Messages In Folders */
app.get('/settings/:key?', async function (req, res) {
  runRequest(req, res, async function (req, user_id) {
    const { key } = req.params;
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

/* Settings */

app.delete('/messagesInFolders/:folder_id?', async function (req, res) {
  runRequest(req, res, async function (req, user_id) {
    const { folder_id } = req.params;
    if (folder_id) {
      await knex(tables.messages_in_folders).update({
        'is_active': false
      }).where('folder_id', folder_id);
      log(tables.messages_in_folders, { is_active: false, folder_id }, user_id, knex);
    }
  });
});
/* Messages In Folders */

/* Statistics */

app.get('/statistics/callsCount/:start_date?/:end_date?', async function (req, res) {
  runRequest(req, res, async (req, user_id) => {
    let { start_date, end_date } = req.query;

    let date_query = '';
    let values = [user_id];
    if (start_date) {
      start_date = toDate(start_date);
      date_query += ' start_date > ? ';
      values.push(start_date);
    }
    if (end_date) {
      end_date = toDate(end_date);
      date_query += date_query.length == 0 ? '' : ' and ';
      date_query += ' start_date < ? ';
      values.push(end_date);
    }

    const incoming_query = 'select COUNT(*) '
      + 'from phone_calls '
      + 'where type = \'INCOMING\' and user_id = ?'
      + (date_query.length > 0 ? ` and ${date_query}` : '');

    const outgoing_query = 'select COUNT(*) '
      + 'from phone_calls '
      + 'where type = \'OUTGOING\' and user_id = ? '
      + (date_query.length > 0 ? ` and ${date_query}` : '');

    const missed_query = 'select COUNT(*) '
      + 'from phone_calls '
      + 'where type = \'MISSED\' and user_id = ? '
      + (date_query.length > 0 ? ` and ${date_query}` : '');

    const rejected_query = 'select COUNT(*) '
      + 'from phone_calls '
      + 'where type = \'REJECTED\' and user_id = ?'
      + (date_query.length > 0 ? ` and ${date_query}` : '');

    const incoming_count = (await knex.raw(incoming_query, values)).rows;
    const outgoing_count = (await knex.raw(outgoing_query, values)).rows;
    const missed_count = (await knex.raw(missed_query, values)).rows;
    const rejected_count = (await knex.raw(rejected_query, values)).rows;

    return {
      incoming_count: incoming_count.length > 0 ? incoming_count[0].count : 0,
      outgoing_count: outgoing_count.length > 0 ? outgoing_count[0].count : 0,
      missed_count: missed_count.length > 0 ? missed_count[0].count : 0,
      rejected_count: rejected_count.length > 0 ? rejected_count[0].count : 0,
    }
  });
});

app.get('/statistics/messagesSentCount/:startDate?/:endDate?', async function (req, res) {
  runRequest(req, res, async (req, user_id) => {
    let { start_date, end_date } = req.query;

    let date_query = '';
    let values = [user_id];
    if (start_date) {
      start_date = toDate(start_date);
      date_query += ' sent_at > ? ';
      values.push(start_date);
    }
    if (end_date) {
      end_date = toDate(end_date);
      date_query += date_query.length == 0 ? '' : ' and ';
      date_query += ' sent_at < ? ';
      values.push(end_date);
    }

    const query = 'select Count( m_ms.title), m_ms.title\n'
      + 'from (\n'
      + 'messages_sent\n'
      + 'as ms join messages\n'
      + 'on ms.message_id = messages.id\n'
      + ') as m_ms\n'
      + 'where user_id = ?\n'
      + (date_query.length > 0 ? `and ${date_query}\n` : '')
      + 'group by m_ms.title;'

    const messages_sent_count = (await knex.raw(query, values)).rows;
    return messages_sent_count.length <= 0 ? null : messages_sent_count;
  });
});

/* Statistics */


app.use((req, res, next) => {
  return res.status(404).json({
    error: 'Not Found',
  });
});

const prepareMessagesSent = (messages_sent, phone_call_id) => {
  if (messages_sent == undefined || !Array.isArray(messages_sent)) {
    messages_sent = [];
  } else {
    messages_sent.map((value) => {
      value['id'] = v4();
      value['is_active'] = true;
      value['phone_call_id'] = phone_call_id;
      value['sent_at'] = toDate(value['sent_at']);
      value['created_at'] = now();
    });
  }
}

const prepareSettingsList = (settings_list, user_id) => {
  if (!Array.isArray(settings_list)) throw Error('Settings must be an array');
  settings_list.forEach((settings) => {
    settings.modified_at = now();
    settings.user_id = user_id;
  });
}

module.exports.handler = serverless(app);
