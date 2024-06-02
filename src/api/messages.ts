import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createMessage = async (req, context) => {
  let { messages } = JSON.parse(req.body);
  if (!Array.isArray(messages)) {
    messages = [messages];
  }
  const messagesData = messages.map((message) => ({
    title: message.title,
    shortTitle: message.short_title,
    body: message.body,
    position: message.position || 0,
    timesUsed: message.times_used || 0,
    userId: req.user_id,
    isActive: true,
    createdAt: new Date().toISOString(),
  }));

  return await prisma.message.createMany({
    data: messagesData,
  });
};

export const updateMessage = async (req, context) => {
  const { id, title, short_title, body, position, times_used, is_active } =
    JSON.parse(req.body);
  return await prisma.message.update({
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
};

export const getMessages = async (req, context) => {
  return await prisma.message.findMany({
    where: {
      user_id: req.user_id,
    },
    include: {
      messages_in_folders: true,
    },
  });
};
