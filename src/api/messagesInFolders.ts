import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const deleteMessagesFromFolder = async (req, context) => {
  const { folder_id } = JSON.parse(req.body);
  return await prisma.messageInFolder.updateMany({
    where: {
      folder_id,
    },
    data: {
      is_active: false,
    },
  });
};
