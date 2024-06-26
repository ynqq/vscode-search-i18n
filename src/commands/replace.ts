import { Selection, commands, window } from "vscode";
import { allCommonds } from "../enum";
import {
  TQueryData,
  checkHasSymbol,
  checkIsChinese,
  checkLineIsComment,
  queryData,
  querySelectTextAndSymbol,
} from "../util";
import { getFileData } from "../fileData";
import { handleAutoWrite } from "../autoWrite";

interface ReplaceParams {
  path: string;
  isVue: boolean;
  isJs: boolean;
  hasSymbol: boolean;
}

const replaceSelectText = ({ path, isVue, isJs, hasSymbol }: ReplaceParams) => {
  // 替换选中文本
  const editor = window.activeTextEditor;
  if (!editor) {
    return;
  }
  editor.edit((editBuilder) => {
    const position = editor.selection;
    let newPosition: Selection | null = null;

    if (hasSymbol) {
      const startPosition = position.start.with(
        position.start.line,
        position.start.character - 1
      );
      const endPosition = position.end.with(
        position.end.line,
        position.end.character + 1
      );

      newPosition = position.with({
        start: startPosition,
        end: endPosition,
      }) as any;
      if (newPosition) {
        newPosition.active = position.active;
        newPosition.anchor = position.anchor;
        newPosition.isReversed = position.isReversed;
      }
    }
    newPosition = newPosition || position;
    if (isVue) {
      editBuilder.replace(newPosition, `{{ $t('${path}') }}`);
    } else if (isJs) {
      editBuilder.replace(newPosition, `$t('${path}')`);
    }
  });
};

export const replaceDisposable = commands.registerCommand(
  allCommonds.replace,
  (options) => {
    replaceSelectText(options);
  }
);

export const replaceVueDisposable = commands.registerCommand(
  allCommonds.replaceVue,
  async () => {
    if (checkLineIsComment()) {
      return;
    }
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }
    const selectText = editor.document.getText(editor.selection);
    if (!selectText || !checkIsChinese(selectText)) {
      return;
    }
    const fileData = getFileData();
    let i18Datas = queryData(fileData, selectText);
    if (!i18Datas.length) {
      const autoWrite = await handleAutoWrite(selectText);
      if (autoWrite === false) {
        return;
      } else {
        i18Datas = autoWrite as TQueryData;
      }
    }
    const selectTextAndSymbol = querySelectTextAndSymbol(
      editor.document,
      editor.selection.active,
      selectText
    );
    replaceSelectText({
      path: i18Datas[0].path,
      isVue: true,
      isJs: false,
      hasSymbol: checkHasSymbol(selectTextAndSymbol),
    });
  }
);

export const replaceJsDisposable = commands.registerCommand(
  allCommonds.replaceJs,
  async () => {
    if (checkLineIsComment()) {
      return;
    }
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }
    const selectText = editor.document.getText(editor.selection);
    if (!selectText || !checkIsChinese(selectText)) {
      return;
    }
    const fileData = getFileData();
    let i18Datas = queryData(fileData, selectText);
    if (!i18Datas.length) {
      const autoWrite = await handleAutoWrite(selectText);
      if (autoWrite === false) {
        return;
      } else {
        i18Datas = autoWrite as TQueryData;
      }
    }
    const selectTextAndSymbol = querySelectTextAndSymbol(
      editor.document,
      editor.selection.active,
      selectText
    );
    replaceSelectText({
      path: i18Datas[0].path,
      isVue: false,
      isJs: true,
      hasSymbol: checkHasSymbol(selectTextAndSymbol),
    });
  }
);
