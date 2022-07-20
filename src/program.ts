import boxen from "boxen";
import chalk from "chalk";
import { Command } from "commander";
import { Options } from "./data/types";
import { Bot } from "./utils/bot/bot";
import { PromptOptions } from "./utils/promptOptions";

export class Program {
  private cli!: Command;

  constructor() {
    this.cli = new Command();
  }

  handleError(error: Error) {
    console.log(chalk.red(error.message));
    console.log(error.stack);

    process.exit(1);
  }

  welcome() {
    console.log(
      boxen(chalk.bold("Welcome to InstaBot"), {
        padding: 1,
        borderColor: "green",
      })
    );
  }

  async init() {
    this.cli
      .option("-u, --user <user>", "User to login in on Instagram.")
      .option("-p, --password <password>", "Password to login in on Instagram.")
      .option("-l, --list <list>", "List file (txt, json).")
      .option("-c, --code <code>", "Post Code Url.")
      .parse(process.argv);

    await this.run(this.cli.opts()).catch(this.handleError);

    console.log("Done");
  }

  async run(cliOptions: Options) {
    this.welcome();

    const { list, options } = await new PromptOptions().get(cliOptions);

    await new Bot(options, list).run();
  }
}
