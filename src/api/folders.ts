import { v4 } from "uuid";
import { runRequest } from "../common/request_wrapper";
import { tables } from "../common/constants";
import { knex } from "../common/request_wrapper";
import { log } from "../common/log";
import { now } from "../common/utils/date";

export const createFolder = async (req, context) =>
  runRequest(req, context, async (req, user_id) => {
    const { title, position } = JSON.parse(req.body);
    const id = v4();
    await knex(tables.folders).insert({
      id,
      title,
      times_used: 0,
      position: position ? position : 0,
      user_id,
      is_active: true,
      created_at: now(),
    });
    return id;
  });

export const updateFolder = async (req, context) =>
  runRequest(req, context, async (req, user_id) => {
    const { id, title, position, is_active, times_used } = JSON.parse(req.body);
    const folder_data = {
      title,
      position: position ? position : 0,
      is_active,
      times_used,
    };
    const message_in_folder_data = { folder_id: id, is_active, user_id };
    await knex(tables.folders).update(folder_data).where("id", id);
    await knex(tables.messages_in_folders)
      .update({ is_active })
      .where("folder_id", id);

    log(tables.folders, folder_data, user_id, knex);
    log(tables.messages_in_folders, message_in_folder_data, user_id, knex);
  });
// folder/:id
export const deleteFolder = async (req, context) =>
  runRequest(req, context, async (req, user_id) => {
    if (!req.pathParameters) {
      throw Error("Folder id must be sent in path parameters!");
    }
    const { id } = req.pathParameters;
    const is_active = false;
    await knex.transaction(function (trx) {
      knex(tables.folders)
        .update({ is_active })
        .where("id", id)
        .transacting(trx)
        .then(async () => {
          await knex(tables.messages_in_folders)
            .update({ is_active })
            .where("folder_id", id)
            .transacting(trx);
        })
        .then(trx.commit)
        .catch(trx.rollback);
    });

    log(tables.folders, { id, is_active }, user_id, knex);
    log(
      tables.messages_in_folders,
      { folder_id: id, is_active },
      user_id,
      knex
    );
  });

export const getFolders = async (req, context) =>
  runRequest(req, context, async (_, user_id) => {
    const result = await knex(tables.folders)
      .select("*")
      .where("user_id", user_id);
    return result;
  });

export const getDeletedFolders = async (req, context) =>
  runRequest(req, context, async (_, user_id) => {
    const result = await knex(tables.folders)
      .select("*")
      .where("user_id", user_id)
      .where("is_active", false);
    return result;
  });
