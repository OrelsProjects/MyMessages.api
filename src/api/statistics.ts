import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getCallsCountByDay = async (req, context) => {
  let start_date = req.queryStringParameters?.start_date;
  let end_date = req.queryStringParameters?.end_date;

  const whereConditions = {};

  if (start_date) {
    whereConditions["start_date"] = {
      gte: new Date(start_date).toISOString(), // Ensure dates are in ISO string format
    };
  }
  if (end_date) {
    whereConditions["start_date"] = {
      ...whereConditions["start_date"],
      lte: new Date(end_date).toISOString(), // Ensure dates are in ISO string format
    };
  }

  return await prisma.phoneCall.groupBy({
    by: ["start_date", "type"],
    where: {
      user_id: req.user_id,
      ...whereConditions,
    },
    _count: true,
  });
};
