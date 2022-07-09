const onConflictPrefix = "ON CONFLICT"
const onConflict = {
    doNothing: `${onConflictPrefix} DO NOTHING`,
    /**
     * 
     * @param {[string]} columns all the columns of the table, in the same insert order.
     * @param {[string]} conflictColumns all the columns that might be conflicted.
     * @param {[string]} columnsToUpdate all the columns of the table to update.
     */
    update: (columns, conflictColumns, columnsToUpdate) => {
        if (!Array.isArray(columns) || !Array.isArray(columnsToUpdate) || !Array.isArray(conflictColumns)) {
            return '';
        }
        if (columns.length == 0 || columnsToUpdate.length == 0 || columnsToUpdate.length == 0) {
            return ''
        }
        let conflict = `${onConflictPrefix} (`;
        for (let i = 0; i < conflictColumns.length; i += 1) {
            conflict += `${conflictColumns[i]}, `;
        }
        conflict = conflict.substring(0, conflict.length - 2) + ')'
        for (let i = 0; i < columns.length; i += 1) {
            if (columnsToUpdate.includes(columns[i])) {
                if (!conflict.includes('DO UPDATE SET')) {
                    conflict += '\nDO UPDATE SET ';
                }
                conflict += ` ${columns[i]} = $${i + 1}, `;
            }
        }
        return conflict.substring(0, conflict.length - 2);
    }
};

module.exports = {
    onConflict
}