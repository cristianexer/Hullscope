import { expect, type Page } from '@playwright/test';

export async function openSystems(page:Page) {
  const search=page.getByLabel('Find a component',{exact:true});
  if(!await search.isVisible()) {
    const opener=page.getByRole('button',{name:'Open anatomy browser',exact:true});
    if(await opener.isVisible()) await opener.click();
    const section=page.getByRole('button',{name:'Ship systems',exact:true});
    if(await section.getAttribute('aria-expanded')==='false') await section.click();
  }
  await expect(search).toBeVisible();
}

export async function chooseOption(page:Page,label:string,option:string) {
  const trigger=page.getByRole('combobox',{name:label,exact:true});
  await trigger.click();
  await page.getByRole('option',{name:option,exact:true}).click();
  await expect(trigger).toContainText(option);
}
