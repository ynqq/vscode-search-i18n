import { Uri, workspace } from "vscode";
import {
  ENABLE_TRANS,
  ENABLETRANSFORM,
  ENTRY,
  INCLUDESFILE,
  LOCALESPATHS,
  TRANS_FILE_CONFIG,
  TRANSKEY,
  PATH_CONFIG,
  MAX_KEY,
  INCLUDES_ENTRY,
  NAMESPACE_RULES,
} from "./enum";
import * as path from "path";
import { genObj, toHump } from "./util";

let realZHFilePath = ""; // 中文语言包文件路径

export const getRealZHFilePath = () => realZHFilePath;
export const setRealZHFilePath = () => {
  const entry = getEntry();
  const settings = getI18nPaths();
  const folderPath = Uri.joinPath(
    Uri.file(workspace.workspaceFolders![0].uri.fsPath),
    ...settings[0].split("/"),
  );
  realZHFilePath = path.join(folderPath.fsPath, entry);
};
export const getEntry = () => {
  return getCustomSetting<string>(ENTRY) || "zh.js";
};
export const getIncludesEntry = () => {
  return getCustomSetting<string[]>(INCLUDES_ENTRY) || [];
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
export const getMaxKey = () => {
  return getCustomSetting<number>(MAX_KEY) || 15;
};
export const getPathConfig = () => {
  const config = getCustomSetting<Record<string, string>>(PATH_CONFIG) || {};
  return Object.keys(config).reduce<Record<string, any>>((obj, k) => {
    obj[k] = genObj(config[k]);
    return obj;
  }, {});
};

export const getFilePathPrev = (path: string) => {
  const config = getPathConfig(),
    keys = Object.keys(config);
  let maxMatch = 0,
    maxIndex;
  keys.forEach((key, index) => {
    let len = path.match(key)?.[0]?.length || 0;
    if (len > maxMatch) {
      maxIndex = index;
    }
  });
  if (maxIndex !== undefined) {
    return config[keys[maxIndex]];
  }
  return null;
};

const getNamespace = (path: string) => {
  const config = getCustomSetting<string[]>(NAMESPACE_RULES) || [];
  if (!config?.length) {
    return null;
  }
  for (let rule of config) {
    if (rule.endsWith("/")) {
      rule = rule.slice(0, -1);
    }
    if (!rule.includes("*") || !rule.endsWith("*")) {
      continue;
    }
    rule = `${rule.slice(0, -1)}(*)/`;
    const reg = new RegExp(rule.replace(/\*/g, ".*?"));
    const result = path.match(reg);
    if (result) {
      return toHump(result[1]);
    }
  }
  return null;
};

/**
 * 获取匹配的命名空间
 */
export const getNamespaceRule = (path: string) => {
  const name = getNamespace(path);
  if (!name) {
    return name;
  }
  return genObj(name);
};

/**
 * 是否开启自动翻译
 * @returns
 */
export const getEnableTrans = () => {
  return getCustomSetting<boolean>(ENABLE_TRANS);
};
export const getTranFileConfig = () => {
  return getCustomSetting<{
    en?: string;
    ja?: string;
  }>(TRANS_FILE_CONFIG);
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
