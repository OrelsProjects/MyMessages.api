import { v4 } from "uuid";
import { runRequest } from "../common/request_wrapper";
import { tables } from "../common/constants";
import { toDate, startOfDayDate } from "../common/utils/date";
import { knex } from "../common/request_wrapper";

export const createDeletedCall = async (req, context) =>
  runRequest(req, context, async (req, user_id) => {
    const { number, deleted_at } = JSON.parse(req.body);
    const deleted_at_date = toDate(deleted_at);
    const id = await knex(tables.deleted_calls)
      .insert({ id: v4(), user_id, deleted_at: deleted_at_date, number }, [
        "id",
      ])
      .onConflict(["user_id", "deleted_at"])
      .ignore();
    if (id[0] && id[0].id) {
      return id[0].id;
    }
  });

export const getDeletedCallsByDate = async (req, context) =>
  runRequest(req, context, async (req, user_id) => {
    if (!req.pathParameters.from_date) {
      throw Error("from_date must be sent in path parameters!");
    }
    const { from_date } = req.pathParameters;
    const result = await knex(tables.deleted_calls)
      .select("*")
      .where("user_id", user_id)
      .andWhere("deleted_at", ">", `'${toDate(from_date)}'`);
    return result;
  });

/**
 * @deprecated(27.08.2022, 19:11)
 */
const getDeletedCalls = async (req, context) =>
  runRequest(req, context, async (_, user_id) => {
    console.log("deleted calls deprecated");
    const result = await knex(tables.deleted_calls)
      .select("*")
      .where("user_id", user_id)
      .andWhere("deleted_at", ">", `'${startOfDayDate()}'`);
    return result;
  });
