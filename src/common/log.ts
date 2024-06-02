export const log = async (table, data, user_id, db) => {
  try {
    // if (!user_id) console.log("user id in log is undefined");
    // const log_table_name = table + tables.log_suffix;
    // if (tables.hasOwnProperty(table)) {
    //   await createLogTable(log_table_name, table, db);
    // }
    // if (Array.isArray(data)) {
    //   data.forEach((it) => {
    //     it.log_id = v4();
    //     it.user_id = user_id;
    //   });
    // } else {
    //   data.log_id = v4();
    //   data.user_id = user_id;
    // }

    // await db(log_table_name).insert(data);
  } catch (error) {
    console.log(error);
  }
};