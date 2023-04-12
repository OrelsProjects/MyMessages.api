import { tables } from "../src/common/constants";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  // create a table phone_calls
  // id: uuid, number: string, start_date: timestamp, end_date: timestamp, type: string, is_answered: boolean, user_id: uuid, is_active: boolean, contact_name: string, created_at: timestamp
  // add a foreign key to user_id
  // unique: start_date, user_id. fk: user_id
  return knex.schema.createTable(tables.phone_calls, (table) => {
    table.uuid("id").defaultTo(knex.raw("uuid_generate_v4()")).primary();
    table.string("number").notNullable();
    table.timestamp("start_date").defaultTo(knex.fn.now());
    table.timestamp("end_date").defaultTo(knex.fn.now());
    table.string("type").notNullable();
    table.boolean("is_answered").defaultTo(true);
    table.uuid("user_id").notNullable();
    table.boolean("is_active").defaultTo(true);
    table.string("contact_name").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.foreign("user_id").references("id").inTable(tables.users);
    table.unique(["start_date", "user_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable(tables.phone_calls);
};
