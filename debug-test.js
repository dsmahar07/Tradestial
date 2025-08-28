// Simple debug test script
// You can run this in the browser console to test the system

console.log('🔍 Testing Tradestial System...')

// Test 1: Check DataStore
if (typeof window !== 'undefined' && window.testTradovateImport) {
  console.log('✅ Test import function is available')
  
  // You can run this manually:
  // window.testTradovateImport().then(result => console.log('Import result:', result))
} else {
  console.log('❌ Test import function not available')
}

// Test 2: Check if we can access DataStore (this requires being on the site)
console.log('To test the system:')
console.log('1. Navigate to http://localhost:3001/test-import')
console.log('2. Click "Test Tradovate Import"')
console.log('3. Check the console logs')
console.log('4. Check dashboard at http://localhost:3001/dashboard')

// This will be available in browser console when on the site
if (typeof window !== 'undefined') {
  window.debugTradestial = function() {
    console.log('🚀 Running Tradestial Debug...')
    
    if (window.testTradovateImport) {
      return window.testTradovateImport().then(result => {
        console.log('📊 Import Result:', result)
        return result
      })
    } else {
      console.log('❌ Test function not available on this page')
      console.log('Go to /test-import page first')
    }
  }
}