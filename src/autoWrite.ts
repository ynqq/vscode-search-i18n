import { Uri, window, workspace, commands } from "vscode";
import {
  getCustomSetting,
  getEnableTrans,
  getEnableTransform,
  getEntry,
  getTranFileConfig,
  getTransKey,
} from "./config";
import {
  TQueryData,
  getKeyIndex,
  getNowGitBranch,
  sleep,
  toHump,
} from "./util";
import { assignFileData, getFileData, setAutoChange } from "./fileData";
import { LOCALESPATHS } from "./enum";
import fs = require("fs");

// 格式化key
const transformKey = (index?: number) => {
  const key = getTransKey();
  const gitBranch = getNowGitBranch();
  return `${key}${gitBranch ? `_${gitBranch}` : ""}_${
    index === undefined ? "" : index
  }`;
};

// 获取自定义key 最大值 + 1
const getTransKeyMax = () => {
  const transKey = transformKey();
  const fileData = getFileData();
  const keys = Object.keys(fileData)
    .filter((v) => v.startsWith(transKey))
    .map((v) => Number(v.replace(transKey, "")))
    .sort((a, b) => a - b);

  if (keys.length) {
    return transformKey(keys.pop()! + 1);
  }
  return transformKey(0);
};

// 写入文件
const writeFile = async (
  transKey: string,
  selectText: string,
  entry: string,
  assign?: boolean
) => {
  const settings = getCustomSetting<string[]>(LOCALESPATHS);
  const filePath = Uri.joinPath(
    Uri.file(workspace.workspaceFolders![0].uri.fsPath),
    ...settings[0].split("/"),
    entry
  );
  const file = await workspace.fs.readFile(filePath);
  const jsonReg = /(\n)*\}(\n*)$/;
  const jsReg = /\};/;
  const fileString = file.toString();
  const lastFile = jsReg.test(fileString)
    ? fileString.replace(
        jsReg,
        `  ${transKey}: '${selectText}',
};`
      )
    : jsonReg.test(fileString)
    ? fileString.replace(jsonReg, ``) +
      `,
  "${transKey}": "${selectText}"
}
`
    : false;
  if (!lastFile) {
    return;
  }

  try {
    setAutoChange(true);
    fs.writeFileSync(filePath.fsPath, lastFile, "utf-8");
    assign &&
      assignFileData({
        [transKey]: selectText,
      });

    await sleep(300);
    setAutoChange(false);
  } catch (error) {
    window.showErrorMessage(`自动写入出错,${[transKey, selectText, entry]}`);
    setAutoChange(false);
  }
};

export const handleAutoWrite = async (
  selectText: string,
  useEnKey: boolean
): Promise<boolean | TQueryData> => {
  if (getEnableTransform()) {
    let transKey: string = "";
    const enableTrans = getEnableTrans();
    const entry = getEntry();
    if (enableTrans) {
      // 开启翻译
      const config = getTranFileConfig();
      const keys = Object.keys(config);
      let enVal = "";
      if (useEnKey) {
        try {
          const { toStr }: { toStr: string } = await commands.executeCommand(
            "trans-lang.getValue",
            {
              text: selectText,
              to: "en",
            }
          );
          enVal = toStr;
          transKey = toHump(toStr);
          // 判断key是否已存在 如果存在下标+1
          const index = getKeyIndex(transKey);
          if (index) {
            transKey = `${transKey}_${index}`;
          }
        } catch (error) {}
      } else {
        transKey = getTransKeyMax();
      }
      await writeFile(transKey, selectText, entry, true);
      try {
        for (const key of keys) {
          const transResult: {
            str: string;
            toStr: string;
            to: "jp" | "en";
          } =
            key === "en" && enVal
              ? {
                  str: selectText,
                  toStr: enVal,
                  to: "en",
                }
              : await commands.executeCommand("trans-lang.getValue", {
                  text: selectText,
                  to: key,
                });
          await writeFile(
            transKey,
            transResult.toStr,
            config[key as keyof typeof config]!
          );
        }
      } catch (error) {
        window.showErrorMessage(`翻译出错: ${error}`);
      }
    } else {
      transKey = getTransKeyMax();
    }
    return [{ path: transKey, value: selectText }];
  }

  window.showWarningMessage(`未搜索到${selectText}的相关信息`);
  return false;
};
