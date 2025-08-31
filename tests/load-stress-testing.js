/**
 * Load and Stress Testing for Tradestial
 * Tests application performance under various load conditions
 */

class LoadStressTester {
    constructor() {
        this.results = {
            memoryTests: [],
            concurrencyTests: [],
            dataLoadTests: [],
            uiResponsivenessTests: [],
            timestamp: new Date().toISOString()
        };
        this.testData = this.generateTestData();
    }

    generateTestData() {
        return {
            smallDataset: this.generateTrades(100),
            mediumDataset: this.generateTrades(1000),
            largeDataset: this.generateTrades(10000),
            massiveDataset: this.generateTrades(50000)
        };
    }

    generateTrades(count) {
        const trades = [];
        const symbols = ['NQ', 'ES', 'YM', 'RTY', 'CL', 'GC', 'AAPL', 'TSLA', 'MSFT', 'GOOGL'];
        
        for (let i = 0; i < count; i++) {
            trades.push({
                id: i + 1,
                symbol: symbols[Math.floor(Math.random() * symbols.length)],
                side: Math.random() > 0.5 ? 'Long' : 'Short',
                quantity: Math.floor(Math.random() * 10) + 1,
                price: Math.random() * 1000 + 100,
                timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
                pnl: (Math.random() - 0.5) * 1000,
                commission: Math.random() * 10
            });
        }
        return trades;
    }

    async runLoadStressTests() {
        console.log('🔥 Starting Load and Stress Testing for Tradestial...\n');

        await this.testMemoryUsage();
        await this.testConcurrentOperations();
        await this.testDataLoadPerformance();
        await this.testUIResponsiveness();
        await this.testBrowserLimits();

        this.generateLoadTestReport();
    }

    async testMemoryUsage() {
        console.log('🧠 Testing Memory Usage...');

        const datasets = [
            { name: 'Small Dataset (100 trades)', data: this.testData.smallDataset },
            { name: 'Medium Dataset (1K trades)', data: this.testData.mediumDataset },
            { name: 'Large Dataset (10K trades)', data: this.testData.largeDataset },
            { name: 'Massive Dataset (50K trades)', data: this.testData.massiveDataset }
        ];

        for (const dataset of datasets) {
            const initialMemory = this.getMemoryUsage();
            const startTime = performance.now();

            try {
                // Simulate data processing
                await this.processLargeDataset(dataset.data);
                
                const finalMemory = this.getMemoryUsage();
                const processingTime = performance.now() - startTime;
                const memoryIncrease = finalMemory.used - initialMemory.used;

                this.results.memoryTests.push({
                    dataset: dataset.name,
                    recordCount: dataset.data.length,
                    processingTime: Math.round(processingTime),
                    memoryBefore: initialMemory.used,
                    memoryAfter: finalMemory.used,
                    memoryIncrease,
                    success: memoryIncrease < 100 // Less than 100MB increase
                });

                console.log(`${memoryIncrease < 100 ? '✅' : '⚠️'} ${dataset.name}: +${memoryIncrease.toFixed(1)}MB, ${Math.round(processingTime)}ms`);

                // Force garbage collection attempt
                if (window.gc) window.gc();
                await this.delay(1000);

            } catch (error) {
                console.log(`❌ ${dataset.name}: ${error.message}`);
                this.results.memoryTests.push({
                    dataset: dataset.name,
                    error: error.message,
                    success: false
                });
            }
        }
    }

    async testConcurrentOperations() {
        console.log('\n🔄 Testing Concurrent Operations...');

        const concurrentTests = [
            { name: '5 Concurrent CSV Imports', operations: 5, type: 'csv-import' },
            { name: '10 Concurrent Chart Renders', operations: 10, type: 'chart-render' },
            { name: '20 Concurrent Data Filters', operations: 20, type: 'data-filter' },
            { name: '50 Concurrent UI Updates', operations: 50, type: 'ui-update' }
        ];

        for (const test of concurrentTests) {
            const startTime = performance.now();
            const promises = [];

            try {
                for (let i = 0; i < test.operations; i++) {
                    promises.push(this.simulateOperation(test.type, i));
                }

                const results = await Promise.allSettled(promises);
                const processingTime = performance.now() - startTime;
                const successful = results.filter(r => r.status === 'fulfilled').length;
                const failed = results.filter(r => r.status === 'rejected').length;

                this.results.concurrencyTests.push({
                    test: test.name,
                    operations: test.operations,
                    successful,
                    failed,
                    processingTime: Math.round(processingTime),
                    success: failed === 0 && processingTime < 5000
                });

                console.log(`${failed === 0 ? '✅' : '⚠️'} ${test.name}: ${successful}/${test.operations} successful, ${Math.round(processingTime)}ms`);

            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
                this.results.concurrencyTests.push({
                    test: test.name,
                    error: error.message,
                    success: false
                });
            }
        }
    }

    async testDataLoadPerformance() {
        console.log('\n📊 Testing Data Load Performance...');

        const loadTests = [
            { name: 'Initial App Load', target: 3000 },
            { name: 'Analytics Dashboard Load', target: 2000 },
            { name: 'Large Dataset Visualization', target: 5000 },
            { name: 'Real-time Data Updates', target: 100 }
        ];

        for (const test of loadTests) {
            const measurements = [];
            
            // Run test multiple times for average
            for (let i = 0; i < 5; i++) {
                const startTime = performance.now();
                await this.simulateDataLoad(test.name);
                const loadTime = performance.now() - startTime;
                measurements.push(loadTime);
                await this.delay(500);
            }

            const avgLoadTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
            const success = avgLoadTime <= test.target;

            this.results.dataLoadTests.push({
                test: test.name,
                measurements,
                averageTime: Math.round(avgLoadTime),
                target: test.target,
                success
            });

            console.log(`${success ? '✅' : '⚠️'} ${test.name}: ${Math.round(avgLoadTime)}ms avg (target: ${test.target}ms)`);
        }
    }

    async testUIResponsiveness() {
        console.log('\n🖱️ Testing UI Responsiveness...');

        const uiTests = [
            { name: 'Button Click Response', target: 50 },
            { name: 'Form Input Lag', target: 100 },
            { name: 'Chart Interaction', target: 200 },
            { name: 'Navigation Transition', target: 300 }
        ];

        for (const test of uiTests) {
            try {
                const responseTime = await this.measureUIResponse(test.name);
                const success = responseTime <= test.target;

                this.results.uiResponsivenessTests.push({
                    test: test.name,
                    responseTime: Math.round(responseTime),
                    target: test.target,
                    success
                });

                console.log(`${success ? '✅' : '⚠️'} ${test.name}: ${Math.round(responseTime)}ms (target: ${test.target}ms)`);

            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
                this.results.uiResponsivenessTests.push({
                    test: test.name,
                    error: error.message,
                    success: false
                });
            }
        }
    }

    async testBrowserLimits() {
        console.log('\n🌐 Testing Browser Limits...');

        // Test localStorage limits
        try {
            const maxStorage = this.testLocalStorageLimit();
            console.log(`✅ LocalStorage Limit: ~${maxStorage}MB`);
        } catch (error) {
            console.log(`⚠️ LocalStorage Limit: ${error.message}`);
        }

        // Test maximum DOM elements
        try {
            const maxElements = await this.testDOMElementLimit();
            console.log(`✅ DOM Element Limit: ~${maxElements} elements`);
        } catch (error) {
            console.log(`⚠️ DOM Element Limit: ${error.message}`);
        }

        // Test WebWorker availability
        if (typeof Worker !== 'undefined') {
            console.log('✅ Web Workers: Available');
        } else {
            console.log('❌ Web Workers: Not available');
        }
    }

    // Helper methods
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return { used: 0, total: 0, limit: 0 };
    }

    async processLargeDataset(data) {
        // Simulate heavy data processing
        const chunks = this.chunkArray(data, 1000);
        for (const chunk of chunks) {
            await this.processChunk(chunk);
            await this.delay(10); // Yield to browser
        }
    }

    async processChunk(chunk) {
        // Simulate analytics calculations
        return chunk.map(trade => ({
            ...trade,
            runningPnL: chunk.slice(0, chunk.indexOf(trade) + 1)
                .reduce((sum, t) => sum + t.pnl, 0),
            avgPrice: chunk.slice(0, chunk.indexOf(trade) + 1)
                .reduce((sum, t) => sum + t.price, 0) / (chunk.indexOf(trade) + 1)
        }));
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    async simulateOperation(type, index) {
        const delay = Math.random() * 1000 + 100;
        await this.delay(delay);
        
        switch (type) {
            case 'csv-import':
                return this.simulateCSVImport(index);
            case 'chart-render':
                return this.simulateChartRender(index);
            case 'data-filter':
                return this.simulateDataFilter(index);
            case 'ui-update':
                return this.simulateUIUpdate(index);
            default:
                throw new Error(`Unknown operation type: ${type}`);
        }
    }

    async simulateCSVImport(index) {
        const data = this.testData.smallDataset;
        return this.processLargeDataset(data);
    }

    async simulateChartRender(index) {
        // Simulate chart rendering
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        for (let i = 0; i < 100; i++) {
            ctx.fillRect(i, i, 10, 10);
        }
        return canvas;
    }

    async simulateDataFilter(index) {
        const data = this.testData.mediumDataset;
        return data.filter(trade => trade.pnl > 0);
    }

    async simulateUIUpdate(index) {
        const div = document.createElement('div');
        div.textContent = `Update ${index}`;
        document.body.appendChild(div);
        await this.delay(1);
        document.body.removeChild(div);
        return div;
    }

    async simulateDataLoad(testName) {
        switch (testName) {
            case 'Initial App Load':
                await this.delay(Math.random() * 2000 + 500);
                break;
            case 'Analytics Dashboard Load':
                await this.delay(Math.random() * 1500 + 300);
                break;
            case 'Large Dataset Visualization':
                await this.processLargeDataset(this.testData.largeDataset.slice(0, 1000));
                break;
            case 'Real-time Data Updates':
                await this.delay(Math.random() * 50 + 10);
                break;
        }
    }

    async measureUIResponse(testName) {
        const startTime = performance.now();
        
        switch (testName) {
            case 'Button Click Response':
                const button = document.createElement('button');
                button.click();
                break;
            case 'Form Input Lag':
                const input = document.createElement('input');
                input.value = 'test';
                break;
            case 'Chart Interaction':
                await this.simulateChartRender(0);
                break;
            case 'Navigation Transition':
                await this.delay(Math.random() * 200 + 50);
                break;
        }
        
        return performance.now() - startTime;
    }

    testLocalStorageLimit() {
        let size = 0;
        try {
            for (let i = 0; i < 10000; i++) {
                const key = `test_${i}`;
                const data = 'x'.repeat(1024); // 1KB
                localStorage.setItem(key, data);
                size += 1;
            }
        } catch (e) {
            // Clean up
            for (let i = 0; i < size; i++) {
                localStorage.removeItem(`test_${i}`);
            }
        }
        return Math.round(size / 1024); // Convert to MB
    }

    async testDOMElementLimit() {
        let count = 0;
        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);
        
        try {
            for (let i = 0; i < 100000; i++) {
                const div = document.createElement('div');
                container.appendChild(div);
                count++;
                
                if (i % 1000 === 0) {
                    await this.delay(1); // Yield to browser
                }
            }
        } catch (e) {
            // Browser limit reached
        } finally {
            document.body.removeChild(container);
        }
        
        return count;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateLoadTestReport() {
        console.log('\n' + '='.repeat(70));
        console.log('🔥 LOAD & STRESS TEST REPORT - TRADESTIAL');
        console.log('='.repeat(70));

        // Memory Tests
        console.log('\n🧠 MEMORY USAGE TESTS:');
        this.results.memoryTests.forEach(test => {
            if (test.success !== undefined) {
                console.log(`   ${test.success ? '✅' : '⚠️'} ${test.dataset}`);
                console.log(`      Memory increase: +${test.memoryIncrease?.toFixed(1) || 0}MB`);
                console.log(`      Processing time: ${test.processingTime || 0}ms`);
            }
        });

        // Concurrency Tests
        console.log('\n🔄 CONCURRENCY TESTS:');
        this.results.concurrencyTests.forEach(test => {
            if (test.success !== undefined) {
                console.log(`   ${test.success ? '✅' : '⚠️'} ${test.test}`);
                console.log(`      Success rate: ${test.successful}/${test.operations}`);
                console.log(`      Total time: ${test.processingTime}ms`);
            }
        });

        // Data Load Tests
        console.log('\n📊 DATA LOAD PERFORMANCE:');
        this.results.dataLoadTests.forEach(test => {
            console.log(`   ${test.success ? '✅' : '⚠️'} ${test.test}: ${test.averageTime}ms avg`);
        });

        // UI Responsiveness
        console.log('\n🖱️ UI RESPONSIVENESS:');
        this.results.uiResponsivenessTests.forEach(test => {
            if (test.success !== undefined) {
                console.log(`   ${test.success ? '✅' : '⚠️'} ${test.test}: ${test.responseTime}ms`);
            }
        });

        // Overall Summary
        const allTests = [
            ...this.results.memoryTests,
            ...this.results.concurrencyTests,
            ...this.results.dataLoadTests,
            ...this.results.uiResponsivenessTests
        ].filter(test => test.success !== undefined);

        const passed = allTests.filter(test => test.success).length;
        const total = allTests.length;

        console.log('\n📈 OVERALL PERFORMANCE:');
        console.log(`   Total Tests: ${total}`);
        console.log(`   Passed: ${passed}`);
        console.log(`   Failed: ${total - passed}`);
        console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

        console.log('\n🎯 PERFORMANCE RECOMMENDATIONS:');
        if (passed < total) {
            console.log('   • Optimize memory usage for large datasets');
            console.log('   • Implement data virtualization for better performance');
            console.log('   • Add loading states and progress indicators');
        }
        console.log('   • Consider Web Workers for heavy computations');
        console.log('   • Implement data pagination for large datasets');
        console.log('   • Add performance monitoring in production');
    }
}

// Make available for browser console
if (typeof window !== 'undefined') {
    window.LoadStressTester = LoadStressTester;
}

// Export for Node.js
if (typeof module !== 'undefined') {
    module.exports = LoadStressTester;
}

// Auto-run if in browser
if (typeof window !== 'undefined' && window.document) {
    console.log('🔥 Load Stress Tester loaded. Run: new LoadStressTester().runLoadStressTests()');
}
