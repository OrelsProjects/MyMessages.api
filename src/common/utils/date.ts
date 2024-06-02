export const toDate = (epochTime: string | number) => {
  let timeIntSeconds: number = 0;
  if (typeof epochTime === "string") {
    timeIntSeconds =
      epochTime.length > 10
        ? parseInt(epochTime.substring(0, epochTime.length - 3))
        : parseInt(epochTime);
  } else if (typeof epochTime === "number") {
    timeIntSeconds = epochTime;
    if (`${timeIntSeconds}`.length > 10) {
      timeIntSeconds /= 1000;
    }
  } else {
    return null;
  }
  return new Date(timeIntSeconds * 1000).toISOString();
};

export const now = () => toDate(new Date().getTime());

export const startOfDayDate = () => {
  let date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return toDate(date.getTime());
};
