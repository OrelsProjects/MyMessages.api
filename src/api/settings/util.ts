import { now } from "../../common/utils/date";

export const prepareSettingsList = (settings_list, user_id) => {
  if (!Array.isArray(settings_list)) throw Error("Settings must be an array");
  settings_list.forEach((settings) => {
    settings.modified_at = now();
    settings.user_id = user_id;
    settings.enabled = settings.enabled ? true : false;
  });
};
