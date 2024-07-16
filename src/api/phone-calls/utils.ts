import { v4 } from "uuid";
import { now, toDate } from "../../common/utils/date";

export const prepareMessagesSent = (messages_sent, phone_call_id) => {
  if (messages_sent == undefined || !Array.isArray(messages_sent)) {
    messages_sent = [];
  } else {
    messages_sent.map((value) => {
      value["id"] = v4();
      value["is_active"] = true;
      value["phone_call_id"] = phone_call_id;
      value["sent_at"] = toDate(value["sent_at"]);
      value["created_at"] = now();
    });
  }
};
