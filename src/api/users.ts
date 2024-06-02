import { runRequest } from "../common/request_wrapper";
import { tables } from "../common/constants";
import { now } from "../common/utils/date";
import { knex } from "../common/request_wrapper";

export const getUser = async (req, context) =>
  runRequest(req, context, async (_, user_id) => {
    const result = await knex(tables.users)
      .where("id", user_id)
      .where("is_active")
      .first();
    return result;
  });

export const createUser = (req, context) =>
  runRequest(req, context, async (req, user_id) => {
    const { first_name, last_name, gender, email, number } = JSON.parse(
      req.body
    );
    await knex(tables.users)
      .insert({
        id: user_id,
        first_name,
        last_name,
        gender,
        email,
        number,
        created_at: now(),
        is_active: true,
      })
      .onConflict(["id"])
      .ignore();
    return user_id;
  });
