const { runRequest } = require('../common/request_wrapper');
const { tables } = require('../common/constants');
const { now } = require('../common/utils/date');
const { knex } = require('../common/request_wrapper');

const getUser = async (req, context) => runRequest(req, context, async (_, user_id) => {
  const result = await knex(tables.users)
    .where('id', user_id)
    .first();
  return result;
});

const createUser = (req, context) => runRequest(req, context, async (req, user_id) => {
  const { first_name, last_name, gender, email, number } = JSON.parse(req.body);
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

module.exports = {
  getUser,
  createUser
}