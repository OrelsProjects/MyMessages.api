import { runRequest } from "../../common/request_wrapper";
import { toDate, now } from "../../common/utils/date";
import { prepareMessagesSent } from "./utils";
import { sendPhonecalls } from "../features/deepsiam";
import { Message } from "@prisma/client";
import prisma from "../prismaClient";
import { ObjectId } from "mongodb";

export const createPhoneCall = async (req, context) =>
  runRequest(req, context, async (req, user_id: string) => {
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

    // Convert to prisma, camelCase, phoneCall table name
    const phone_call_id = await prisma.phoneCall.create({
      data: {
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
      },
    });

    prepareMessagesSent(messages_sent, phone_call_id.id);
    await prisma.messageSent.createMany({
      data: messages_sent.map((message: Message) => ({
        ...message,
        phone_call_id: phone_call_id.id,
      })),
    });

    return phone_call_id;
  });

export const createPhoneCalls = async (req, context) =>
  runRequest(req, context, async (req, user_id: string) => {
    const phone_calls = JSON.parse(req.body);
    if (!Array.isArray(phone_calls))
      throw Error("Not array exception in phoneCalls");

    const phone_calls_array = [];
    let messages_sent_array = [];
    // remove all phone calls with the same start_date
    const phone_calls_filtered = phone_calls.filter(
      (phone_call, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            t.start_date === phone_call.start_date &&
            t.number === phone_call.number
        )
    );

    phone_calls_filtered.forEach((phone_call) => {
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

      const phone_call_id = new ObjectId().toString();
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

    const phone_call_ids = await new Promise(async (resolve, reject) => {
      try {
        await prisma.$transaction(async (prisma) => {
          // Insert phone_calls_array into phone_calls collection
          await prisma.phoneCall.createMany({
            data: phone_calls_array,
          });

          // Filter messages_sent_array based on inserted phone_call_id
          messages_sent_array = messages_sent_array.filter((ms) => {
            return phone_calls_array
              .map((phone_call) => phone_call.id)
              .includes(ms.phone_call_id);
          });

          // Insert messages_sent_array into messages_sent collection
          if (messages_sent_array.length > 0) {
            await prisma.messageSent.createMany({
              data: messages_sent_array,
            });
          }
        });

        // Resolve with phone_call_ids
        const phone_call_ids =
          phone_calls_array.map((phone_call) => phone_call.id) ?? [];
        resolve(phone_call_ids);
      } catch (err) {
        reject(err);
      } finally {
        await prisma.$disconnect();
      }
    });

    try {
      await sendPhonecalls(phone_calls_filtered, user_id);
    } catch (e) {}

    return phone_call_ids;
  });
