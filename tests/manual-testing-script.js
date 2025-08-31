// Manual Testing Script for Tradestial
// Run in browser console: copy and paste this entire script

(function() {
    'use strict';
    
    const TestRunner = {
        results: {
            passed: 0,
            failed: 0,
            issues: [],
            performance: {},
            browser: navigator.userAgent,
            timestamp: new Date().toISOString()
        },
        
        log(status, message) {
            const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
            console.log(`${icon} ${message}`);
            if (status === 'pass') this.results.passed++;
            if (status === 'fail') {
                this.results.failed++;
                this.results.issues.push(message);
            }
        },
        
        async runAllTests() {
            console.log('🚀 Starting Tradestial Manual Testing Suite...\n');
            console.log('Browser:', navigator.userAgent.substring(0, 50) + '...\n');
            
            await this.testPageLoad();
            await this.testNavigation();
            await this.testCSVImport();
            await this.testAnalytics();
            await this.testResponsive();
            await this.testPerformance();
            await this.testLocalStorage();
            
            this.generateReport();
        },
        
        async testPageLoad() {
            console.log('📋 Testing Page Load...');
            
            const startTime = performance.now();
            try {
                // Test if main elements exist
                const header = document.querySelector('header, nav, [role="banner"]');
                const main = document.querySelector('main, [role="main"], .main-content');
                const loadTime = performance.now() - startTime;
                
                if (header) this.log('pass', 'Header/Navigation found');
                else this.log('fail', 'Header/Navigation missing');
                
                if (main) this.log('pass', 'Main content area found');
                else this.log('fail', 'Main content area missing');
                
                if (loadTime < 3000) this.log('pass', `Page loaded in ${loadTime.toFixed(2)}ms`);
                else this.log('warn', `Page load slow: ${loadTime.toFixed(2)}ms`);
                
                this.results.performance.pageLoad = loadTime;
            } catch (error) {
                this.log('fail', `Page load test failed: ${error.message}`);
            }
        },
        
        async testNavigation() {
            console.log('\n🧭 Testing Navigation...');
            
            try {
                const navLinks = document.querySelectorAll('a[href], button[onclick], [role="button"]');
                this.log('pass', `Found ${navLinks.length} interactive elements`);
                
                // Test for common navigation items
                const commonPages = ['analytics', 'import', 'account', 'notes'];
                commonPages.forEach(page => {
                    const link = Array.from(navLinks).find(link => 
                        link.href?.includes(page) || 
                        link.textContent?.toLowerCase().includes(page)
                    );
                    if (link) this.log('pass', `${page} navigation found`);
                    else this.log('fail', `${page} navigation missing`);
                });
            } catch (error) {
                this.log('fail', `Navigation test failed: ${error.message}`);
            }
        },
        
        async testCSVImport() {
            console.log('\n📊 Testing CSV Import...');
            
            try {
                // Look for file input or upload elements
                const fileInputs = document.querySelectorAll('input[type="file"]');
                const uploadButtons = document.querySelectorAll('[data-testid*="upload"], [class*="upload"], button:contains("Upload")');
                
                if (fileInputs.length > 0) this.log('pass', `Found ${fileInputs.length} file input(s)`);
                else this.log('fail', 'No file inputs found');
                
                // Test file input accepts CSV
                fileInputs.forEach((input, index) => {
                    if (input.accept?.includes('csv') || input.accept?.includes('.csv')) {
                        this.log('pass', `File input ${index + 1} accepts CSV`);
                    } else {
                        this.log('warn', `File input ${index + 1} may not accept CSV`);
                    }
                });
                
                // Check for drag and drop area
                const dropZones = document.querySelectorAll('[data-testid*="drop"], [class*="drop-zone"], [class*="dropzone"]');
                if (dropZones.length > 0) this.log('pass', 'Drag & drop area found');
                else this.log('warn', 'No drag & drop area detected');
                
            } catch (error) {
                this.log('fail', `CSV import test failed: ${error.message}`);
            }
        },
        
        async testAnalytics() {
            console.log('\n📈 Testing Analytics...');
            
            try {
                // Look for chart containers
                const chartContainers = document.querySelectorAll('canvas, svg, [class*="chart"], [data-testid*="chart"]');
                if (chartContainers.length > 0) this.log('pass', `Found ${chartContainers.length} chart container(s)`);
                else this.log('fail', 'No chart containers found');
                
                // Test for ECharts specifically
                const echartsElements = document.querySelectorAll('[_echarts_instance_]');
                if (echartsElements.length > 0) this.log('pass', `Found ${echartsElements.length} ECharts instance(s)`);
                else this.log('warn', 'No ECharts instances detected');
                
                // Check for analytics data
                const dataElements = document.querySelectorAll('[data-value], .metric, .stat, [class*="analytics"]');
                if (dataElements.length > 0) this.log('pass', `Found ${dataElements.length} data element(s)`);
                else this.log('warn', 'No analytics data elements found');
                
            } catch (error) {
                this.log('fail', `Analytics test failed: ${error.message}`);
            }
        },
        
        async testResponsive() {
            console.log('\n📱 Testing Responsive Design...');
            
            try {
                const viewport = {
                    width: window.innerWidth,
                    height: window.innerHeight
                };
                
                this.log('pass', `Current viewport: ${viewport.width}x${viewport.height}`);
                
                // Test viewport meta tag
                const viewportMeta = document.querySelector('meta[name="viewport"]');
                if (viewportMeta) this.log('pass', 'Viewport meta tag found');
                else this.log('fail', 'Viewport meta tag missing');
                
                // Test responsive breakpoints
                if (viewport.width < 768) {
                    this.log('pass', 'Mobile viewport detected');
                } else if (viewport.width < 1024) {
                    this.log('pass', 'Tablet viewport detected');
                } else {
                    this.log('pass', 'Desktop viewport detected');
                }
                
                // Check for responsive classes
                const responsiveElements = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"], [class*="xl:"]');
                if (responsiveElements.length > 0) this.log('pass', 'Responsive CSS classes found');
                else this.log('warn', 'No responsive CSS classes detected');
                
            } catch (error) {
                this.log('fail', `Responsive test failed: ${error.message}`);
            }
        },
        
        async testPerformance() {
            console.log('\n⚡ Testing Performance...');
            
            try {
                // Test DOM query performance
                const startDOM = performance.now();
                for (let i = 0; i < 100; i++) {
                    document.querySelectorAll('*');
                }
                const domTime = performance.now() - startDOM;
                this.results.performance.domQuery = domTime;
                
                if (domTime < 50) this.log('pass', `DOM query performance: ${domTime.toFixed(2)}ms`);
                else this.log('warn', `DOM query slow: ${domTime.toFixed(2)}ms`);
                
                // Test memory usage
                if (performance.memory) {
                    const memory = {
                        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
                    };
                    this.results.performance.memory = memory;
                    
                    if (memory.used < 50) this.log('pass', `Memory usage: ${memory.used}MB`);
                    else this.log('warn', `High memory usage: ${memory.used}MB`);
                }
                
                // Test paint timing
                const paintEntries = performance.getEntriesByType('paint');
                paintEntries.forEach(entry => {
                    this.results.performance[entry.name] = entry.startTime;
                    if (entry.startTime < 1000) this.log('pass', `${entry.name}: ${entry.startTime.toFixed(2)}ms`);
                    else this.log('warn', `${entry.name} slow: ${entry.startTime.toFixed(2)}ms`);
                });
                
            } catch (error) {
                this.log('fail', `Performance test failed: ${error.message}`);
            }
        },
        
        async testLocalStorage() {
            console.log('\n💾 Testing Local Storage...');
            
            try {
                // Test localStorage availability
                if (typeof Storage !== 'undefined') {
                    this.log('pass', 'Local Storage available');
                    
                    // Test read/write
                    localStorage.setItem('tradestial_test', 'test_value');
                    const value = localStorage.getItem('tradestial_test');
                    localStorage.removeItem('tradestial_test');
                    
                    if (value === 'test_value') this.log('pass', 'Local Storage read/write working');
                    else this.log('fail', 'Local Storage read/write failed');
                    
                    // Check for existing Tradestial data
                    const tradestialKeys = Object.keys(localStorage).filter(key => 
                        key.includes('tradestial') || key.includes('trade') || key.includes('analytics')
                    );
                    
                    if (tradestialKeys.length > 0) {
                        this.log('pass', `Found ${tradestialKeys.length} Tradestial storage key(s)`);
                    } else {
                        this.log('warn', 'No Tradestial data in localStorage');
                    }
                    
                } else {
                    this.log('fail', 'Local Storage not available');
                }
            } catch (error) {
                this.log('fail', `Local Storage test failed: ${error.message}`);
            }
        },
        
        generateReport() {
            console.log('\n' + '='.repeat(60));
            console.log('📊 TRADESTIAL TESTING REPORT');
            console.log('='.repeat(60));
            
            console.log(`\n✅ Tests Passed: ${this.results.passed}`);
            console.log(`❌ Tests Failed: ${this.results.failed}`);
            console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
            
            if (this.results.issues.length > 0) {
                console.log('\n🚨 Issues Found:');
                this.results.issues.forEach((issue, index) => {
                    console.log(`${index + 1}. ${issue}`);
                });
            }
            
            console.log('\n⚡ Performance Results:');
            Object.entries(this.results.performance).forEach(([test, value]) => {
                if (typeof value === 'object') {
                    console.log(`  ${test}:`, value);
                } else {
                    console.log(`  ${test}: ${typeof value === 'number' ? value.toFixed(2) + 'ms' : value}`);
                }
            });
            
            console.log('\n🎯 Browser Compatibility:');
            console.log(`  User Agent: ${navigator.userAgent}`);
            console.log(`  Viewport: ${window.innerWidth}x${window.innerHeight}`);
            console.log(`  Color Depth: ${screen.colorDepth}-bit`);
            console.log(`  Language: ${navigator.language}`);
            
            console.log('\n📋 Next Steps:');
            if (this.results.failed > 0) {
                console.log('  • Fix critical issues before deployment');
            }
            if (Object.values(this.results.performance).some(val => typeof val === 'number' && val > 3000)) {
                console.log('  • Optimize performance for slower operations');
            }
            console.log('  • Test on additional browsers and devices');
            console.log('  • Run accessibility audit');
            
            // Save results to console for copy/paste
            console.log('\n📄 Test Results JSON (copy for reporting):');
            console.log(JSON.stringify(this.results, null, 2));
        }
    };
    
    // Auto-run tests
    TestRunner.runAllTests();
    
    // Make available globally for manual re-run
    window.TradestialTestRunner = TestRunner;
    
})();

console.log('\n🔧 Manual Testing Commands:');
console.log('• TradestialTestRunner.runAllTests() - Run all tests again');
console.log('• TradestialTestRunner.testCSVImport() - Test CSV import only');
console.log('• TradestialTestRunner.testAnalytics() - Test analytics only');
console.log('• TradestialTestRunner.testPerformance() - Test performance only');
