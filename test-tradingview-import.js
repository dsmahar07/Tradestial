/**



 * Test script to verify TradingView CSV import functionality
 */

const fs = require('fs');
const path = require('path');

// Mock File API for Node.js testing
class MockFile {
  constructor(content, name, type = 'text/csv') {
    this.content = content;
    this.name = name;
    this.type = type;
    this.size = content.length;
  }

  async text() {
    return this.content;
  }
}

// Test the TradingView CSV import
async function testTradingViewImport() {
  try {
    // Read the example TradingView CSV
    const csvPath = path.join(__dirname, 'Example CSV', 'Tradingview.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Create mock file
    const mockFile = new MockFile(csvContent, 'Tradingview.csv');
    
    console.log('Testing TradingView CSV Import...');
    console.log('CSV Content Preview:');
    console.log(csvContent.split('\n').slice(0, 3).join('\n'));
    console.log('...\n');
    
    // Import the CSV import service (this would need to be adapted for Node.js)
    // For now, let's just test the detection logic
    const firstLine = csvContent.split('\n')[0].toLowerCase();
    
    console.log('Header line:', firstLine);
    
    // Test broker detection logic
    const isTradingView = (
      firstLine.includes('time') &&
      firstLine.includes('balance before') &&
      firstLine.includes('balance after') &&
      firstLine.includes('realized p&l (value)') &&
      firstLine.includes('action')
    );
    
    console.log('TradingView detection result:', isTradingView);
    
    if (isTradingView) {
      console.log('✅ TradingView CSV format detected successfully!');
      
      // Test parsing a sample row
      const lines = csvContent.split('\n');
      if (lines.length > 1) {
        const sampleRow = lines[1];
        console.log('Sample data row:', sampleRow);
        
        // Extract action field to test parsing
        const columns = sampleRow.split(',');
        const actionIndex = firstLine.split(',').findIndex(h => h.toLowerCase().includes('action'));
        if (actionIndex >= 0 && actionIndex < columns.length) {
          const action = columns[actionIndex];
          console.log('Sample action field:', action);
          
          // Test regex patterns from TradingView parser
          const sideMatch = action.match(/Close\s+(long|short)\s+position/i);
          const symbolMatch = action.match(/symbol\s+([^\s]+)\s+at/i);
          const priceMatch = action.match(/at price\s+([0-9.]+)/i);
          const avgMatch = action.match(/AVG Price was\s+([0-9.]+)/i);
          
          console.log('Regex matches:');
          console.log('- Side:', sideMatch ? sideMatch[1] : 'Not found');
          console.log('- Symbol:', symbolMatch ? symbolMatch[1] : 'Not found');
          console.log('- Price:', priceMatch ? priceMatch[1] : 'Not found');
          console.log('- Avg Price:', avgMatch ? avgMatch[1] : 'Not found');
          
          if (sideMatch && symbolMatch && priceMatch && avgMatch) {
            console.log('✅ Action field parsing successful!');
          } else {
            console.log('❌ Action field parsing failed');
          }
        }
      }
    } else {
      console.log('❌ TradingView CSV format not detected');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testTradingViewImport();
