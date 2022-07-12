const onConflictPrefix = "ON CONFLICT";
const onConflictDoNothing = "DO NOTHING";
const onConflictDoUpdate = "DO UPDATE SET";
function buildOnConflictQuery(columns, conflictColumns, columnsToUpdate) {
    if (!Array.isArray(columns) || !Array.isArray(columnsToUpdate) || !Array.isArray(conflictColumns)) {
        return '';
    }
    if (conflictColumns.length == 0) {
        return ''
    }
    let conflict = `${onConflictPrefix} (`;
    for (let i = 0; i < conflictColumns.length; i += 1) {
        conflict += `${conflictColumns[i]}, `;
    }
    conflict = conflict.substring(0, conflict.length - 2) + ')';
    for (let i = 0; i < columns.length; i += 1) {
        if (columnsToUpdate.includes(columns[i])) {
            if (!conflict.includes(`${onConflictDoUpdate}`)) {
                conflict += `\n${onConflictDoUpdate} `;
            }
            conflict += ` ${columns[i]} = $${i + 1}, `;
            if (i == columns.length - 1) {
                conflict = conflict.substring(0, conflict.length - 2);
            }
        }
    }
    return conflict;
}

const onConflict = {
    doNothing: (conflictColumns) => {
        let onConflictQuery = buildOnConflictQuery([], conflictColumns, []);
        onConflictQuery += ` ${onConflictDoNothing}`;
        return onConflictQuery;
    },
    /**
     * 
     * @param {[string]} columns all the columns of the table, in the same insert order.
     * @param {[string]} conflictColumns all the columns that might be conflicted.
     * @param {[string]} columnsToUpdate all the columns of the table to update.
     */
    update: (columns, conflictColumns, columnsToUpdate) => buildOnConflictQuery(columns, conflictColumns, columnsToUpdate),
}

module.exports = {
    onConflict
}