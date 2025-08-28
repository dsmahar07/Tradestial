// Debug script to test current data parsing
const { parseLocalDate, getDayOfWeek } = require('./src/utils/date-utils.ts');

// Test the date that's causing issues
const testDates = [
  '2025-08-22', // Friday from your CSV
  '2024-08-23', // Friday
  '2024-08-24', // Saturday  
  '2024-08-25'  // Sunday
];

console.log('Testing date parsing:');
testDates.forEach(dateStr => {
  // Test JavaScript Date constructor
  const jsDate = new Date(dateStr);
  const jsDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][jsDate.getDay()];
  
  // Test with manual parsing (what our utility does)
  const [year, month, day] = dateStr.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  const localDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][localDate.getDay()];
  
  console.log(`\n${dateStr}:`);
  console.log(`  JS Date(): ${jsDate.toDateString()} -> ${jsDayName}`);
  console.log(`  Local parsing: ${localDate.toDateString()} -> ${localDayName}`);
  console.log(`  Timezone offset: ${new Date().getTimezoneOffset()} minutes`);
});

// Test with different timezone scenarios
console.log('\n\nTesting timezone scenarios for 2025-08-22:');
const baseDate = '2025-08-22';

// Simulate different timezone offsets
const timezones = [
  { name: 'UTC', offset: 0 },
  { name: 'IST (India)', offset: 330 },
  { name: 'EST (US East)', offset: -300 },
  { name: 'PST (US West)', offset: -480 }
];

timezones.forEach(tz => {
  const [year, month, day] = baseDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  // Apply timezone offset
  const currentOffset = -new Date().getTimezoneOffset();
  const offsetDiff = tz.offset - currentOffset;
  date.setMinutes(date.getMinutes() + offsetDiff);
  
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  console.log(`  ${tz.name}: ${date.toDateString()} -> ${dayName}`);
});