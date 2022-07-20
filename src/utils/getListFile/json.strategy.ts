import { readFile } from "fs/promises";
import { ExtensionParser } from "../../data/types";

export class JsonExtensionParser extends ExtensionParser {
  async parse(filePath: string) {
    return await readFile(filePath, "utf8").then((data) =>
      (JSON.parse(data) as string[]).map((item) =>
        item.trim().replaceAll("\r", "")
      )
    );
  }
}
