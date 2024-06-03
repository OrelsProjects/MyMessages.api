import { Message, PrismaClient } from "@prisma/client";
import { runRequest } from "../common/request_wrapper";
const prisma = new PrismaClient();

type GetMessagesResponse = {
  messages_in_folder_id: string;
  folder_id: string;
  message_id: string;
  title: string;
  short_title: string;
  body: string;
  position: number;
  times_used: number;
  is_active: boolean;
}[];

export const createMessage = async (req, context) =>
  runRequest(req, context, async (req, user_id: string) => {
    let messages = JSON.parse(req.body);
    if (!Array.isArray(messages)) {
      messages = [messages];
    }

    const messagesData: (Message & { folder_id: string })[] = messages.map(
      (message): Omit<Message, "id"> & { folder_id: string } => ({
        title: message.title,
        short_title: message.short_title,
        body: message.body,
        position: message.position || 0,
        times_used: message.times_used || 0,
        user_id,
        folder_id: message.folder_id,
        is_active: true,
        created_at: new Date(),
      })
    );

    const ids: string[] = [];
    // create one by one and return the ids
    for (const messageData of messagesData) {
      const { folder_id, ...data } = messageData;
      const result = await prisma.message.create({
        data,
      });
      await prisma.messageInFolder.create({
        data: {
          message_id: result.id,
          folder_id: folder_id,
        },
      });
      ids.push(result.id);
    }

    return ids;
  });

export const updateMessage = async (req, context) =>
  runRequest(req, context, async (req, user_id: string) => {
    const { id, title, short_title, body, position, times_used, is_active } =
      JSON.parse(req.body);
    await prisma.message.update({
      where: { id },
      data: {
        title,
        short_title,
        body,
        position,
        times_used,
        is_active,
      },
    });
  });

export const getMessages = async (req, context) =>
  runRequest(
    req,
    context,
    async (req, user_id: string): Promise<GetMessagesResponse> => {
      console.log("test");
      const messages = await prisma.message.findMany({
        where: {
          user_id,
        },
        include: {
          messages_in_folders: true,
        },
      });
      const messagesInFolders = await prisma.messageInFolder.findMany({
        where: {
          message_id: {
            in: messages.map((message) => message.id),
          },
        },
      });
      const response: GetMessagesResponse = messages
        .filter((message) => {
          const messageInFolder = messagesInFolders.find(
            (messageInFolder) => messageInFolder.message_id === message.id
          );
          return !!messageInFolder;
        })
        .map((message) => {
          const messageInFolder = messagesInFolders.find(
            (messageInFolder) => messageInFolder.message_id === message.id
          );
          return {
            messages_in_folder_id: messageInFolder.id,
            folder_id: messageInFolder.folder_id,
            message_id: message.id,
            title: message.title,
            short_title: message.short_title,
            body: message.body,
            position: message.position,
            times_used: message.times_used,
            is_active: message.is_active,
          };
        });
      return response;
    }
  );
