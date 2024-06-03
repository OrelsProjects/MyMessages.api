import { PrismaClient } from "@prisma/client";
import { runRequest } from "../common/request_wrapper";
const prisma = new PrismaClient();

export const deleteMessagesFromFolder = async (req, context) =>
  runRequest(req, context, async (req, user_id: string) => {
    const { folder_id } = req.pathParameters;
    return await prisma.messageInFolder.updateMany({
      where: {
        folder_id,
      },
      data: {
        is_active: false,
      },
    });
  });
