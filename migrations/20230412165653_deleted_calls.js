import { tables } from "../src/common/constants";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  // create table deleted_calls
  // id: uuid, user_id: uuid, deleted_at: timestamp, number: string
  // unique: [deleted_at, user_id], user_id as fk
  return knex.schema.createTable(tables.deleted_calls, (table) => {
    table.uuid("id").defaultTo(knex.raw("uuid_generate_v4()")).primary();
    table.uuid("user_id").notNullable();
    table.timestamp("deleted_at").defaultTo(knex.fn.now());
    table.string("number").notNullable();
    table.foreign("user_id").references("id").inTable(tables.users);
    table.unique(["deleted_at", "user_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable(tables.deleted_calls);
};
