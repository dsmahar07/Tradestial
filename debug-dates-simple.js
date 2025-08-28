// Simple debug script to test date parsing
console.log('Testing date parsing scenarios:');

// Your CSV shows "2025-08-22" 
const testDate = '2025-08-22';

console.log(`\nTesting date: ${testDate}`);

// Method 1: JavaScript Date constructor (problematic)
const jsDate = new Date(testDate);
console.log(`1. new Date("${testDate}"):`);
console.log(`   Result: ${jsDate.toDateString()}`);
console.log(`   Day of week: ${jsDate.getDay()} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][jsDate.getDay()]})`);

// Method 2: Local parsing (safe)
const [year, month, day] = testDate.split('-').map(Number);
const localDate = new Date(year, month - 1, day);
console.log(`\n2. new Date(${year}, ${month-1}, ${day}):`);
console.log(`   Result: ${localDate.toDateString()}`);
console.log(`   Day of week: ${localDate.getDay()} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][localDate.getDay()]})`);

// System info
console.log(`\nSystem timezone info:`);
console.log(`   Timezone offset: ${new Date().getTimezoneOffset()} minutes`);
console.log(`   Timezone name: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

// Test what happens with different times of day
console.log(`\nTesting different times for ${testDate}:`);
const times = ['00:00:00', '12:00:00', '23:59:59'];
times.forEach(time => {
  const dateTime = new Date(`${testDate}T${time}`);
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateTime.getDay()];
  console.log(`   ${testDate}T${time}: ${dateTime.toDateString()} -> ${dayName}`);
});

// Test timezone simulation
console.log(`\nSimulating timezone corrections:`);
const timezoneTests = [
  { name: 'UTC+0', offset: 0 },
  { name: 'IST+5:30', offset: 330 },
  { name: 'EST-5', offset: -300 },
  { name: 'PST-8', offset: -480 }
];

timezoneTests.forEach(tz => {
  const baseDate = new Date(year, month - 1, day);
  const currentOffset = -new Date().getTimezoneOffset();
  const offsetDiff = tz.offset - currentOffset;
  const adjustedDate = new Date(baseDate.getTime() + (offsetDiff * 60000));
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][adjustedDate.getDay()];
  console.log(`   ${tz.name}: ${adjustedDate.toDateString()} -> ${dayName}`);
});