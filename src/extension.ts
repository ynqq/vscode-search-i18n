// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { queryData } from "./util";
import * as path from "path";
import * as fs from "fs";

const match = /\{.*\}/s;
let fileData: Record<string, any>;
let realZHFilePath = "";

async function searchFilesWithText(
  searchText: string,
  excludePath: string,
  readConfig: string
) {
  const i18Datas = queryData(fileData, searchText);
  if (!i18Datas.length) {
    return;
  }

  const i18Keys = i18Datas.map((v) => v.path);
  return vscode.workspace
    .findFiles(
      `src/**/*.{${readConfig}}`,
      new vscode.RelativePattern("src", excludePath)
    ) // Search in all files of the workspace
    .then((files) => {
      const matchingFiles: {
        key: string;
        fileName: string;
        fullPath: string;
      }[] = [];
      const promises = files.map((uri) => {
        return vscode.workspace.openTextDocument(uri).then((document) => {
          const content = document.getText();
          i18Keys.forEach((key) => {
            if (new RegExp(`('|")${key}('|")`).test(content)) {
              matchingFiles.push({
                key,
                fileName: vscode.workspace.asRelativePath(uri),
                fullPath: uri.fsPath,
              });
            }
          });
        });
      });

      return Promise.all(promises).then(() => matchingFiles);
    })
    .then((matchingFiles) => {
      return matchingFiles;
    });
}

function getCustomSetting<T>(configName: string): T {
  try {
    // 获取插件的配置
    const config = vscode.workspace.getConfiguration("");
    // 读取配置项
    return config.get(configName) as T;
  } catch (error) {
    return "" as T;
  }
}

async function getLocalesFolderContent(
  path: string[],
  entry: string
): Promise<Record<string, any> | null> {
  const folderPath = vscode.Uri.joinPath(
    vscode.Uri.file(vscode.workspace.workspaceFolders![0].uri.fsPath),
    ...path
  );

  const files = await vscode.workspace.fs.readDirectory(folderPath);
  for (let item of files) {
    if (item[0] === entry) {
      try {
        const file = await vscode.workspace.fs.readFile(
          vscode.Uri.joinPath(folderPath, item[0])
        );
        const jsonData = eval(
          "(" + (file.toString().match(match)?.[0] || "") + ")"
        );
        return jsonData;
      } catch (error) {
        console.log(error, "readFileError");
        return null;
      }
    }
  }
  return null;
}

const searchCommond = async (selectText: string, filesToExclude?: string) => {
  await vscode.commands.executeCommand(
    "workbench.action.findInFiles",
    {
      query: selectText,
      isRegex: true,
      triggerSearch: true,
      isCaseSensitive: true,
      matchWholeWord: true,
      preserveCase: true,
      excludeSettingAndIgnoreFiles: true,
      showIncludesExcludes: true,
      filesToExclude: `**/${filesToExclude}/**/*`,
      filesToInclude: `./src`,
    },
    true
  );
};

export async function activate(context: vscode.ExtensionContext) {
  const settings = getCustomSetting<string[]>("i18n-ally.localesPaths");
  if (!settings) {
    vscode.window.showErrorMessage(
      `未查到i18n配置目录,请检查settings.json中[i18n-ally.localesPaths]配置项`
    );
  }
  const entry = getCustomSetting<string>("search-i18n.entry") || "zh.js";
  const readConfig =
    getCustomSetting<string>("search-i18n.incldesFile") || "ts,tsx,vue";
  const folderPath = vscode.Uri.joinPath(
    vscode.Uri.file(vscode.workspace.workspaceFolders![0].uri.fsPath),
    ...settings[0].split("/")
  );
  if (!fileData) {
    const configFile = await getLocalesFolderContent(
      settings[0].split("/"),
      entry
    );
    if (!configFile) {
      vscode.window.showErrorMessage(
        "未查到配置的入口文件：search-i18n.entry。默认为：zh.js"
      );
      return;
    }
    fileData = configFile;
  }

  realZHFilePath = path.join(folderPath.fsPath, entry);
  fs.watchFile(realZHFilePath, async (eventType: fs.Stats) => {
    const configFile = await getLocalesFolderContent(
      settings[0].split("/"),
      entry
    );
    if (!configFile) {
      vscode.window.showErrorMessage(
        "未查到配置的入口文件：search-i18n.entry。默认为：zh.js"
      );
      return;
    }
    fileData = configFile;
  });
  vscode.workspace.onDidCloseTextDocument((e) => {});
  const disposable = vscode.commands.registerCommand(
    "search-i18n.searchi18n",
    async () => {
      if (!settings) {
        return;
      }

      vscode.window.showQuickPick([""], {});
      const quickPick = vscode.window.createInputBox();
      quickPick.title = "来吧，年轻人，搜你所想的i18n吧！";
      let value = "";
      quickPick.onDidChangeValue((e) => {
        value = e;
      });
      quickPick.onDidAccept(async () => {
        const queryDatas = await searchFilesWithText(
          value,
          settings[0],
          readConfig
        );

        if (queryDatas && queryDatas.length) {
          if (queryDatas.length === 1) {
            await vscode.workspace
              .openTextDocument(queryDatas[0].fullPath)
              .then(vscode.window.showTextDocument);
          }
          const keys = Array.from(new Set(queryDatas.map((v) => v.key)));
          searchCommond(
            keys.map((v) => `('|")${v}('|")`).join("|"),
            settings[0]
          );
        } else {
          vscode.window.showInformationMessage(`未查到${value}的相关信息`);
        }
      });
      quickPick.show();
    }
  );

  context.subscriptions.push(disposable);

  const hoverDisposable = vscode.languages.registerHoverProvider("*", {
    provideHover(document, position) {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return undefined;
      }
      let selectText = editor.document.getText(editor.selection);
      if (selectText.trim() === "") {
        return undefined;
      }
      selectText = selectText.replace(/'|"/g, "");
      const word = document.getText(document.getWordRangeAtPosition(position));
      const isChinese =
        /[\u4e00-\u9fa5]/.test(selectText) && word === selectText;
      if (isChinese) {
        const i18Datas = queryData(fileData, selectText);
        if (i18Datas.length) {
          const hoverText = [`|key|替换vue|替换js|\n|:---:|:---:|:---:|`];
          i18Datas.forEach(({ path }) => {
            hoverText.push(
              `|${path}|[✏️](command:search-i18n.replaceText?${encodeURIComponent(
                JSON.stringify({ path, isVue: true })
              )} "替换")|[✏️](command:search-i18n.replaceText?${encodeURIComponent(
                JSON.stringify({ path, isJs: true })
              )} "替换")|`
            );
          });
          const hoverBox = new vscode.MarkdownString(hoverText.join("\n"));
          hoverBox.isTrusted = true;
          const hoverRange = new vscode.Range(position, position);
          return new vscode.Hover(hoverBox, hoverRange);
        } else {
          return new vscode.Hover(
            new vscode.MarkdownString(`未搜索到${selectText}的相关信息`)
          );
        }
      }
      return undefined;
    },
  });
  context.subscriptions.push(hoverDisposable);

  const replaceDisposable = vscode.commands.registerCommand(
    "search-i18n.replaceText",
    ({ path, isVue, isJs }) => {
      // 替换选中文本
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      editor.edit((editBuilder) => {
        if (isVue) {
          editBuilder.replace(editor.selection, `{{ $t('${path}') }}`);
        } else if (isJs) {
          editBuilder.replace(editor.selection, `$t('${path}')`);
        }
      });
    }
  );
  context.subscriptions.push(replaceDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
  if (realZHFilePath) {
    fs.unwatchFile(realZHFilePath);
  }
}

