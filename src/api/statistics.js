const { runRequest } = require('../common/request_wrapper');
const { toDate } = require('../common/utils/date');
const { knex } = require('../common/request_wrapper');

const getCallsCountByDay = async (req, context) => runRequest(req, context, async (req, user_id) => {
  let start_date = null;
  let end_date = null;
  if (req.queryStringParameters) {
    start_date = req.queryStringParameters.start_date;
    end_date = req.queryStringParameters.end_date;
  }
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

  query = 'select  EXTRACT(DAY FROM start_date) as day,\n'
    + ' EXTRACT(MONTH FROM start_date) as month,\n'
    + ' EXTRACT(YEAR FROM start_date) as year,\n'
    + ' type, count(*)\n'
    + ' from phone_calls\n'
    + ' where user_id = ?'
    + (date_query.length > 0 ? ` and ${date_query}` : '')
    + '\ngroup by day, month, year, type';

  const result = (await knex.raw(query, values)).rows;

  return result;

})

const getCallsCount = async (req, context) => runRequest(req, context, async (req, user_id) => {
  let start_date = null;
  let end_date = null;
  if (req.queryStringParameters) {
    start_date = req.queryStringParameters.start_date;
    end_date = req.queryStringParameters.end_date;
  }

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
const getMessagesSentCount = async (req, context) => runRequest(req, context, async (req, user_id) => {
  let start_date = null;
  let end_date = null;
  if (req.queryStringParameters) {
    start_date = req.queryStringParameters.start_date;
    end_date = req.queryStringParameters.end_date;
  }

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
  return messages_sent_count.length <= 0 ? [] : messages_sent_count;
});

module.exports = {
  getCallsCountByDay,
  getCallsCount,
  getMessagesSentCount,
}