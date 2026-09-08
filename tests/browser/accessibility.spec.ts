import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const viewport of [{width: 1440, height: 900}, {width: 390, height: 844}]) {
  test(`WCAG accessibility scan through knowledge and dialogs at ${viewport.width}px`, {tag:viewport.width===390?'@smoke':[]}, async ({page}, testInfo) => {
    test.setTimeout(process.env.CI?180000:90000);
    await page.setViewportSize(viewport);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('#/vessel/ever-ace');
    await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-loaded','ever-ace',{timeout:30000});
    const failures: {state:string;id:string;impact:string|null|undefined;description:string;nodes: string[]}[]=[];
    const scan=async(state:string)=>{
      const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
      await testInfo.attach(`axe-${state}.json`,{body:JSON.stringify(results.violations,null,2),contentType:'application/json'});
      for(const violation of results.violations) failures.push({state,id:violation.id,impact:violation.impact,description:violation.description,nodes:violation.nodes.map(node=>`${node.target.join(' ')}: ${node.failureSummary}`)});
    };
    for(const mode of ['Explore','Performance','Risk']) {
      await page.getByRole('button',{name:mode,exact:true}).click();
      await scan(mode);
      await page.keyboard.press('Escape');
    }
    await page.getByRole('button',{name:'Explore',exact:true}).click();
    await page.getByRole('button',{name:'Browse the fleet',exact:true}).click();
    await scan('fleet-dialog');
    await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'Text catalogue',exact:true}).click();
    await scan('text-catalogue');
    await page.keyboard.press('Escape');
    await page.getByRole('switch',{name:'Drive mode',exact:true}).click();
    await scan('drive');
    await page.getByRole('switch',{name:'Drive mode',exact:true}).click();
    const scope=page.getByRole('combobox',{name:'Disassembly scope',exact:true});
    await scope.click();await scan('disassembly-options');
    await page.keyboard.press('Escape');
    await expect(scope).toBeFocused();
    expect(await page.evaluate(()=>document.querySelectorAll('[inert]').length)).toBe(0);
    expect(failures).toEqual([]);
  });
}
