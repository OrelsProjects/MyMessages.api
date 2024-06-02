import { runRequest } from "../common/request_wrapper";
import { tables } from "../common/constants";
import { knex } from "../common/request_wrapper";
import { log } from "../common/log";

export const deleteMessagesFromFolder = async (req, context) =>
  runRequest(req, context, async function (req, user_id) {
    const { folder_id } = JSON.parse(req.body);
    if (!folder_id) {
      throw Error("Folder id is required.");
    }
    if (folder_id) {
      await knex(tables.messages_in_folders)
        .update({
          is_active: false,
        })
        .where("folder_id", folder_id);
      log(
        tables.messages_in_folders,
        { is_active: false, folder_id },
        user_id,
        knex
      );
    }
  });
