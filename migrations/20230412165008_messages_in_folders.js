const { tables } = require("../src/common/constants");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable(tables.messages_in_folders, (table) => {
    table.uuid("id").defaultTo(knex.raw("uuid_generate_v4()")).primary();
    table.uuid("message_id").notNullable();
    table.uuid("folder_id").notNullable();
    table.boolean("is_active").defaultTo(true);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("modified_at").defaultTo(knex.fn.now());
    table.foreign("message_id").references("id").inTable(tables.messages);
    table.foreign("folder_id").references("id").inTable(tables.folders);
    table.unique(["message_id", "folder_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable(tables.messages_in_folders);
};
