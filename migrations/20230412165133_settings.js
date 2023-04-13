const { tables } = require("../src/common/constants");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  // create a table settings
  // key: string, value: string, user_id: uuid, modified_at: timestamp, enabled: boolean
  return knex.schema.createTable(tables.settings, (table) => {
    table.uuid("id").defaultTo(knex.raw("uuid_generate_v4()")).primary();
    table.string("key").notNullable();
    table.string("value").notNullable();
    table.uuid("user_id").notNullable();
    table.boolean("enabled").defaultTo(true);
    table.timestamp("modified_at").defaultTo(knex.fn.now());
    table.foreign("user_id").references("id").inTable(tables.users);
    table.unique(["key", "user_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable(tables.settings);
};
