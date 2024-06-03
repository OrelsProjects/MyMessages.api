import { PrismaClient } from "@prisma/client";
import { runRequest } from "../common/request_wrapper";
import { toDate } from "../common/utils/date";
const prisma = new PrismaClient();

export const createDeletedCall = async (req, context) =>
  runRequest(req, context, async (req, user_id: string) => {
    const { number, deleted_at } = JSON.parse(req.body);
    return await prisma.deletedCall.create({
      data: {
        user_id,
        deleted_at: new Date(deleted_at).toISOString(),
        number,
      },
    });
  });

export const getDeletedCallsByDate = async (req, context) =>
  runRequest(req, context, async (req, user_id: string) => {
    const { from_date } = req.pathParameters;
    const from_date_safe = toDate(from_date);
    return await prisma.deletedCall.findMany({
      where: {
        user_id,
        deleted_at: {
          gt: new Date(from_date_safe).toISOString(),
        },
      },
    });
  });
