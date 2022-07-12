const buildUpdateQuery = (table_name, columns, values) => {
    if (!Array.isArray(columns) || !Array.isArray(values)) {
        throw Error('columns and values must be arrays');
    }
    let query = `UPDATE ${table_name} \n SET `;
    for (let i = 0; i < columns.length; i += 1) {
        query += `${columns[i]} = '${values[i]}', `;
    }
    query = query.substring(0, query.length - 2);
    return query;
};

const buildUpdateQueryWithId = (table_name, columns, values, id) => {
    let query = buildUpdateQuery(table_name, columns, values);
    query += `\n WHERE id = '${id}'`;
    return query;
}

const buildUpdateQueryWithWhere = (table_name, columns, values, where = '') => {
    let query = buildUpdateQuery(table_name, columns, values);
    query += `\n ${where}`;
    return query;
}

/**
 * Updates [columns] in [table_name] with [values], using a where clause
 * id = [id], according to the order of columns and values. ex.: columns[0] = values[0].
 * @param {string} table_name is the name of the table.
 * @param {[string]} columns are the columns to insert.
 * @param {[string]} values are the values to insert.
 * @param {string} where is the where clause in the query.
 * @param {Client} client is the postgres client.
 * @returns the row inserted.
 */
const updateWithId = async (table_name, columns, values, id, client) => {
    const query = buildUpdateQueryWithId(table_name, columns, values, id);
    return client.query(query);
};

/**
 * Updates [columns] in [table_name] with [values], using a [where] clause
 * according to the order of columns and values. ex.: columns[0] = values[0].
 * @param {string} table_name is the name of the table.
 * @param {[string]} columns are the columns to insert.
 * @param {[string]} values are the values to insert.
 * @param {string} where is the where clause in the query.
 * @param {Client} client is the postgres client.
 * @returns the row inserted.
 */
const updateWithWhere = async (table_name, columns, values, where, client) => {
    const query = buildUpdateQueryWithWhere(table_name, columns, values, where);
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
const selectAllByUserId = async (table, user_id, client, is_active = true, where = null) => {
    const selectQuery = `SELECT * FROM ${table} WHERE user_id = '${user_id}' ${is_active ? `AND is_active = 'true'` : ''}` +
        `${where ? `AND ${where}` : ''}`
    return query(selectQuery, client);
}

/**
 * Inserts [values] into [columns] in [table_name], according
 * to the order of columns and values. ex.: columns[0] = values[0],
 * with on conflict parameters
 * @param {string} table_name is the name of the table.
 * @param {[string]} columns are the columns to insert.
 * @param {[string]} values are the values to insert.
 * @param {Client} client is the postgres client.
 * @param {string = string, string = string} do_on_conflict are the instructions of what to do if a conflict occurred.
 * @returns the row inserted.
 */
const insert = async (
    table_name,
    columns,
    values,
    client,
    do_on_conflict,
    return_column
) => {
    const config = buildInsertQueryConfig(
        table_name,
        columns,
        values,
        return_column,
        do_on_conflict
    );
    let results = []
    for (const value of config.values) {
        let result = (await client.query(config.query, value)).rows;
        if (result?.length > 0) {
            if (return_column != null) {
                results.push(result[return_column]);
            } else {
                results.push(result);
            }
        }
    }
    return results;
}

const buildInsertQueryConfig = (table_name, columns, values, return_column, on_conflict) => {
    if (!Array.isArray(columns) || !Array.isArray(values)) {
        throw Error('columns and values must be arrays');
    }
    let config = {};
    let query = `INSERT INTO ${table_name}(`;
    columns.forEach((column) => query += `${column}, `);
    query = `${query.substring(0, query.length - 2)})`;
    query += `\nVALUES(`;
    let k = 1;
    columns.forEach(() => query += `$${k++}, `);
    query = `${query.substring(0, query.length - 2)}) `;
    query += `${on_conflict ? `\n${on_conflict}` : ''}`;
    query += `\nRETURNING ${return_column ? return_column : '*'} `;
    config.query = query;
    config.values = values;
    return config;
}

module.exports = {
    updateWithId,
    updateWithWhere,
    query,
    insert,
    selectAllByUserId,
    insert
};
