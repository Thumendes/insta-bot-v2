import { EXTENSION_PARSER_TYPES } from "../../data/constants";
import { ExtensionParser } from "../../data/types";
import { JsonExtensionParser } from "./json.strategy";
import { TxtExtensionParser } from "./txt.strategy";

export class ListFiles {
  private parser!: ExtensionParser;

  setParser(parser: ExtensionParser) {
    this.parser = parser;
    return this;
  }

  static isValid(filePath: string) {
    for (const extension of Object.values(EXTENSION_PARSER_TYPES))
      if (filePath.endsWith(`.${extension}`)) return true;

    return false;
  }

  static getParser(filePath: string) {
    if (filePath.endsWith(EXTENSION_PARSER_TYPES.JSON))
      return new JsonExtensionParser();

    if (filePath.endsWith(EXTENSION_PARSER_TYPES.TXT))
      return new TxtExtensionParser();

    throw new Error(
      `Invalid extension for list file. Please use .txt or .json.`
    );
  }

  async get(filePath: string) {
    return await this.parser.parse(filePath);
  }
}
