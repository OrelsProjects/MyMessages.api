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
      (
        message
      ): Omit<Message, "id" | "old_message_id"> & { folder_id: string } => ({
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
      const messages = await prisma.messageInFolder.findMany({
        where: {
          is_active: true,
          folder: {
            user_id,
            is_active: true,
          },
          message: {
            user_id,
            is_active: true,
          },
        },
        include: {
          message: true,
          folder: true,
        },
      });
      
      const response = messages
        .map((message_in_folder) => {
          const message = message_in_folder.message;
          return {
            messages_in_folder_id: message_in_folder.id,
            folder_id: message_in_folder.folder_id,
            message_id: message_in_folder.message_id,
            title: message.title,
            short_title: message.short_title,
            body: message.body,
            position: message.position,
            times_used: message.times_used,
            is_active: message.is_active,
          };
        })
        .sort((a, b) => b.times_used - a.times_used); // sort by times_used  descending
      
      return response;
    }
  );
