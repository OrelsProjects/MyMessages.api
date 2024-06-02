import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const updateSettings = async (req, _) => {
  let settings_list = JSON.parse(req.body);
  if (!Array.isArray(settings_list)) {
    settings_list = [settings_list];
  }
  settings_list.forEach(async (setting) => {
    await prisma.settings.upsert({
      where: {
        key_user_id: { key: setting.key, user_id: setting.user_id },
      },
      update: {
        value: setting.value,
        modified_at: new Date().toISOString(),
      },
      create: {
        key: setting.key,
        value: setting.value,
        user_id: setting.user_id,
        modified_at: new Date().toISOString(),
        enabled: true,
      },
    });
  });
};

export const getSettings = async (req, context) => {
  let key = null;
  if (req.pathParameters) {
    key = req.pathParameters.key;
  }
  if (key) {
    return await prisma.settings.findMany({
      where: {
        user_id: req.user_id,
        key: key,
      },
    });
  } else {
    return await prisma.settings.findMany({
      where: {
        user_id: req.user_id,
      },
    });
  }
};
