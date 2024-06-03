import { formatToExtendedISO8601 } from "./utils";
import prisma from "../prismaClient";
import axios from "axios";
import qs from "qs";

export const izik_user_id = "aec62020-877f-4f18-b9c2-3d767791d46b";

export async function sendPhonecalls(phone_calls, user_id) {
  if (user_id !== izik_user_id) {
    console.log("User not authorized to send phonecalls to DeepSiam");
    return;
  }
  const messagesMap = await phoneCallsToMessagesMap(phone_calls);
  for (const value of messagesMap) {
    try {
      const { phone_number, message_title, start_date } = value;
      if (!phone_number || !message_title || !start_date) {
        console.log("Phonecall has no messages sent, skipping");
        continue;
      }
      const date = new Date(start_date);
      const formattedDate = formatToExtendedISO8601(date);
      let data = qs.stringify({
        call_datetime: formattedDate,
        product_interest: message_title ?? "unknown",
        campaign_tag: "campaign_mobile_calls_app",
        phone_number: phone_number,
      });

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${process.env.FEATURE_DEEPSIAM_BASE_URL}/register-call`,
        headers: {
          Token: process.env.FEATURE_DEEPSIAM_API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: data,
      };
      console.log("Sending phonecall to DeepSiam", {
        ...config,
        messageSent: JSON.stringify(message_title),
      });
      await axios.request(config);
    } catch (error) {
      console.error("Error sending phonecall to DeepSiam", error);
    }
  }
}

async function phoneCallsToMessagesMap(phone_calls) {
  const map = [];
  for (const call of phone_calls) {
    try {
      const { number, messages_sent } = call;
      if (!messages_sent || messages_sent.length === 0) {
        console.log("Phonecall has no messages sent, skipping");
        continue;
      }
      const first_message_id = messages_sent[0].message_id;

      const result = await prisma.message.findMany({
        where: {
          id: first_message_id,
          user_id: izik_user_id,
        },
      });
      const message = result[0];
      if (!message) {
        console.log("Message not found for message_id", first_message_id);
        continue;
      }
      map.push({
        phone_number: number,
        message_title: message.title,
        start_date: call.start_date,
      });
    } catch (error) {
      console.error("Error processing phonecall to message map", error);
    }
  }
  return map;
}
