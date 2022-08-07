const { tables } = require('../common/constants');
const { v4 } = require('uuid');
const { now } = require('../common/utils/date');

const COLUMN_LOG_ID = 'log_id';
const COLUMN_MODIFIED_AT = 'modified_at';

const log = async (table, data, db) => {
    const log_table_name = table + tables.log_suffix;
    if (tables.hasOwnProperty(table)) {
        await createLogTable(log_table_name, table, db);
    }
    if (Array.isArray(data)) {
        data.forEach((it) => it.log_id = v4());
    } else {
        data.log_id = v4();
    }
    data.modified_at = now();
    await db(log_table_name)
        .insert(data)
}

const createLogTable = async (log_table_name, table_name, db) => {
    if (await db.schema.hasTable(log_table_name)) return;
    let columns = (await db.raw(`SELECT column_name FROM information_schema.columns WHERE table_name = ?;`, [table_name])).rows;
    columns = columns?.map((column) => column.column_name);
    await db.schema.createTableLike(log_table_name, table_name, function (t) {
        t.uuid(COLUMN_LOG_ID).notNullable();
        t.dateTime(COLUMN_MODIFIED_AT).notNullable();
    });
    await db.schema.table(log_table_name, function (t) {
        t.dropPrimary(`${log_table_name}_pkey`);
        t.primary(COLUMN_LOG_ID);
        columns.forEach((column) => {
            t.dropNullable(column);
            t.setNullable(column);
        });
    });
}

module.exports = {
    log
}