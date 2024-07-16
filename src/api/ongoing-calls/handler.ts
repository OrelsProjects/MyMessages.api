import { runRequest } from "../../common/request_wrapper";
import { toDate } from "../../common/utils/date";
import prisma from "../prismaClient";

export const createOngoingCall = async (req, context) =>
  runRequest(req, context, async (req, user_id: string) => {
    const { number, contact_name, start_date } = JSON.parse(req.body);

    await prisma.ongoingCall.create({
      data: {
        number,
        contact_name,
        created_at: toDate(start_date),
        user_id,
      },
    });
  });

const MAX_TIME_DIFF = 10000;
export const getLatestOngoingCall = async (req, context) =>
  runRequest(req, context, async (req, user_id: string) => {
    const ongoingCall = await prisma.ongoingCall.findFirst({
      where: {
        user_id,
      },
      select: {
        number: true,
        contact_name: true,
        created_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const latestPhoneCall = await prisma.phoneCall.findFirst({
      where: {
        user_id,
        number: ongoingCall?.number,
        end_date: {
          not: null,
        },
      },
      select: {
        start_date: true,
        number: true,
      },
      orderBy: {
        start_date: "desc",
      },
    });

    if (!latestPhoneCall) {
      return ongoingCall;
    }

    const diff =
      new Date(latestPhoneCall.start_date).getTime() -
      new Date(ongoingCall.created_at).getTime();

    if (diff > MAX_TIME_DIFF) {
      // If the difference is greater than 10 seconds, return the ongoing call.
      return { ongoingCall, diff };
    }
    return { diff };
  });
