import { v4 } from "uuid";
import { knex, runRequest } from "../../common/request_wrapper";
import { tables } from "../../common/constants";
import { toDate, now } from "../../common/utils/date";
import { prepareMessagesSent } from "./utils";
import { sendPhonecalls } from "../features/deepsiam";

export const createPhoneCall = async (req, context) =>
  runRequest(req, context, async (req, user_id) => {
    const {
      number,
      contact_name,
      start_date,
      end_date,
      is_answered,
      type,
      messages_sent,
      actual_end_date,
    } = JSON.parse(req.body);
    const phone_call_id = v4();
    await knex(tables.phone_calls)
      .insert({
        id: phone_call_id,
        number,
        contact_name,
        start_date: toDate(start_date),
        end_date: toDate(end_date),
        actual_end_date: toDate(actual_end_date),
        is_answered,
        type,
        user_id,
        is_active: true,
        created_at: now(),
      })
      .onConflict(["user_id", "start_date"])
      .merge();
    prepareMessagesSent(messages_sent, phone_call_id);
    await knex(tables.messages_sent)
      .insert(messages_sent)
      .onConflict(["phone_call_id", "sent_at", "message_id"])
      .ignore();
    return phone_call_id;
  });

export const createPhoneCalls = async (req, context) =>
  runRequest(req, context, async (req, user_id) => {
    const phone_calls = JSON.parse(req.body);
    if (!Array.isArray(phone_calls))
      throw Error("Not array exception in phoneCalls");
    const phone_calls_array = [];
    let messages_sent_array = [];
    phone_calls.forEach((phone_call) => {
      const {
        number,
        contact_name,
        start_date,
        end_date,
        is_answered,
        type,
        messages_sent,
        actual_end_date,
      } = phone_call;
      const phone_call_id = v4();
      const start_date_formatted = toDate(start_date);
      const end_date_formatted = toDate(end_date);
      const actual_end_date_formatted = toDate(actual_end_date);
      phone_calls_array.push({
        id: phone_call_id,
        number,
        contact_name,
        start_date: start_date_formatted,
        end_date: end_date_formatted,
        is_answered,
        type,
        user_id,
        is_active: true,
        actual_end_date: actual_end_date_formatted,
        created_at: now(),
      });
      prepareMessagesSent(messages_sent, phone_call_id);
      messages_sent?.forEach((value) => messages_sent_array.push(value));
    });
    const phone_call_ids = await new Promise(function (resolve, reject) {
      knex
        .transaction(function (trx) {
          knex
            .insert(phone_calls_array, "id")
            .into(tables.phone_calls)
            .transacting(trx)
            .onConflict(["user_id", "start_date"])
            .ignore()
            .then(async function (ids) {
              messages_sent_array = messages_sent_array?.filter((ms) => {
                return ids.map((id) => id.id).includes(ms["phone_call_id"]);
              });

              if (messages_sent_array && messages_sent_array.length > 0) {
                return await knex
                  .insert(messages_sent_array)
                  .into(tables.messages_sent)
                  .onConflict(["phone_call_id", "sent_at", "message_id"])
                  .ignore()
                  .transacting(trx);
              }
            })
            .then(trx.commit)
            .catch(trx.rollback);
        })
        .then(
          function (_) {
            const phone_call_ids =
              phone_calls_array.map((phone_call) => phone_call.id) ?? [];
            resolve(phone_call_ids);
          },
          (err) => {
            reject(err);
          }
        );
    });
    try {
      await sendPhonecalls(phone_calls, user_id);
    } catch (e) {}
    return phone_call_ids;
  }); // runRequestCallback

/**
 * const { v4 } = require("uuid");
const { runRequest } = require("../../common/request_wrapper");
const { tables } = require("../../common/constants");
const { toDate, now } = require("../../common/utils/date");
const { knex } = require("../../common/request_wrapper");
const { prepareMessagesSent } = require("./utils");
const { sendPhonecalls } = require("../features/deepsiam");

const createPhoneCall = async (req, context) =>
  runRequest(req, context, async (req, user_id) => {
    const {
      number,
      contact_name,
      start_date,
      end_date,
      is_answered,
      type,
      messages_sent,
      actual_end_date,
    } = JSON.parse(req.body);
    const phone_call_id = v4();
    await knex(tables.phone_calls)
      .insert({
        id: phone_call_id,
        number,
        contact_name,
        start_date: toDate(start_date),
        end_date: toDate(end_date),
        actual_end_date: toDate(actual_end_date),
        is_answered,
        type,
        user_id,
        is_active: true,
        created_at: now(),
      })
      .onConflict(["user_id", "start_date"])
      .merge();
    prepareMessagesSent(messages_sent, phone_call_id);
    await knex(tables.messages_sent)
      .insert(messages_sent)
      .onConflict(["phone_call_id", "sent_at", "message_id"])
      .ignore();
    return phone_call_id;
  });

const createPhoneCalls = async (req, context) =>
  runRequest(req, context, async (req, user_id) => {
    const phone_calls = JSON.parse(req.body);
    if (!Array.isArray(phone_calls))
      throw Error("Not array exception in phoneCalls");
    const phone_calls_array = [];
    let messages_sent_array = [];
    phone_calls.forEach((phone_call) => {
      const {
        number,
        contact_name,
        start_date,
        end_date,
        is_answered,
        type,
        messages_sent,
        actual_end_date,
      } = phone_call;
      const phone_call_id = v4();
      phone_calls_array.push({
        id: phone_call_id,
        number,
        contact_name,
        start_date: toDate(start_date),
        end_date: toDate(end_date),
        actual_end_date: toDate(actual_end_date),
        is_answered,
        type,
        user_id,
        is_active: true,
        created_at: now(),
      });
      prepareMessagesSent(messages_sent, phone_call_id);
      messages_sent?.forEach((value) => messages_sent_array.push(value));
    });

    try {
      const transactionResult = await knex.transaction(async (trx) => {
        const ids = await trx(tables.phone_calls)
          .insert(phone_calls_array)
          .onConflict(["user_id", "start_date"])
          .ignore()
          .returning("id");

        messages_sent_array = messages_sent_array.filter((ms) =>
          ids.map((id) => id.id).includes(ms["phone_call_id"])
        );

        if (messages_sent_array.length > 0) {
          await trx(tables.messages_sent)
            .insert(messages_sent_array)
            .onConflict(["phone_call_id", "sent_at", "message_id"])
            .ignore();
        }
      });

      const messages = await knex(tables.messages).select().where({ user_id });
      const phone_calls_with_message_name = phone_calls_array.map(
        (phone_call) => {
          const messages_sent = messages_sent_array.filter(
            (ms) => ms.phone_call_id === phone_call.id
          );
          const messages_sent_with_name = messages_sent.map((ms) => {
            const message = messages.find((m) => m.id === ms.message_id);
            return { ...ms, title: message.title };
          });
          return { ...phone_call, messages_sent: messages_sent_with_name };
        }
      );

      await sendPhonecalls(phone_calls_with_message_name, user_id);
      console.log("Phonecalls sent to DeepSiam");
      return phone_calls_array.map((phone_call) => phone_call.id);
    } catch (err) {
      console.error("Error processing phone calls", err);
      throw err; // Rethrow the error to be consistent with how errors are handled in the original code
    }
  });

module.exports = {
  createPhoneCall,
  createPhoneCalls,
};

 */
