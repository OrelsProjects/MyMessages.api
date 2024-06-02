import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createFolder = async (req, context) => {
  const { title, position } = JSON.parse(req.body);
  return await prisma.folder.create({
    data: {
      title,
      position: position || 0,
      times_used: 0,
      user_id: req.user_id,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  });
};

export const updateFolder = async (req, context) => {
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
};

export const deleteFolder = async (req, context) => {
  const { id } = req.pathParameters;
  await prisma.folder.update({
    where: { id },
    data: {
      is_active: false,
    },
  });
};

export const getFolders = async (req, context) => {
  return await prisma.folder.findMany({
    where: {
      user_id: req.user_id,
      is_active: true,
    },
  });
};

export const getDeletedFolders = async (req, context) => {
  return await prisma.folder.findMany({
    where: {
      user_id: req.user_id,
      is_active: false,
    },
  });
};
