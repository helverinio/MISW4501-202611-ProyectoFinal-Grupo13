// Get tomorrow's day number
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const tomorrowDay = tomorrow.getDate();

output.tomorrowDay = String(tomorrowDay);
