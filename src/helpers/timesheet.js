import dayjs from "dayjs";

const _sumOfAllItems = (arr) => arr.reduce((acc, cur) => acc + cur, 0)

export const _getTotalHours = (arr) => arr.reduce((acc, cur) => acc + (cur.standardHours ?? 0) + (cur.OTHours ?? 0), 0)
export const _getOTHours = (arr) => arr.reduce((acc, cur) => acc + (cur.OTHours ?? 0), 0)
export const _getStandardHours = (arr) => arr.reduce((acc, cur) => acc + (cur.standardHours ?? 0), 0)

export function _generateMonthArray(timesheetMonth, timecard) {
    const monthIndex = dayjs(timesheetMonth).month()
    const month = [];
    const firstDay = new Date(new Date().getFullYear(), monthIndex, 1).getDay();
    const daysInMonth = new Date(new Date().getFullYear(), monthIndex + 1, 0).getDate();

    let currentWeek = [];
    let regularHours = [];
    let extraHours = [];
    let totalHours = [];
    for (let i = 0; i < firstDay; i++) {
        currentWeek.push(0);
        regularHours.push(0);
        extraHours.push(0);
        totalHours.push(0);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const hoursWorked = timecard.find((item) => dayjs(item.date).format('YYYY-MM-DD') === dayjs(timesheetMonth).set('date', day).format('YYYY-MM-DD'));
        const stHours = hoursWorked?.standardHours ? hoursWorked.standardHours : 0
        const otHours = hoursWorked?.OTHours ? hoursWorked.OTHours : 0

        currentWeek.push(day);
        regularHours.push(stHours);
        extraHours.push(otHours);
        totalHours.push(stHours + otHours);

        if (currentWeek.length === 7) {
            regularHours.push(_sumOfAllItems(regularHours))
            extraHours.push(_sumOfAllItems(extraHours))
            totalHours.push(_sumOfAllItems(totalHours))
            month.push([currentWeek, regularHours, extraHours, totalHours]);
            currentWeek = [];
            regularHours = [];
            extraHours = [];
            totalHours = [];
        }
    }
    while (currentWeek.length < 7 && currentWeek.length > 0) {
        currentWeek.push(0);
        regularHours.push(0);
        extraHours.push(0);
        totalHours.push(0);
    }

    if (currentWeek.length > 0) {
        regularHours.push(_sumOfAllItems(regularHours))
        extraHours.push(_sumOfAllItems(extraHours))
        totalHours.push(_sumOfAllItems(totalHours))
        month.push([currentWeek, regularHours, extraHours, totalHours]);
    }
    return month;
}
