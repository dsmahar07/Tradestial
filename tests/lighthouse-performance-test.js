/**
 * Lighthouse Performance Testing for Tradestial
 * Automated performance auditing across different pages
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

class LighthouseTestRunner {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.results = {};
        this.config = {
            extends: 'lighthouse:default',
            settings: {
                formFactor: 'desktop',
                throttling: {
                    rttMs: 40,
                    throughputKbps: 10240,
                    cpuSlowdownMultiplier: 1,
                    requestLatencyMs: 0,
                    downloadThroughputKbps: 0,
                    uploadThroughputKbps: 0
                },
                screenEmulation: {
                    mobile: false,
                    width: 1350,
                    height: 940,
                    deviceScaleFactor: 1,
                    disabled: false,
                }
            }
        };
    }

    async runAudit(url, pageName) {
        console.log(`🔍 Running Lighthouse audit for ${pageName}...`);
        
        const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
        const options = {
            logLevel: 'info',
            output: 'json',
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
            port: chrome.port,
        };

        try {
            const runnerResult = await lighthouse(url, options, this.config);
            await chrome.kill();

            const scores = {
                performance: Math.round(runnerResult.lhr.categories.performance.score * 100),
                accessibility: Math.round(runnerResult.lhr.categories.accessibility.score * 100),
                bestPractices: Math.round(runnerResult.lhr.categories['best-practices'].score * 100),
                seo: Math.round(runnerResult.lhr.categories.seo.score * 100)
            };

            const metrics = {
                firstContentfulPaint: runnerResult.lhr.audits['first-contentful-paint'].numericValue,
                largestContentfulPaint: runnerResult.lhr.audits['largest-contentful-paint'].numericValue,
                cumulativeLayoutShift: runnerResult.lhr.audits['cumulative-layout-shift'].numericValue,
                totalBlockingTime: runnerResult.lhr.audits['total-blocking-time'].numericValue,
                speedIndex: runnerResult.lhr.audits['speed-index'].numericValue
            };

            this.results[pageName] = {
                url,
                scores,
                metrics,
                timestamp: new Date().toISOString()
            };

            console.log(`✅ ${pageName} - Performance: ${scores.performance}/100`);
            return runnerResult;

        } catch (error) {
            await chrome.kill();
            console.error(`❌ Failed to audit ${pageName}:`, error.message);
            throw error;
        }
    }

    async runAllAudits() {
        console.log('🚀 Starting Lighthouse Performance Testing for Tradestial...\n');

        const pages = [
            { url: this.baseUrl, name: 'Homepage' },
            { url: `${this.baseUrl}/analytics`, name: 'Analytics Dashboard' },
            { url: `${this.baseUrl}/import-data`, name: 'CSV Import' },
            { url: `${this.baseUrl}/account`, name: 'Account Page' },
            { url: `${this.baseUrl}/notes`, name: 'Notes Page' }
        ];

        for (const page of pages) {
            try {
                await this.runAudit(page.url, page.name);
                await this.delay(2000); // Wait between tests
            } catch (error) {
                console.error(`Failed to test ${page.name}`);
            }
        }

        this.generateReport();
    }

    generateReport() {
        console.log('\n' + '='.repeat(70));
        console.log('📊 LIGHTHOUSE PERFORMANCE REPORT - TRADESTIAL');
        console.log('='.repeat(70));

        let totalPerformance = 0;
        let totalAccessibility = 0;
        let pageCount = 0;

        Object.entries(this.results).forEach(([pageName, result]) => {
            console.log(`\n📄 ${pageName.toUpperCase()}`);
            console.log(`   Performance: ${result.scores.performance}/100`);
            console.log(`   Accessibility: ${result.scores.accessibility}/100`);
            console.log(`   Best Practices: ${result.scores.bestPractices}/100`);
            console.log(`   SEO: ${result.scores.seo}/100`);
            
            console.log(`   Core Web Vitals:`);
            console.log(`     FCP: ${(result.metrics.firstContentfulPaint / 1000).toFixed(2)}s`);
            console.log(`     LCP: ${(result.metrics.largestContentfulPaint / 1000).toFixed(2)}s`);
            console.log(`     CLS: ${result.metrics.cumulativeLayoutShift.toFixed(3)}`);
            console.log(`     TBT: ${result.metrics.totalBlockingTime.toFixed(0)}ms`);

            totalPerformance += result.scores.performance;
            totalAccessibility += result.scores.accessibility;
            pageCount++;
        });

        const avgPerformance = Math.round(totalPerformance / pageCount);
        const avgAccessibility = Math.round(totalAccessibility / pageCount);

        console.log('\n📈 OVERALL SCORES:');
        console.log(`   Average Performance: ${avgPerformance}/100`);
        console.log(`   Average Accessibility: ${avgAccessibility}/100`);

        console.log('\n🎯 RECOMMENDATIONS:');
        if (avgPerformance < 90) {
            console.log('   • Optimize images and assets');
            console.log('   • Implement code splitting');
            console.log('   • Minimize JavaScript bundles');
        }
        if (avgAccessibility < 95) {
            console.log('   • Add missing ARIA labels');
            console.log('   • Improve color contrast');
            console.log('   • Enhance keyboard navigation');
        }

        // Save detailed results
        const reportPath = path.join(__dirname, 'lighthouse-results.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Detailed results saved to: ${reportPath}`);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other scripts
module.exports = LighthouseTestRunner;

// Run if called directly
if (require.main === module) {
    const runner = new LighthouseTestRunner();
    runner.runAllAudits().catch(console.error);
}
