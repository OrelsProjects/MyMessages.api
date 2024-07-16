import {
  Message,
  PhoneCall,
  Settings,
  AppUser,
  Folder,
  DeletedCall,
  MessageSent,
  MessageInFolder,
} from "@prisma/client";
import * as data from "../../../export";
import { runRequest } from "../../common/request_wrapper";
import prisma from "../prismaClient";

const insertMessages = async () => {
  await prisma.message.deleteMany();
  const messages = data.messages as any as Message[];
  //Remove messages with user_id = "70d083fa-5ee3-416e-bf5e-8c6b0983edda";
  const allMessages = messages.filter(
    (message) => message.user_id !== "70d083fa-5ee3-416e-bf5e-8c6b0983edda"
  );

  await prisma.message.createMany({
    data: allMessages,
  });
};

const preparePhoneCalls = (data: PhoneCall[]): PhoneCall[] => {
  const phoneCallsNoId = data.map((phoneCall) => {
    phoneCall.created_at = phoneCall.created_at
      ? new Date(phoneCall.created_at)
      : new Date();
    phoneCall.start_date = phoneCall.start_date
      ? new Date(phoneCall.start_date)
      : null;
    phoneCall.end_date = phoneCall.end_date
      ? new Date(phoneCall.end_date)
      : null;
    phoneCall.actual_end_date = phoneCall.actual_end_date
      ? new Date(phoneCall.actual_end_date)
      : null;
    return phoneCall;
  });
  return phoneCallsNoId;
};

const insertPhoneCalls = async () => {
  const phoneCalls = data.phoneCalls as any as PhoneCall[];
  const preparedPhoneCalls = preparePhoneCalls(phoneCalls);

  try {
    await prisma.phoneCall.createMany({
      data: preparedPhoneCalls,
    });
  } catch (e) {
    console.log(e);
  }
};

const prepareSettings = (data: Settings[]): Omit<Settings, "id">[] => {
  const settingsNoId = data.map((setting) => {
    setting.modified_at = setting.modified_at
      ? new Date(setting.modified_at)
      : new Date();

    return setting;
  });
  return settingsNoId;
};

const insertSettings = async () => {
  const settings = data.settings as any as Settings[];
  const preparedSettings = prepareSettings(settings);
  try {
    await prisma.settings.createMany({
      data: preparedSettings,
    });
  } catch (e) {
    console.log(e);
  }
};

const insertFolders = async () => {
  const folders = data.folders as any as Folder[];
  const filteredFolders = folders.filter(
    (folder) => folder.user_id !== "70d083fa-5ee3-416e-bf5e-8c6b0983edda"
  );
  await prisma.folder.deleteMany();
  try {
    await prisma.folder.createMany({
      data: filteredFolders,
    });
  } catch (e) {
    console.log(e);
  }
};

const prepareDeletedCalls = (data: DeletedCall[]): DeletedCall[] => {
  const deletedCallsNoId = data.map((deletedCall) => {
    deletedCall.deleted_at = deletedCall.deleted_at
      ? new Date(deletedCall.deleted_at)
      : new Date();
    return deletedCall;
  });
  return deletedCallsNoId;
};

const insertDeletedCalls = async () => {
  const deletedCalls = data.deletedCalls as any as DeletedCall[];
  const preparedDeletedCalls = prepareDeletedCalls(deletedCalls);
  try {
    await prisma.deletedCall.createMany({
      data: preparedDeletedCalls,
    });
  } catch (e) {
    console.log(e);
  }
};

const insertAppUsers = async () => {
  const appUsers = data.users as any as AppUser[];
  
  await prisma.appUser.createMany({
    data: appUsers,
  });
};

const insertMessagesInFolders = async () => {
  const messagesInFolders = data.messagesInFolder as any as MessageInFolder[];
  const allMessagesInFolders = messagesInFolders.map((messageInFolder) => {
    const newDate = new Date(messageInFolder.created_at);
    return {
      ...messageInFolder,
      created_at: newDate,
    };
  });

  const messages = await prisma.message.findMany();
  const messagesInFoldersThatHaveMessageId = allMessagesInFolders.filter(
    (messageInFolder) =>
      messages.find((message) => message.id === messageInFolder.message_id)
  );
  let id = "";
  let i = 0;
  await prisma.messageInFolder.deleteMany();
  for (const messageInFolder of messagesInFoldersThatHaveMessageId) {
    try {
      id = messageInFolder.id;
      console.log(i++ + "/" + messagesInFoldersThatHaveMessageId.length);
      await prisma.messageInFolder.create({
        data: messageInFolder,
      });
    } catch (e) {
      console.log(id);
    }
  }
};

const prepareMessagesSent = (data: MessageSent[]): MessageSent[] => {
  const messagesSentNoId = data.map((messageSent) => {
    messageSent.created_at = messageSent.created_at
      ? new Date(messageSent.created_at)
      : new Date();
    messageSent.sent_at = messageSent.sent_at
      ? new Date(messageSent.sent_at)
      : null;
    return messageSent;
  });
  return messagesSentNoId;
};

const insertMessagesSent = async () => {
  const messagesSent = data.messagesSent as any as MessageSent[];
  const preparedMessagesSent = prepareMessagesSent(messagesSent);
  const messages = await prisma.message.findMany();
  const messagesSentThatHaveMessageId = preparedMessagesSent.filter(
    (messageSent) =>
      messages.find((message) => message.id === messageSent.message_id)
  );
  const phoneCalls = await prisma.phoneCall.findMany();
  const phoneCallIdToPhoneCall = phoneCalls.reduce((acc, phoneCall) => {
    acc[phoneCall.id] = phoneCall;
    return acc;
  });
  const messagesSentThatHavePhoneCallId = messagesSentThatHaveMessageId.filter(
    (messageSent) => {
      const phoneCall = phoneCallIdToPhoneCall[messageSent.phone_call_id];
      return phoneCall !== undefined;
    }
  );
  
  await prisma.messageSent.createMany({
    data: messagesSentThatHavePhoneCallId,
    skipDuplicates: true,
  });
};

const readData = async (req, context) => {
  try {
    // await insertAppUsers();
    // await insertMessages();
    // await insertFolders();
    // await insertMessagesInFolders();
    // await insertSettings();
    // await insertPhoneCalls();
    // await insertDeletedCalls();
    await insertMessagesSent();

    return "Data migrated successfully";
  } catch (e) {
    console.log(e);
    return "Data migration failed";
  }
};

export const handler = async (event, context) => {
  return await runRequest(event, context, readData, false);
};
