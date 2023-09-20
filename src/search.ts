import { RelativePattern, Uri, commands, workspace } from "vscode";
import { getFileData } from "./fileData";
import { queryData } from "./util";

export const searchCommond = async (
  selectText: string,
  filesToExclude?: string
) => {
  await commands.executeCommand(
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

export async function searchFilesWithText(
  searchText: string,
  excludePath: string,
  readConfig: string
) {
  const fileData = getFileData();
  const i18Datas = queryData(fileData, searchText);
  if (!i18Datas.length) {
    return;
  }

  const i18Keys = i18Datas.map((v) => v.path);
  return workspace
    .findFiles(
      `src/**/*.{${readConfig}}`,
      new RelativePattern("src", excludePath)
    ) // Search in all files of the workspace
    .then((files) => {
      const matchingFiles: {
        key: string;
        fileName: string;
        fullPath: string;
      }[] = [];
      const promises = files.map((uri) => {
        return workspace.openTextDocument(uri).then((document) => {
          const content = document.getText();
          i18Keys.forEach((key) => {
            if (new RegExp(`('|")${key}('|")`).test(content)) {
              matchingFiles.push({
                key,
                fileName: workspace.asRelativePath(uri),
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

const match = /\{.*\}/s;
export async function getLocalesFolderContent(
  path: string[],
  entry: string
): Promise<Record<string, any> | null> {
  const folderPath = Uri.joinPath(
    Uri.file(workspace.workspaceFolders![0].uri.fsPath),
    ...path
  );

  const files = await workspace.fs.readDirectory(folderPath);
  for (let item of files) {
    if (item[0] === entry) {
      try {
        const file = await workspace.fs.readFile(
          Uri.joinPath(folderPath, item[0])
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
