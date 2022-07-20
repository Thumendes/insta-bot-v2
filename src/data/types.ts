export interface Options {
  user: string;
  password: string;
  list: string;
  code: string;
  storageState?: boolean;
}

export abstract class ExtensionParser {
  abstract parse(filePath: string): Promise<string[]>;
}

export type PromptValidate = (value: string) => boolean | string;
