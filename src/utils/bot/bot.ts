import chalk from "chalk";
import ora from "ora";
import { BrowserContextOptions, chromium } from "playwright";
import { STATE_FILE } from "../../data/constants";
import { Options } from "../../data/types";

export class Bot {
  constructor(private options: Options, private list: string[]) {}

  async run() {
    const { code, password, user, storageState } = this.options;

    const loader = ora("Launching Browser...").start();
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const contextOptions: BrowserContextOptions = {};

    if (storageState) contextOptions.storageState = STATE_FILE;

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    loader.succeed("Browser ready!");

    if (!storageState) {
      await page.goto("https://www.instagram.com");
      await page.waitForSelector("input[name=username]");
      await page.type("input[name=username]", user);
      await page.type("input[name=password]", password);
      await page.click("button[type=submit]");
      await page.waitForNavigation();
      await context.storageState({ path: `${process.cwd()}/tmp/state.json` });
      await page.waitForTimeout(1000);
    }

    await page.goto(`https://www.instagram.com/p/${code}/`);
    // await page.pause();
    await page.waitForSelector(`form textarea`);
    await page.waitForTimeout(1000);

    let countComments = 0;
    while (true) {
      const comment = this.list[Math.floor(Math.random() * this.list.length)];
      await page.type(`form textarea`, comment);
      await page.waitForTimeout(1000);
      await page.locator('form button:has-text("Publicar")').click();
      countComments++;

      console.log(`${chalk.green("✔")} Comment ${countComments}`);
      await page.waitForTimeout(12 * 1000);
    }
  }
}
