import { extensions, Position, Range, TextDocument, window } from "vscode";
import { getConfigKeys } from "./fileData";

function isObject(obj: any) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}
function isString(str: any) {
  return typeof str === "string";
}

export type TQueryData = {
  value: string;
  path: string;
}[];

/**
 * 从语言包中查询对应的key
 * @param data 语言包数据
 * @param val 要查询的值
 * @param prevKey 上一个key
 * @returns result {@link TQueryData} 所有复核条件的数据
 * @author ynqq
 */
export function queryData(
  data: Record<string, any>,
  val: string,
  prevKey?: string
) {
  const result: TQueryData = [];
  prevKey = prevKey ? `${prevKey}.` : "";
  for (let i in data) {
    if (isObject(data[i])) {
      result.push(...queryData(data[i], val, `${prevKey}${i}`));
    } else if (isString(data[i])) {
      if (data[i] === val) {
        result.push({
          path: `${prevKey}${i}`,
          value: data[i],
        });
      }
    } else {
      throw new Error("错误的数据类型");
    }
  }
  return result;
}

export function getAllKeyPathsDFS(obj: Record<string, any>) {
  let paths = [];
  let stack = [{ current: obj, path: "" }];

  while (stack.length > 0) {
    let { current, path } = stack.pop()!;
    for (let key in current) {
      let newPath = path ? `${path}.${key}` : key; // 拼接路径
      paths.push(newPath);
      if (typeof current[key] === "object" && current[key] !== null) {
        stack.push({ current: current[key], path: newPath });
      }
    }
  }

  return paths;
}
/**
 * 判断选中的文本前后是否有引号，如果有则返回带有引号的整个字符串，如果没有则返回空字符串。
 * @param document 当前文档
 * @param position 当前光标位置
 * @param selectText 选中的文本
 * @returns selectTextAndSymbol 带有引号的整个字符串
 * @author ynqq
 */
export const querySelectTextAndSymbol = (
  document: TextDocument,
  position: Position,
  selectText: string
) => {
  const lineText = document.getText(document.lineAt(position.line).range);
  const selectReg = new RegExp(`('|")${selectText}('|")`, "g");
  const matchList = lineText.matchAll(selectReg);
  for (const match of matchList) {
    const startMatchIndex = match.index!;
    const endMatchIndex = startMatchIndex + match[0].length;
    if (
      position.character >= startMatchIndex &&
      position.character <= endMatchIndex
    ) {
      // 当前光标在选中的文本中
      const startIndex = match.index!;
      const endIndex = startIndex + selectText.length;
      const selectTextAndSymbol = document.getText(
        new Range(
          new Position(position.line, Math.max(startIndex, 0)),
          new Position(position.line, endIndex + 2)
        )
      );
      return selectTextAndSymbol;
    }
  }
  return "";
};

/**
 * 校验是否是带有引号的字符串
 * @param selectTextAndSymbol  带有引号的字符串
 * @returns  boolean 是否是带有引号的字符串
 */
export const checkHasSymbol = (selectTextAndSymbol: string) => {
  return /(('|").+('|"))/.test(selectTextAndSymbol);
};

export const checkIsChinese = (selectText: string) => {
  return /[\u4e00-\u9fa5]/.test(selectText);
};
// 校验是注释
export const checkIsComment = (lineText: string) => {
  return (
    checkIsHtmlComment(lineText) || /(\/\/)|(\/\*)|(^\s+\*\s+)/.test(lineText)
  );
};
// 校验是否是html注释
export const checkIsHtmlComment = (lineText: string) => {
  return /<!--/.test(lineText);
};
// 校验当前行是否是注释
export const checkLineIsComment = () => {
  const editor = window.activeTextEditor;
  if (!editor) {
    return false;
  }
  const lineText = editor.document.getText(
    editor.document.lineAt(editor.selection.active.line).range
  );
  return checkIsComment(lineText);
};

export const sleep = (time: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

export const getNowGitBranch = (): string => {
  const gitExtension = extensions.getExtension("vscode.git")?.exports;
  if (!gitExtension) {
    return "";
  }
  const api = gitExtension.getAPI(1);
  const repo = api.repositories?.[0]; // 获取所有 Git 仓库
  if (repo) {
    return repo.state.HEAD?.name || "";
  }
  return "";
};

export const toHump = (str: string) => {
  const strList = str.replace(/[^(a-zA-Z0-9\s)]/g, "").split(" ");
  let [f, ...other] = strList;
  other = other.map((item) => {
    const [s, ...o] = item;
    return `${s.toLocaleUpperCase()}${o.join("")}`;
  });
  return `${f.toLocaleLowerCase()}${other.join("")}`;
};

/**
 * 获取相同key名的最大下标+1
 * @param val
 * @returns
 */
export const getKeyIndex = (val: string) => {
  const reg = new RegExp(`^${val}(_[0-9])*$`);
  const filterKeys = getConfigKeys().filter((v) => reg.test(v));
  if (filterKeys.length > 0) {
    return (
      (filterKeys
        .map((v) => +v.replace(new RegExp(`^${val}_`), "") || 0)
        .sort()
        .pop() || 0) + 1
    );
  }
  return null;
};
