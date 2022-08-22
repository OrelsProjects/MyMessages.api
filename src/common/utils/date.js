const toDate = (epochTime) => {
    let timeIntSeconds = epochTime;
    if (typeof epochTime === "string") {
        timeIntSeconds = epochTime.length > 10 ? parseInt(epochTime.substring(0, epochTime.length - 3))
            : parseInt(epochTime);
    } else if (typeof epochTime === 'number') {
        if (`${timeIntSeconds}`.length > 10) {
            timeIntSeconds /= 1000;
        }
    } else {
        throw Error(`Date not valid in toDate: ${epochTime}`);
    }
    return new Date(timeIntSeconds * 1000).toISOString();
}

const now = () => toDate((new Date()).getTime());

const startOfDayDate = () => {
    let date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    return toDate(date.getTime())
}

module.exports = {
    toDate,
    now,
    startOfDayDate
}