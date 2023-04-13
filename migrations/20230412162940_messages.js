const { tables } = require("../src/common/constants");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable(tables.messages, (table) => {
    table.uuid("id").defaultTo(knex.raw("uuid_generate_v4()")).primary();
    table.uuid("user_id").notNullable();
    table.string("title").notNullable();
    table.string("short_title").notNullable();
    table.string("body").notNullable();
    table.integer("times_used").defaultTo(0);
    table.integer("position").defaultTo(0);
    table.boolean("is_active").defaultTo(true);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("modified_at").defaultTo(knex.fn.now());
    table.foreign("user_id").references("id").inTable(tables.users);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable(tables.messages);
};
