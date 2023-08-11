// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

function searchFilesWithText(searchText: any) {
  vscode.workspace
    .findFiles("**/*", "") // Search in all files of the workspace
    .then((files) => {
      const matchingFiles: any[] = [];
      const promises = files.map((uri) => {
        return vscode.workspace.openTextDocument(uri).then((document) => {
          const content = document.getText();
          if (content.includes(searchText)) {
            matchingFiles.push({
              fileName: vscode.workspace.asRelativePath(uri),
              fullPath: uri.fsPath,
              matchLocation: content.indexOf(searchText), // You can customize the match location details as needed
            });
          }
        });
      });

      return Promise.all(promises).then(() => matchingFiles);
    })
    .then((matchingFiles) => {
      if (matchingFiles.length > 0) {
        // Do something with the matchingFiles array (e.g., display it in an output channel)
        console.log(matchingFiles);
      } else {
        console.log("No files found with the specified search text.");
      }
    });
}

function getCustomSetting() {
  // 获取插件的配置
  const config = vscode.workspace.getConfiguration("");

  // 读取配置项
  return config.get("i18n-ally.localesPaths");
}

function getLocalesFolderContent() {
  const folderPath = vscode.Uri.joinPath(
    vscode.Uri.file(vscode.workspace.workspaceFolders![0].uri.fsPath),
    "src",
    "locales"
  );

  vscode.workspace.fs.readDirectory(folderPath).then((files) => {
    console.log("Files and folders in src/locales/:", files);
  });
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log("年轻人，你想从我这搜索什么？");

  const settings = getCustomSetting();
  console.log(settings);
  getLocalesFolderContent();

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "search-i18n.searchi18n",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      const quickPick = vscode.window.createInputBox();
      let value = "";
      quickPick.onDidChangeValue((e) => {
        value = e;
      });
      quickPick.onDidAccept(() => {
        console.log(value, "confirm");
        searchFilesWithText(value);
      });
      quickPick.show();
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

