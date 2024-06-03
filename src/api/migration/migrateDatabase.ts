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
import fs from "fs";
import { ObjectId } from "mongodb";
import * as data from "../../../export";
import { runRequest } from "../../common/request_wrapper";
import prisma from "../prismaClient";

const prepareMessages = (data: Message[]): Message[] => {
  const oldIdToNewIdMap = new Map<string, string>();
  const messagesNoId = data.map((message) => {
    message.created_at = message.created_at
      ? new Date(message.created_at)
      : new Date();
    const newId = new ObjectId();
    if (message.is_active) {
      oldIdToNewIdMap.set(message.id, newId.toHexString());
    }
    const { id, ...rest } = message;
    return {
      ...rest,
      id: newId.toHexString(),
    };
  });
  fs.writeFileSync(
    "./oldIdToNewIdMap_messages.json",
    JSON.stringify([...oldIdToNewIdMap])
  );
  return messagesNoId.filter((it) => it.is_active);
};

const insertMessages = async () => {
  const messages = data.messages as any as Message[];
  try {
    await prisma.message.createMany({
      data: prepareMessages(messages),
    });
  } catch (e) {
    console.log(e);
  }
};

const preparePhoneCalls = (data: PhoneCall[]): PhoneCall[] => {
  const oldIdToNewIdMap = new Map<string, string>();
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

    const { id, ...rest } = phoneCall;
    const newId = new ObjectId();
    oldIdToNewIdMap.set(id, newId.toHexString());
    return {
      ...rest,
      id: newId.toHexString(),
    };
  });

  fs.writeFileSync(
    "./oldIdToNewIdMap_phonecalls.json",
    JSON.stringify([...oldIdToNewIdMap])
  );
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
    const { id, ...rest } = setting;
    return rest;
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

const prepareFolders = (data: Folder[]): Folder[] => {
  const oldIdToNewIdMap = new Map<string, string>();
  const foldersNoId = data.map((folder) => {
    folder.created_at = folder.created_at
      ? new Date(folder.created_at)
      : new Date();

    const newId = new ObjectId();
    if (folder.is_active) {
      oldIdToNewIdMap.set(folder.id, newId.toHexString());
    }

    const { id, ...rest } = folder;
    return {
      ...rest,
      id: newId.toHexString(),
    };
  });

  fs.writeFileSync(
    "./oldIdToNewIdMap_folders.json",
    JSON.stringify([...oldIdToNewIdMap])
  );
  return foldersNoId.filter((it) => it.is_active);
};

const insertFolders = async () => {
  const folders = data.folders as any as Folder[];
  const preparedFolders = prepareFolders(folders);
  try {
    await prisma.folder.createMany({
      data: preparedFolders,
    });
  } catch (e) {
    console.log(e);
  }
};

const prepareDeletedCalls = (
  data: DeletedCall[]
): Omit<DeletedCall, "id">[] => {
  const deletedCallsNoId = data.map((deletedCall) => {
    deletedCall.deleted_at = deletedCall.deleted_at
      ? new Date(deletedCall.deleted_at)
      : new Date();
    const { id, ...rest } = deletedCall;
    return rest;
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

const prepareAppUsers = (data: AppUser[]): Omit<AppUser, "id">[] => {
  const appUsersNoId = data.map((appUser) => {
    appUser.created_at = appUser.created_at
      ? new Date(appUser.created_at)
      : new Date();
    const { id, ...rest } = appUser;
    return {
      ...rest,
      user_id: id,
    };
  });
  return appUsersNoId;
};

const insertAppUsers = async () => {
  const appUsers = data.users as any as AppUser[];
  const preparedAppUsers = prepareAppUsers(appUsers);
  try {
    await prisma.appUser.createMany({
      data: preparedAppUsers,
    });
  } catch (e) {
    console.log(e);
  }
};

const prepareMessagesInFolders = (
  data: MessageInFolder[]
): Omit<MessageInFolder, "id">[] => {
  const oldMessages = fs.readFileSync(
    "./oldIdToNewIdMap_messages.json",
    "utf8"
  );
  const oldFolders = fs.readFileSync("./oldIdToNewIdMap_folders.json", "utf8");
  const oldMessagesMap = new Map(JSON.parse(oldMessages));
  const oldFoldersMap = new Map(JSON.parse(oldFolders)) as Map<string, string>;

  const messagesInFoldersNoId = data.map((messageInFolder) => {
    const new_created_at = messageInFolder.created_at
      ? new Date(messageInFolder.created_at)
      : new Date();
    const { id, ...rest } = messageInFolder;

    const newObject = {
      ...rest,
      created_at: new_created_at,
      message_id: oldMessagesMap.get(messageInFolder.message_id) as string,
      folder_id: oldFoldersMap.get(messageInFolder.folder_id) as string,
    };
    return newObject;
  });

  return messagesInFoldersNoId.filter((it) => it.folder_id && it.message_id);
};

const insertMessagesInFolders = async () => {
  const messagesInFolders = data.messagesInFolder as any as MessageInFolder[];
  const preparedMessagesInFolders = prepareMessagesInFolders(messagesInFolders);

  try {
    await prisma.messageInFolder.createMany({
      data: preparedMessagesInFolders,
    });
  } catch (e) {
    console.log(e);
  }
};

const prepareMessagesSent = (
  data: MessageSent[]
): Omit<MessageSent, "id">[] => {
  const oldMessages = fs.readFileSync(
    "./oldIdToNewIdMap_messages.json",
    "utf8"
  );
  const oldPhonecalls = fs.readFileSync(
    "./oldIdToNewIdMap_phonecalls.json",
    "utf8"
  );
  const oldMessagesMap = new Map(JSON.parse(oldMessages));
  const oldPhonecallsMap = new Map(JSON.parse(oldPhonecalls));

  const messagesSentNoId = data.map((messageSent) => {
    messageSent.created_at = messageSent.created_at
      ? new Date(messageSent.created_at)
      : new Date();
    messageSent.sent_at = messageSent.sent_at
      ? new Date(messageSent.sent_at)
      : null;
    const { id, ...rest } = messageSent;
    return {
      ...rest,
      id: new ObjectId().toHexString(),
      message_id: oldMessagesMap.get(messageSent.message_id) as string,
      phone_call_id: oldPhonecallsMap.get(messageSent.phone_call_id) as string,
    };
  });
  return messagesSentNoId.filter((it) => it.message_id && it.phone_call_id);
};

const insertMessagesSent = async () => {
  const messagesSent = data.messagesSent as any as MessageSent[];
  const preparedMessagesSent = prepareMessagesSent(messagesSent);
  debugger;
  await prisma.messageSent.createMany({
    data: preparedMessagesSent,
  });
};

const readData = async (req, context) => {
  try {
    await insertMessages();
    await insertFolders();
    await insertPhoneCalls();
    await insertAppUsers();
    await insertSettings();
    await insertDeletedCalls();
    await insertMessagesInFolders();
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
