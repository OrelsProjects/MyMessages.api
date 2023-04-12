import { tables } from "../src/common/constants";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable(tables.users, (table) => {
    table.uuid("id").primary();
    table.string("first_name").nullable();
    table.string("last_name").nullable();
    table.string("email").nullable();
    table.string("number").nullable();
    table.string("gender").nullable();
    table.boolean("is_active").defaultTo(true);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("modified_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable(tables.users);
};
