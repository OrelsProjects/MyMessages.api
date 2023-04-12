import { tables } from "../src/common/constants";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable(tables.messages_sent, (table) => {
    table.uuid("id").defaultTo(knex.raw("uuid_generate_v4()")).primary();
    table.uuid("message_id").notNullable();
    table.uuid("phone_call_id").notNullable();
    table.timestamp("sent_at").defaultTo(knex.fn.now());
    table.boolean("is_active").defaultTo(true);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.foreign("message_id").references("id").inTable(tables.messages);
    table.foreign("phone_call_id").references("id").inTable(tables.phone_calls);
    table.unique(["message_id", "phone_call_id", "sent_at"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable(tables.messages_sent);
};
