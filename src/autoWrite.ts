import { Uri, window, workspace } from "vscode";
import {
  getCustomSetting,
  getEnableTransform,
  getEntry,
  getTransKey,
} from "./config";
import { TQueryData, sleep } from "./util";
import { assignFileData, getFileData, setAutoChange } from "./fileData";
import { LOCALESPATHS } from "./enum";
import fs = require("fs");

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
const writeFile = async (transKey: string, selectText: string) => {
  const settings = getCustomSetting<string[]>(LOCALESPATHS);
  const entry = getEntry();
  const filePath = Uri.joinPath(
    Uri.file(workspace.workspaceFolders![0].uri.fsPath),
    ...settings[0].split("/"),
    entry
  );
  const file = await workspace.fs.readFile(filePath);
  const lastFile = file.toString().replace(
    /\};/,
    `  ${transKey}: '${selectText}',
};`
  );
  try {
    setAutoChange(true);
    fs.writeFileSync(filePath.fsPath, lastFile, "utf-8");
    assignFileData({
      [transKey]: selectText,
    });
    await sleep(300);
    setAutoChange(false);
  } catch (error) {
    setAutoChange(false);
  }
};

export const handleAutoWrite = async (
  selectText: string
): Promise<boolean | TQueryData> => {
  if (getEnableTransform()) {
    const transKey = getTransKeyMax();
    await writeFile(transKey, selectText);
    return [{ path: transKey, value: selectText }];
  }

  window.showWarningMessage(`未搜索到${selectText}的相关信息`);
  return false;
};
