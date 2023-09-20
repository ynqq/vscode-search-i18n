import { Hover, MarkdownString, Range, languages, window } from "vscode";
import { getFileData } from "../fileData";
import {
  checkHasSymbol,
  checkIsChinese,
  checkLineIsComment,
  queryData,
  querySelectTextAndSymbol,
} from "../util";
import { allCommonds } from "../enum";

export const hoverDisposable = languages.registerHoverProvider("*", {
  provideHover(document, position) {
    if (checkLineIsComment()) {
      return;
    }
    const editor = window.activeTextEditor;
    if (!editor) {
      return undefined;
    }
    let selectText = editor.document.getText(editor.selection);
    if (selectText.trim() === "") {
      return undefined;
    }
    selectText = selectText.replace(/'|"/g, "");
    const word = document.getText(document.getWordRangeAtPosition(position));
    const canNext = checkIsChinese(selectText) && word === selectText;
    if (canNext) {
      const fileData = getFileData();
      const i18Datas = queryData(fileData, selectText);
      if (i18Datas.length) {
        let selectTextAndSymbol: boolean | string = "";
        if (!/'|"/.test(selectText)) {
          selectTextAndSymbol = querySelectTextAndSymbol(
            document,
            position,
            selectText
          );
        }
        const hasSymbol = checkHasSymbol(selectTextAndSymbol);
        const hoverText = [`|key|替换vue|替换js|\n|:---:|:---:|:---:|`];
        i18Datas.forEach(({ path }) => {
          hoverText.push(
            `|${path}|[✏️](command:${allCommonds.replace}?${encodeURIComponent(
              JSON.stringify({ path, isVue: true, hasSymbol })
            )} "替换")|[✏️](command:${allCommonds.replace}?${encodeURIComponent(
              JSON.stringify({ path, isJs: true, hasSymbol })
            )} "替换")|`
          );
        });
        const hoverBox = new MarkdownString(hoverText.join("\n"));
        hoverBox.isTrusted = true;
        const hoverRange = new Range(position, position);
        return new Hover(hoverBox, hoverRange);
      } else {
        return new Hover(new MarkdownString(`未搜索到${selectText}的相关信息`));
      }
    }
    return undefined;
  },
});
