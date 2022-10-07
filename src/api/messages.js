const { v4 } = require('uuid');
const { runRequest } = require('../common/request_wrapper');
const { tables } = require('../common/constants');
const { now } = require('../common/utils/date');
const { knex } = require('../common/request_wrapper');
const { log } = require('../common/log');

const createMessage = async (req, context) => runRequest(req, context, async (req, user_id) => {
    let { messages } = JSON.parse(req.body);
    if (!Array.isArray(messages)) {
        const { title, short_title, body, folder_id, position, times_used, user_id } = JSON.parse(req.body);
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

const updateMessage = async (req, context) => runRequest(req, context, async (req, user_id) => {
    const { id, title, short_title, body, folder_id, position, times_used, is_active, previous_folder_id } = JSON.parse(req.body);
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

const getMessages = async (req, context) => runRequest(req, context, async (_, user_id) => {
    const result = await knex.raw('SELECT m_f.id as message_in_folder_id, folder_id, message_id, title, is_active, short_title, body, position ,times_used'
        + ' FROM (\n' +
        '(SELECT id, folder_id, message_id FROM messages_in_folders WHERE folder_id in (\n' +
        `SELECT id FROM folders WHERE user_id = ?\n` +
        ')) m_f\n' +
        'JOIN (SELECT * FROM messages) AS m\n' +
        'ON m.id = m_f.message_id\n)', user_id);
    return result.rows;
});

module.exports = {
    createMessage,
    updateMessage,
    getMessages
}