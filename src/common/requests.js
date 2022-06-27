
const buildInsertQuest = (table_name, columns, values) => {
    if (!Array.isArray(columns) || !Array.isArray(values)) {
        throw Error('columns and values must be arrays');
    }
    let query = `insert into ${table_name}(`;
    columns.forEach((column) => query += `${column}, `);
    query = `${query.substring(0, query.length - 2)})\n`;
    query += `values (`;
    values.forEach((value) => query += `'${value}', `);
    query = `${query.substring(0, query.length - 2)})\n`;
    return query;
}

/**
 * Inserts [values] into [columns] in [table_name], according
 * to the order of columns and values. ex.: columns[0] = values[0].
 * @param {string} table_name is the name of the table.
 * @param {[string]} columns are the columns to insert.
 * @param {[string]} values are the values to insert.
 * @param {Client} client is the postgres client.
 * @returns the row inserted.
 */
const insert = async (table_name, columns, values, client) => {
    const query = buildInsertQuest(table_name, columns, values);
    return client.query(query);
};

/**
 * Inserts [values] into [columns] in [table_name], according
 * to the order of columns and values. ex.: columns[0] = values[0].
 * in a batch
 * @param {string} table_name is the name of the table.
 * @param {[[string]]} columns are the columns to insert.
 * @param {[[string]]} values are the values to insert.
 * @param {Client} client is the postgres client.
 * @returns the row inserted.
 */
 const batchInsert = async (table_name, columns, values, client) => {
    const query = buildInsertQuest(table_name, columns, values);
    return client.query(query);
};

/**
 * Run a raw query on the db.
 * @param {string} query is the query to run.
 * @param {Client} client is the postgres client.
 */
const query = async (query, client) => {
    return client.query(query);
};

/**
 * Returns all the items where user_id == user_id from table.
 * @param {string} table is the table to run the query on.
 * @param {string} user_id is the user_id to match.
 * @param {Client} client is the postgres client.
 */
const selectAllByUserId = async (table, user_id, client) => {
    return query(`SELECT * FROM ${table} WHERE user_id = '${user_id}'`, client);
}

module.exports = {
    insert,
    query,
    selectAllByUserId
};
