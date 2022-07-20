import { readFile } from "fs/promises";
import { ExtensionParser } from "../../data/types";

export class TxtExtensionParser extends ExtensionParser {
  async parse(filePath: string) {
    return await readFile(filePath, "utf8").then((data) =>
      data.split("\n").map((item) => item.trim().replaceAll("\r", ""))
    );
  }
}
