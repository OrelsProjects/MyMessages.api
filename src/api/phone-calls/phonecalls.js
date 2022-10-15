const { v4 } = require('uuid');
const { runRequest, runRequestCallback } = require('../../common/request_wrapper');
const { tables } = require('../../common/constants');
const { toDate, now } = require('../../common/utils/date');
const { knex } = require('../../common/request_wrapper');
const { prepareMessagesSent } = require('./utils');

const createPhoneCall = async (req, context) => runRequest(req, context, async (req, user_id) => {
    const { number, contact_name, start_date, end_date, is_answered, type, messages_sent } = JSON.parse(req.body);
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

const createPhoneCalls = async (req, context) => runRequest(req, context, async (req, user_id) => {
    const phone_calls = JSON.parse(req.body);
    if (!Array.isArray(phone_calls)) throw Error('Not array exception in phoneCalls');
    const phone_calls_array = [];
    let messages_sent_array = [];
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
        messages_sent?.forEach((value) => messages_sent_array.push(value));
    });
    return new Promise(function (resolve, reject) {
        knex.transaction(function (trx) {
            knex.insert(phone_calls_array, 'id')
                .into(tables.phone_calls)
                .transacting(trx)
                .onConflict(['user_id', 'start_date'])
                .ignore()
                .transacting(trx)
                .then(async function (ids) {
                    messages_sent_array = messages_sent_array?.filter((ms) => {
                        return ids.map((id) => id.id).includes(ms['phone_call_id'])
                    });

                    if (messages_sent_array && messages_sent_array.length > 0) {
                        return await knex
                            .insert(messages_sent_array)
                            .into(tables.messages_sent)
                            .onConflict(['phone_call_id', 'sent_at', 'message_id'])
                            .ignore()
                            .transacting(trx)
                    }
                })
                .then((_) => {
                    const phone_call_ids = phone_calls_array.map((phone_call) => phone_call.id) ?? [];
                    resolve(phone_call_ids);
                })
                .catch((err) => reject(err))

        });
    });
}); // runRequestCallback

module.exports = {
    createPhoneCall,
    createPhoneCalls
};