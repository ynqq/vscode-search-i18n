import { commands, window, workspace } from "vscode";
import { getI18nPaths, getReadConfig } from "../config";
import { searchCommond, searchFilesWithText } from "../search";
import { allCommonds } from "../enum";

export const searchDisposable = commands.registerCommand(
  allCommonds.search,
  async () => {
    const settings = getI18nPaths();
    const readConfig = getReadConfig();

    window.showQuickPick([""], {});
    const quickPick = window.createInputBox();
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
          await workspace
            .openTextDocument(queryDatas[0].fullPath)
            .then(window.showTextDocument);
        }
        const keys = Array.from(new Set(queryDatas.map((v) => v.key)));
        searchCommond(keys.map((v) => `('|")${v}('|")`).join("|"), settings[0]);
      } else {
        window.showInformationMessage(`未查到${value}的相关信息`);
      }
    });
    quickPick.show();
  }
);
