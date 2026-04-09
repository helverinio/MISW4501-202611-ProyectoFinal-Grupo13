// Get day after tomorrow's day number
const today = new Date();
const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(today.getDate() + 2);
const dayAfterTomorrowDay = dayAfterTomorrow.getDate();

output.dayAfterTomorrowDay = String(dayAfterTomorrowDay);
