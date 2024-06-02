import { runRequest } from "../common/request_wrapper";
import prisma from "./prismaClient";

export const getUser = async (req, context) =>
  runRequest(req, context, async (_, user_id) => {
    const result = await prisma.appUser.findUnique({
      where: { id: user_id, is_active: true },
    });
    return result;
  });
export const createUser = async (req, context) =>
  runRequest(req, context, async (req, user_id) => {
    const { first_name, last_name, gender, email, number } = JSON.parse(
      req.body
    );

    const result = await prisma.appUser.create({
      data: {
        user_id,
        first_name,
        last_name,
        gender,
        email,
        number,
        is_active: true,
        created_at: new Date().toUTCString(),
      },
    });

    return result.id;
  });
