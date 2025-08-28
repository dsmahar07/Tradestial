// Simple debug script to test date parsing
console.log('Date Parsing Debug:');

// Test different ways to parse "2024-08-23"
const dateString = '2024-08-23';

console.log('\n1. Using new Date() constructor:');
const jsDate = new Date(dateString);
console.log(`   Date object: ${jsDate}`);
console.log(`   getDay(): ${jsDate.getDay()} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][jsDate.getDay()]})`);
console.log(`   UTC vs Local difference: ${jsDate.getTimezoneOffset()} minutes`);

console.log('\n2. Using Date constructor with local components:');
const [year, month, day] = dateString.split('-').map(Number);
const localDate = new Date(year, month - 1, day); // month is 0-indexed
console.log(`   Date object: ${localDate}`);
console.log(`   getDay(): ${localDate.getDay()} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][localDate.getDay()]})`);

console.log('\n3. Using parseLocalDate utility:');
function parseLocalDate(dateString) {
  if (dateString instanceof Date) {
    return dateString;
  }
  
  if (!dateString) {
    return new Date();
  }

  // Handle YYYY-MM-DD format directly to avoid timezone shift
  const isoMatch = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1]);
    const month = parseInt(isoMatch[2]) - 1; // Month is 0-indexed
    const day = parseInt(isoMatch[3]);
    return new Date(year, month, day);
  }

  return new Date(dateString);
}

const utilDate = parseLocalDate(dateString);
console.log(`   Date object: ${utilDate}`);
console.log(`   getDay(): ${utilDate.getDay()} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][utilDate.getDay()]})`);

console.log('\n4. Checking your system timezone:');
console.log(`   Timezone offset: ${new Date().getTimezoneOffset()} minutes`);
console.log(`   Timezone name: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);