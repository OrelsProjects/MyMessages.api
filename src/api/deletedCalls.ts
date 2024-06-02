import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createDeletedCall = async (req, context) => {
  const { number, deleted_at } = JSON.parse(req.body);
  return await prisma.deletedCall.create({
    data: {
      user_id: req.user_id,
      deleted_at: new Date(deleted_at).toISOString(),
      number,
    },
  });
};

export const getDeletedCallsByDate = async (req, context) => {
  const { from_date } = req.pathParameters;
  return await prisma.deletedCall.findMany({
    where: {
      user_id: req.user_id,
      deleted_at: {
        gt: new Date(from_date).toISOString(),
      },
    },
  });
};
