import * as vscode from "vscode";
import * as fs from "fs";
import {
  getCustomSetting,
  getRealZHFilePath,
  setRealZHFilePath,
} from "./config";
import { setFileData, watchFile } from "./fileData";
import { LOCALESPATHS } from "./enum";
import { searchDisposable } from "./commands/search";
import { hoverDisposable } from "./commands/hover";
import { replaceDisposable } from "./commands/replace";

export async function activate(context: vscode.ExtensionContext) {
  const settings = getCustomSetting<string[]>(LOCALESPATHS);
  if (!settings) {
    vscode.window.showErrorMessage(
      `未查到i18n配置目录,请检查settings.json中[i18n-ally.localesPaths]配置项`
    );
    return;
  }
  setRealZHFilePath();
  setFileData();
  watchFile();

  // 搜索
  context.subscriptions.push(searchDisposable);
  // 悬浮提示
  context.subscriptions.push(hoverDisposable);
  // 替换
  context.subscriptions.push(replaceDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
  const realZHFilePath = getRealZHFilePath();
  if (realZHFilePath) {
    fs.unwatchFile(realZHFilePath);
  }
}

