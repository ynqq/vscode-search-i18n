import * as path from "path";
import * as fs from "fs";
import { window } from "vscode";
import { getCustomSetting, getEntry, getRealZHFilePath } from "./config";
import { LOCALESPATHS } from "./enum";
import { getLocalesFolderContent } from "./search";

let fileData: Record<string, any>; // 中文语言包数据
export const getFileData = () => fileData;

export const setFileData = async () => {
  const settings = getCustomSetting<string[]>(LOCALESPATHS);
  const entry = getEntry();
  const configFile = await getLocalesFolderContent(
    settings[0].split("/"),
    entry
  );
  if (!configFile) {
    window.showErrorMessage(
      "未查到配置的入口文件：search-i18n.entry。默认为：zh.js"
    );
    return;
  }
  fileData = configFile;
};

export const watchFile = () => {
  const realZHFilePath = getRealZHFilePath();
  fs.watchFile(realZHFilePath, async () => {
    setFileData();
  });
};
