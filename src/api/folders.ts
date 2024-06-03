import { PrismaClient } from "@prisma/client";
import { runRequest } from "../common/request_wrapper";
const prisma = new PrismaClient();

export const createFolder = async (req, context) =>
  runRequest(req, context, async (req, user_id: string) => {
    const { title, position } = JSON.parse(req.body);
    const result = await prisma.folder.create({
      data: {
        title,
        position: position || 0,
        times_used: 0,
        user_id,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    });
    return result.id;
  });

export const updateFolder = async (req, context) =>
  runRequest(req, context, async (req, user_id: string) => {
    const { id, title, position, is_active, times_used } = JSON.parse(req.body);
    await prisma.folder.update({
      where: { id },
      data: {
        title,
        position: position || 0,
        is_active,
        times_used,
      },
    });
  });

export const deleteFolder = async (req, context) =>
  runRequest(req, context, async (req, user_id: string) => {
    const { id } = req.pathParameters;
    console.log("id", id);
    await prisma.folder.update({
      where: { id },
      data: {
        is_active: false,
      },
    });
  });

export const getFolders = async (req, context) =>
  runRequest(req, context, async (req, user_id: string) => {
    return await prisma.folder.findMany({
      where: {
        user_id,
        is_active: true,
      },
    });
  });

export const getDeletedFolders = async (req, context) =>
  runRequest(req, context, async (req, user_id: string) => {
    return await prisma.folder.findMany({
      where: {
        user_id,
        is_active: false,
      },
    });
  });
