import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const artifactsDir = 'C:\\Users\\kanth\\.gemini\\antigravity-ide\\brain\\2b904595-6809-46be-ae7a-742ba3f88b3b\\artifacts\\screenshots';
if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
}

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1280, height: 800 } });
    const page = await browser.newPage();
    
    try {
        console.log('Navigating to login...');
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

        console.log('Typing credentials...');
        await page.type('input[type="email"]', 'demo_admin@oracle.ai');
        await page.type('input[type="password"]', 'DemoAdminPassword123!');
        
        console.log('Clicking login...');
        await page.click('button[type="submit"]');

        console.log('Waiting for navigation to dashboard...');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        // Sometimes it goes to /, let's check URL
        if (page.url() === 'http://localhost:3000/') {
            console.log('Went to /, navigating to /dashboard');
            await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
        }

        console.log('Taking admin dashboard screenshot...');
        await page.screenshot({ path: path.join(artifactsDir, 'admin_dashboard.png') });

        const reportsTabs = await page.$$('button');
        let reportsTab = null;
        for (let btn of reportsTabs) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('GLOBAL REPORTS')) reportsTab = btn;
        }
        if (reportsTab) {
            await reportsTab.click();
            await new Promise(r => setTimeout(r, 1000));
            await page.screenshot({ path: path.join(artifactsDir, 'report_history.png') });
        } else {
            console.log('GLOBAL REPORTS tab not found');
        }

        console.log('Navigating to workspace...');
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });

        console.log('Selecting locations...');
        await page.waitForSelector('select');
        await page.evaluate(() => {
            const selects = document.querySelectorAll('select');
            if (selects.length >= 2) {
                const selA = selects[0];
                const selB = selects[1];
                selA.value = selA.options[1].value;
                selA.dispatchEvent(new Event('change', { bubbles: true }));
                selB.value = selB.options[2].value;
                selB.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        const runBtns = await page.$$('button');
        let runBtn = null;
        for (let btn of runBtns) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.toUpperCase().includes('RUN ANALYSIS')) runBtn = btn;
        }
        if (runBtn) {
            await runBtn.click();
            console.log('Waiting for report to generate...');
            // Wait until button says Run Analysis again or similar, or just wait 8 seconds
            await new Promise(r => setTimeout(r, 8000));
            await page.screenshot({ path: path.join(artifactsDir, 'run_analysis.png') });
            await page.screenshot({ path: path.join(artifactsDir, 'credit_balance.png') });
        } else {
            console.log('Run Analysis button not found');
        }

    } catch (e) {
        console.error('Error during automation:', e);
    } finally {
        await browser.close();
        console.log('Done!');
    }
})();
