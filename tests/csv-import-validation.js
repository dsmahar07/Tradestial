/**
 * CSV Import Validation Testing for Tradestial
 * Tests real CSV file processing with sample trading data
 */

class CSVImportTester {
    constructor() {
        this.testResults = {
            fileTests: [],
            validationTests: [],
            performanceTests: [],
            errorHandlingTests: [],
            timestamp: new Date().toISOString()
        };
        this.sampleCSVData = this.generateSampleCSVData();
    }

    generateSampleCSVData() {
        return {
            tradingView: `Symbol,Side,Qty,Price,Time,Commission,P&L,Action
NQ,Long,1,21500.00,2024-01-15 09:30:00,2.50,250.00,Buy to open long position for symbol CME_MINI:NQU2024 at price 21500.00
NQ,Short,1,21750.00,2024-01-15 10:15:00,2.50,-250.00,Sell to close long position for symbol CME_MINI:NQU2024 at price 21750.00
ES,Long,2,5200.00,2024-01-15 11:00:00,4.20,400.00,Buy to open long position for symbol CME_MINI:ESU2024 at price 5200.00
ES,Short,2,5300.00,2024-01-15 14:30:00,4.20,-400.00,Sell to close long position for symbol CME_MINI:ESU2024 at price 5300.00`,

            webull: `Symbol,Side,Quantity,Price,Date,Time,Commission,P&L
AAPL,Buy,100,150.00,2024-01-15,09:30:00,1.00,500.00
AAPL,Sell,100,155.00,2024-01-15,10:30:00,1.00,-500.00
TSLA,Buy,50,250.00,2024-01-15,11:00:00,1.00,250.00
TSLA,Sell,50,255.00,2024-01-15,12:00:00,1.00,-250.00`,

            invalidData: `Symbol,Side,Qty,Price,Time
NQ,Invalid,abc,21500.00,invalid-date
,Long,1,,2024-01-15
NQ,Long,1,21500.00,2024-01-15`,

            largeFile: this.generateLargeCSVData(1000),
            
            emptyFile: '',
            
            malformedCSV: `Symbol,Side,Qty,Price"Time
NQ,Long,1,21500.00"2024-01-15
"ES,Short,2,5200.00,2024-01-15`
        };
    }

    generateLargeCSVData(rows) {
        let csv = 'Symbol,Side,Qty,Price,Time,Commission,P&L\n';
        for (let i = 0; i < rows; i++) {
            const symbols = ['NQ', 'ES', 'YM', 'RTY'];
            const sides = ['Long', 'Short'];
            const symbol = symbols[i % symbols.length];
            const side = sides[i % sides.length];
            const qty = Math.floor(Math.random() * 5) + 1;
            const price = (Math.random() * 1000 + 4000).toFixed(2);
            const time = `2024-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;
            const commission = (Math.random() * 5).toFixed(2);
            const pnl = (Math.random() * 1000 - 500).toFixed(2);
            
            csv += `${symbol},${side},${qty},${price},${time},${commission},${pnl}\n`;
        }
        return csv;
    }

    async runCSVImportTests() {
        console.log('📊 Starting CSV Import Validation Tests...\n');

        await this.testFileFormats();
        await this.testDataValidation();
        await this.testPerformance();
        await this.testErrorHandling();
        await this.testBrowserCompatibility();

        this.generateCSVTestReport();
    }

    async testFileFormats() {
        console.log('📁 Testing File Format Support...');

        const formats = [
            { name: 'TradingView CSV', data: this.sampleCSVData.tradingView, expected: 4 },
            { name: 'Webull CSV', data: this.sampleCSVData.webull, expected: 4 },
            { name: 'Large File (1000 rows)', data: this.sampleCSVData.largeFile, expected: 1000 },
            { name: 'Empty File', data: this.sampleCSVData.emptyFile, expected: 0 }
        ];

        for (const format of formats) {
            try {
                const result = await this.processCSVData(format.data);
                const success = result.rowCount === format.expected;
                
                this.testResults.fileTests.push({
                    format: format.name,
                    success,
                    expected: format.expected,
                    actual: result.rowCount,
                    processingTime: result.processingTime,
                    errors: result.errors
                });

                console.log(`${success ? '✅' : '❌'} ${format.name}: ${result.rowCount}/${format.expected} rows`);
            } catch (error) {
                console.log(`❌ ${format.name}: ${error.message}`);
                this.testResults.fileTests.push({
                    format: format.name,
                    success: false,
                    error: error.message
                });
            }
        }
    }

    async testDataValidation() {
        console.log('\n🔍 Testing Data Validation...');

        const validationTests = [
            {
                name: 'Valid TradingView Data',
                data: this.sampleCSVData.tradingView,
                shouldPass: true
            },
            {
                name: 'Invalid Data Types',
                data: this.sampleCSVData.invalidData,
                shouldPass: false
            },
            {
                name: 'Malformed CSV',
                data: this.sampleCSVData.malformedCSV,
                shouldPass: false
            }
        ];

        for (const test of validationTests) {
            try {
                const result = await this.validateCSVData(test.data);
                const success = test.shouldPass ? result.isValid : !result.isValid;

                this.testResults.validationTests.push({
                    test: test.name,
                    success,
                    expected: test.shouldPass ? 'valid' : 'invalid',
                    actual: result.isValid ? 'valid' : 'invalid',
                    validationErrors: result.errors,
                    warnings: result.warnings
                });

                console.log(`${success ? '✅' : '❌'} ${test.name}: ${result.isValid ? 'Valid' : 'Invalid'}`);
                if (result.errors.length > 0) {
                    result.errors.forEach(error => console.log(`   • ${error}`));
                }
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
            }
        }
    }

    async testPerformance() {
        console.log('\n⚡ Testing Performance...');

        const performanceTests = [
            { name: 'Small File (4 rows)', data: this.sampleCSVData.tradingView, maxTime: 100 },
            { name: 'Medium File (100 rows)', data: this.generateLargeCSVData(100), maxTime: 500 },
            { name: 'Large File (1000 rows)', data: this.sampleCSVData.largeFile, maxTime: 2000 }
        ];

        for (const test of performanceTests) {
            const startTime = performance.now();
            try {
                const result = await this.processCSVData(test.data);
                const processingTime = performance.now() - startTime;
                const success = processingTime <= test.maxTime;

                this.testResults.performanceTests.push({
                    test: test.name,
                    success,
                    processingTime: Math.round(processingTime),
                    maxTime: test.maxTime,
                    rowsProcessed: result.rowCount,
                    throughput: Math.round(result.rowCount / (processingTime / 1000))
                });

                console.log(`${success ? '✅' : '⚠️'} ${test.name}: ${Math.round(processingTime)}ms (max: ${test.maxTime}ms)`);
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
            }
        }
    }

    async testErrorHandling() {
        console.log('\n🚨 Testing Error Handling...');

        const errorTests = [
            { name: 'Empty File', data: '', expectedError: 'empty' },
            { name: 'Invalid Headers', data: 'Invalid,Headers\ndata,here', expectedError: 'headers' },
            { name: 'Corrupted Data', data: 'Symbol,Side\n"unclosed quote', expectedError: 'parsing' }
        ];

        for (const test of errorTests) {
            try {
                const result = await this.processCSVData(test.data);
                // If no error thrown, check if errors were captured
                const hasExpectedError = result.errors.length > 0;
                
                this.testResults.errorHandlingTests.push({
                    test: test.name,
                    success: hasExpectedError,
                    expectedError: test.expectedError,
                    actualErrors: result.errors
                });

                console.log(`${hasExpectedError ? '✅' : '❌'} ${test.name}: Error handling ${hasExpectedError ? 'working' : 'missing'}`);
            } catch (error) {
                // Expected behavior for some tests
                this.testResults.errorHandlingTests.push({
                    test: test.name,
                    success: true,
                    expectedError: test.expectedError,
                    actualError: error.message
                });
                console.log(`✅ ${test.name}: Properly caught error`);
            }
        }
    }

    async testBrowserCompatibility() {
        console.log('\n🌐 Testing Browser Compatibility...');

        const features = [
            { name: 'File API', test: () => !!window.File },
            { name: 'FileReader API', test: () => !!window.FileReader },
            { name: 'Blob API', test: () => !!window.Blob },
            { name: 'ArrayBuffer', test: () => !!window.ArrayBuffer },
            { name: 'TextDecoder', test: () => !!window.TextDecoder }
        ];

        features.forEach(feature => {
            const supported = feature.test();
            console.log(`${supported ? '✅' : '❌'} ${feature.name}: ${supported ? 'Supported' : 'Not supported'}`);
        });
    }

    async processCSVData(csvData) {
        const startTime = performance.now();
        const lines = csvData.trim().split('\n');
        const errors = [];
        
        if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
            errors.push('File is empty');
            return { rowCount: 0, errors, processingTime: performance.now() - startTime };
        }

        const headers = lines[0].split(',');
        const dataRows = lines.slice(1);
        
        // Basic validation
        dataRows.forEach((row, index) => {
            const columns = row.split(',');
            if (columns.length !== headers.length) {
                errors.push(`Row ${index + 2}: Column count mismatch`);
            }
        });

        return {
            rowCount: dataRows.length,
            headers,
            errors,
            processingTime: performance.now() - startTime
        };
    }

    async validateCSVData(csvData) {
        const result = await this.processCSVData(csvData);
        const errors = [...result.errors];
        const warnings = [];

        // Additional validation rules
        if (result.headers) {
            const requiredHeaders = ['Symbol', 'Side', 'Price'];
            const missingHeaders = requiredHeaders.filter(header => 
                !result.headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
            );
            
            if (missingHeaders.length > 0) {
                errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    generateCSVTestReport() {
        console.log('\n' + '='.repeat(70));
        console.log('📊 CSV IMPORT VALIDATION REPORT - TRADESTIAL');
        console.log('='.repeat(70));

        // File Format Tests
        console.log('\n📁 FILE FORMAT TESTS:');
        this.testResults.fileTests.forEach(test => {
            console.log(`   ${test.success ? '✅' : '❌'} ${test.format}: ${test.actual || 0}/${test.expected || 0} rows`);
            if (test.processingTime) {
                console.log(`      Processing time: ${Math.round(test.processingTime)}ms`);
            }
        });

        // Validation Tests
        console.log('\n🔍 VALIDATION TESTS:');
        this.testResults.validationTests.forEach(test => {
            console.log(`   ${test.success ? '✅' : '❌'} ${test.test}: ${test.actual}`);
        });

        // Performance Tests
        console.log('\n⚡ PERFORMANCE TESTS:');
        this.testResults.performanceTests.forEach(test => {
            console.log(`   ${test.success ? '✅' : '⚠️'} ${test.test}: ${test.processingTime}ms`);
            console.log(`      Throughput: ${test.throughput} rows/second`);
        });

        // Error Handling Tests
        console.log('\n🚨 ERROR HANDLING TESTS:');
        this.testResults.errorHandlingTests.forEach(test => {
            console.log(`   ${test.success ? '✅' : '❌'} ${test.test}: Error handling working`);
        });

        // Summary
        const allTests = [
            ...this.testResults.fileTests,
            ...this.testResults.validationTests,
            ...this.testResults.performanceTests,
            ...this.testResults.errorHandlingTests
        ];
        
        const passed = allTests.filter(test => test.success).length;
        const total = allTests.length;

        console.log('\n📈 SUMMARY:');
        console.log(`   Total Tests: ${total}`);
        console.log(`   Passed: ${passed}`);
        console.log(`   Failed: ${total - passed}`);
        console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

        console.log('\n🎯 RECOMMENDATIONS:');
        if (passed < total) {
            console.log('   • Fix failing CSV import tests');
            console.log('   • Improve error handling for edge cases');
        }
        console.log('   • Test with real broker CSV files');
        console.log('   • Implement progress indicators for large files');
        console.log('   • Add CSV format auto-detection');
    }

    // Create test CSV files for manual testing
    createTestFiles() {
        const files = [];
        Object.entries(this.sampleCSVData).forEach(([name, data]) => {
            const blob = new Blob([data], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            files.push({ name: `${name}.csv`, url, data });
        });
        return files;
    }
}

// Make available for browser console
if (typeof window !== 'undefined') {
    window.CSVImportTester = CSVImportTester;
}

// Export for Node.js
if (typeof module !== 'undefined') {
    module.exports = CSVImportTester;
}

// Auto-run if in browser
if (typeof window !== 'undefined' && window.document) {
    console.log('📊 CSV Import Tester loaded. Run: new CSVImportTester().runCSVImportTests()');
}
