import { Command } from "commander";
import { chromium } from "playwright";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import boxen from "boxen";
import { readFile, writeFile } from "fs/promises";

const program = new Command();

program
  .option("-u, --user <user>", "User to login in on Instagram.")
  .option("-p, --password <password>", "Password to login in on Instagram.")
  .option("-l, --list <list>", "List file (txt, json).")
  .option("-c, --code <code>", "Post Code Url.")
  .parse(process.argv);

interface Options {
  user: string;
  password: string;
  list: string;
  code: string;
  storageState?: boolean;
}

async function getConfigFileData(): Promise<Partial<Options>> {
  try {
    return await readFile(`${process.cwd()}/tmp/config.json`, "utf8").then(
      (data) => JSON.parse(data)
    );
  } catch (error) {
    return {};
  }
}

async function storageStateExists() {
  try {
    const data = await readFile(`${process.cwd()}/tmp/state.json`, "utf8");

    return !!data;
  } catch (error) {
    return false;
  }
}

async function updateConfigFile(options: Options) {
  const configFileData = await getConfigFileData();

  const configFile = `${process.cwd()}/tmp/config.json`;

  const configFileContent = JSON.stringify(
    { ...configFileData, ...options },
    null,
    2
  );

  await writeFile(configFile, configFileContent);
}

async function getListFile(fileName: string): Promise<string[]> {
  if (fileName.endsWith(".txt")) {
    return await readFile(fileName, "utf8").then((data) =>
      data.split("\n").map((item) => item.trim().replaceAll("\r", ""))
    );
  }

  if (fileName.endsWith(".json")) {
    return await readFile(fileName, "utf8").then((data) =>
      (JSON.parse(data) as string[]).map((item) =>
        item.trim().replaceAll("\r", "")
      )
    );
  }

  return [];
}

async function bot(
  { password, user, storageState, code }: Options,
  list: string[]
) {
  if (!list.length) throw new Error("List is empty.");

  const spinner = ora("Opening Browser...").start();

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({
    storageState: !storageState
      ? undefined
      : `${process.cwd()}/tmp/state.json`,
  });
  const page = await context.newPage();
  await page.goto("https://www.instagram.com");
  spinner.succeed("Browser ready!");

  if (!storageState) {
    await page.waitForSelector("input[name=username]");
    await page.type("input[name=username]", user);
    await page.type("input[name=password]", password);
    await page.click("button[type=submit]");
    await page.waitForNavigation();

    await context.storageState({ path: `${process.cwd()}/tmp/state.json` });
  }

  await page.goto(`https://www.instagram.com/p/${code}/`);
  await page.waitForSelector(`[data-testid="post-comment-text-area"]`);

  let countComments = 0;

  while (true) {
    // get random comment from list
    const comment = list[Math.floor(Math.random() * list.length)];

    await page.type(`[data-testid="post-comment-text-area"]`, comment);
    await page.waitForTimeout(500);
    await page.locator('[data-testid="post-comment-input-button"]').click();
    countComments++;

    console.log(`${chalk.green("✔")} Comment ${countComments}`);

    await page.waitForTimeout(12 * 1000);
  }
}

async function main(options: Options) {
  process.stdout.write("\x1Bc");

  console.log(
    boxen(chalk.bold("Welcome to InstaBot"), {
      padding: 1,
      borderColor: "green",
    })
  );

  const defaultOptions = await getConfigFileData();

  if (await storageStateExists()) {
    const { storageState } = await inquirer.prompt({
      type: "confirm",
      name: "storageState",
      message: "Do you want to use the last state?",
      default: true,
    });

    options.storageState = storageState;
  }

  if (!options.storageState) {
    if (!options.user) {
      const { user } = await inquirer.prompt({
        type: "input",
        name: "user",
        message: "User to login in on Instagram.",
        default: defaultOptions.user,
        validate: (value: string) => {
          if (!value) return "User is required.";

          return true;
        },
      });

      options.user = user;
    }

    if (!options.password) {
      const { password } = await inquirer.prompt({
        type: "password",
        name: "password",
        message: "Password to login in on Instagram.",
        default: defaultOptions.password,
        validate: (value: string) => {
          if (!value) return "Password is required.";

          return true;
        },
      });

      options.password = password;
    }
  }

  const listIsValid =
    options.list &&
    (options.list.endsWith(".txt") || options.list.endsWith(".json"));

  if (!options.list || !listIsValid) {
    if (options.list && !listIsValid) {
      console.log(
        chalk.red("Invalid extension for list file. Please use .txt or .json.")
      );
    }

    const { list } = await inquirer.prompt({
      type: "input",
      name: "list",
      message: "List file (txt, json).",
      default: defaultOptions.list,
      validate(value: string) {
        if (!value) return "List file is required.";

        if (!value.endsWith(".txt") && !value.endsWith(".json"))
          return "Invalid extension for list file. Please use .txt or .json.";

        return true;
      },
    });

    options.list = list;
  }

  if (!options.code) {
    const { code } = await inquirer.prompt({
      type: "input",
      name: "code",
      message: "Post Code that is in URL.",
      default: defaultOptions.code,
      validate: (value: string) => {
        if (!value) return "Code is required.";

        return true;
      },
    });

    options.code = code;
  }

  const spinner = ora("Loading...").start();

  await updateConfigFile(options);

  const list = await getListFile(options.list);

  console.log(`Encontrei ${list.length} opções de comentários.`);

  spinner.succeed("Loaded!");

  await bot(options, list);
}

main(program.opts())
  .catch((error) => {
    console.log(chalk.red(error.message));
    console.log(error.stack);
    process.exit(1);
  })
  .finally(() => {
    console.log("Done.");
  });
