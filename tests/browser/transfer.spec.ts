import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

test('measure cold first-vessel resource transfer', {tag:'@smoke'}, async ({page}, testInfo) => {
  await page.goto('#/vessel/ever-ace');
  await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-loaded','ever-ace',{timeout:30000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(500);
  const measurement=await page.evaluate(()=>{
    const resources=performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const navigation=performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const entries=[...navigation,...resources].filter(entry=>entry.name.startsWith('http')).map(entry=>({
      url:entry.name, type:entry.entryType==='navigation'?'document':(entry as PerformanceResourceTiming).initiatorType,
      encodedBodySize:entry.encodedBodySize, decodedBodySize:entry.decodedBodySize, transferSize:entry.transferSize,
    }));
    return {entries,encodedBodyBytes:entries.reduce((sum,entry)=>sum+entry.encodedBodySize,0),decodedBodyBytes:entries.reduce((sum,entry)=>sum+entry.decodedBodySize,0),transferBytes:entries.reduce((sum,entry)=>sum+entry.transferSize,0)};
  });
  const report={measuredAt:new Date().toISOString(),serverMode:process.env.HULLSCOPE_PREVIEW==='1'?'production preview':'development',method:'Fresh Playwright browser context. Resource Timing entries plus document navigation after Ever Ace scene-ready and document.fonts.ready. encodedBodyBytes excludes response headers; transferBytes includes Resource Timing header estimates. Localhost hosting does not predict GitHub Pages compression.',...measurement};
  await mkdir('output/playwright',{recursive:true});
  await writeFile('output/playwright/initial-transfer.json',JSON.stringify(report,null,2));
  await testInfo.attach('initial-transfer.json',{body:JSON.stringify(report,null,2),contentType:'application/json'});
  expect(measurement.encodedBodyBytes).toBeGreaterThan(0);
  if(process.env.HULLSCOPE_PREVIEW==='1') expect(measurement.encodedBodyBytes).toBeLessThan(5_000_000);
});
