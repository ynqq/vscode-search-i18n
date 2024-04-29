import { Uri, workspace } from "vscode";
import {
  ENABLETRANSFORM,
  ENTRY,
  INCLUDESFILE,
  LOCALESPATHS,
  TRANSKEY,
} from "./enum";
import * as path from "path";

let realZHFilePath = ""; // 中文语言包文件路径

export const getRealZHFilePath = () => realZHFilePath;
export const setRealZHFilePath = () => {
  const entry = getEntry();
  const settings = getI18nPaths();
  const folderPath = Uri.joinPath(
    Uri.file(workspace.workspaceFolders![0].uri.fsPath),
    ...settings[0].split("/")
  );
  realZHFilePath = path.join(folderPath.fsPath, entry);
};
export const getEntry = () => {
  return getCustomSetting<string>(ENTRY) || "zh.js";
};
export const getI18nPaths = () => {
  return getCustomSetting<string[]>(LOCALESPATHS);
};
export const getReadConfig = () => {
  return getCustomSetting<string>(INCLUDESFILE) || "ts,tsx,vue";
};
export const getEnableTransform = () => {
  return getCustomSetting<boolean>(ENABLETRANSFORM);
};
export const getTransKey = () => {
  return getCustomSetting<string>(TRANSKEY) || "autoKey";
};

export function getCustomSetting<T>(configName: string): T {
  try {
    // 获取插件的配置
    const config = workspace.getConfiguration("");
    // 读取配置项
    return config.get(configName) as T;
  } catch (error) {
    return "" as T;
  }
}
