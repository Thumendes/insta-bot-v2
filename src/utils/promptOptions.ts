import chalk from "chalk";
import { readFile, writeFile } from "fs/promises";
import inquirer from "inquirer";
import { CONFIG_FILE, STATE_FILE } from "../data/constants";
import { Options, PromptValidate } from "../data/types";
import { ListFiles } from "./getListFile/getListFile";

export class PromptOptions {
  async getConfigFileData(): Promise<Partial<Options>> {
    return await readFile(CONFIG_FILE, "utf8")
      .then((data) => JSON.parse(data))
      .catch(() => ({}));
  }

  async storageStateExists() {
    return await readFile(STATE_FILE, "utf8")
      .then(() => true)
      .catch(() => false);
  }

  async updateConfigFile(options: Partial<Options>) {
    const configFileData = await this.getConfigFileData();
    const newContent = { ...configFileData, ...options };

    await writeFile(CONFIG_FILE, JSON.stringify(newContent, null, 2));
  }

  async confirm(message: string, defaultValue = false) {
    const { value } = await inquirer.prompt({
      type: "confirm",
      name: "value",
      message,
      default: defaultValue,
    });

    return value;
  }

  async input(message: string, defaultValue = "", validate?: PromptValidate) {
    const { value } = await inquirer.prompt({
      type: "input",
      name: "value",
      message,
      default: defaultValue,
      validate,
    });

    return value;
  }

  async pass(message: string, defaultValue = "", validate?: PromptValidate) {
    const { value } = await inquirer.prompt({
      type: "password",
      name: "value",
      message,
      default: defaultValue,
      validate,
    });

    return value;
  }

  async get(options: Options) {
    const fileOptions = await this.getConfigFileData();
    const storageStateExists = await this.storageStateExists();

    if (storageStateExists) {
      options.storageState = await this.confirm(
        "Do you want to use the last state?",
        fileOptions.storageState
      );
    }

    if (!options.storageState) {
      options.user =
        options.user ||
        (await this.input(
          "Username to login in on Instagram.",
          fileOptions.user,
          (value) => !!value || "Username is required."
        ));

      options.password =
        options.password ||
        (await this.pass(
          "Password to login in on Instagram.",
          fileOptions.password,
          (value) => !!value || "Password is required."
        ));
    }

    const listIsValid = options.list && ListFiles.isValid(options.list);

    if (!options.list || !listIsValid) {
      if (options.list && !listIsValid) {
        console.log(
          chalk.red(
            "Invalid extension for list file. Please use .txt or .json."
          )
        );
      }

      options.list = await this.input(
        "List file to parse.",
        fileOptions.list,
        (value) => {
          if (!value) return "List file is required.";

          if (!ListFiles.isValid(value))
            return "Invalid extension for list file. Please use .txt or .json.";

          return true;
        }
      );
    }

    options.code =
      options.code ||
      (await this.input(
        "Post Code the is in Url",
        fileOptions.code,
        (value) => !!value || "Post Code is required."
      ));

    await this.updateConfigFile(options);

    const parser = ListFiles.getParser(options.list);

    const list = await new ListFiles().setParser(parser).get(options.list);

    console.log(chalk.green(`Found ${list.length} comments options!`));

    return { options, list };
  }
}
