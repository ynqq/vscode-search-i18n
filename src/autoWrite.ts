import { window } from "vscode";
import {
  getCustomSetting,
  getEnableTransform,
  getEntry,
  getTransKey,
} from "./config";
import { TQueryData } from "./util";
import { getFileData } from "./fileData";
import { LOCALESPATHS } from "./enum";

// 格式化key
const transformKey = (index?: number) => {
  const key = getTransKey();
  return `${key}_${index === undefined ? "" : index}`;
};

// 获取自定义key 最大值 + 1
const getTransKeyMax = () => {
  const transKey = transformKey();
  const fileData = getFileData();
  const keys = Object.keys(fileData)
    .filter((v) => v.startsWith(transKey))
    .map((v) => +v.replace(transKey, ""))
    .sort();
  if (keys.length) {
    return transformKey(keys.pop()! + 1);
  }
  return transformKey(0);
};

// 写入文件
const writeFile = async () => {
  const settings = getCustomSetting<string[]>(LOCALESPATHS);
  const entry = getEntry();
};

export const handleAutoWrite = async (
  selectText: string
): Promise<boolean | TQueryData> => {
  if (getEnableTransform()) {
    const key = getTransKey();
    const transKey = getTransKeyMax();
    console.log(key, transKey);

    return [{ path: transKey, value: selectText }];
  }

  window.showWarningMessage(`未搜索到${selectText}的相关信息`);
  return false;
};
