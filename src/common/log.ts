import { tables } from "../common/constants";
import { v4 } from "uuid";

const COLUMN_LOG_ID = "log_id";
const COLUMN_LOGGED_AT = "logged_at";

export const log = async (table, data, user_id, db) => {
  try {
    if (!user_id) console.log("user id in log is undefined");
    const log_table_name = table + tables.log_suffix;
    if (tables.hasOwnProperty(table)) {
      await createLogTable(log_table_name, table, db);
    }
    if (Array.isArray(data)) {
      data.forEach((it) => {
        it.log_id = v4();
        it.user_id = user_id;
      });
    } else {
      data.log_id = v4();
      data.user_id = user_id;
    }

    await db(log_table_name).insert(data);
  } catch (error) {
    console.log(error);
  }
};

const createLogTable = async (log_table_name, table_name, db) => {
  if (await db.schema.hasTable(log_table_name)) return;
  let columns = (
    await db.raw(
      `SELECT column_name FROM information_schema.columns WHERE table_name = ?;`,
      [table_name]
    )
  ).rows;
  columns = columns?.map((column) => column.column_name);
  await db.schema.createTableLike(log_table_name, table_name, function (t) {
    t.uuid(COLUMN_LOG_ID).notNullable();
    t.dateTime(COLUMN_LOGGED_AT, { precision: 6 })
      .notNullable()
      .defaultTo(db.fn.now(6));
    if (!columns.includes("user_id")) {
      t.uuid("user_id").notNullable();
    }
  });
  await db.schema.table(log_table_name, function (t) {
    t.dropPrimary(`${log_table_name}_pkey`);
    t.primary(COLUMN_LOG_ID);
    columns.forEach((column) => {
      t.dropNullable(column);
      t.setNullable(column);
    });
  });
};
