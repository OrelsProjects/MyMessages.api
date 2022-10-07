const { v4 } = require('uuid');
const { runRequest } = require('../common/request_wrapper');
const { tables } = require('../common/constants');
const { toDate, startOfDayDate } = require('../common/utils/date');
const { knex } = require('../common/request_wrapper');



const createDeletedCall = async (req, context) => runRequest(req, context, async (req, user_id) => {
    const { number, deleted_at } = JSON.parse(req.body);
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

const getDeletedCallsByDate = async (req, context) => runRequest(req, context, async (req, user_id) => {
    const { from_date } = req.pathParameters;
    const result = await knex(tables.deleted_calls).select('*')
        .where('user_id', user_id)
        .andWhere('deleted_at', '>', `'${toDate(from_date)}'`);
    return result;
});

/**
 * @deprecated(27.08.2022, 19:11)
 */
const getDeletedCalls = async (req, context) => runRequest(req, context, async (_, user_id) => {
    console.log('deleted calls deprecated')
    const result = await knex(tables.deleted_calls).select('*')
        .where('user_id', user_id)
        .andWhere('deleted_at', '>', `'${startOfDayDate()}'`);
    return result;
});

module.exports = {
    createDeletedCall,
    getDeletedCallsByDate,
    getDeletedCalls
};