import * as vscode from "vscode";
export class SearchResultProvider
  implements vscode.TreeDataProvider<SearchResultItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    SearchResultItem | undefined
  > = new vscode.EventEmitter<SearchResultItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<SearchResultItem | undefined> =
    this._onDidChangeTreeData.event;

  // Implement the getChildren method to return search results
  getChildren(element?: SearchResultItem): Thenable<SearchResultItem[]> {
    // Return the search results as an array of SearchResultItem objects
    // You need to populate this array with your actual search results
    return Promise.resolve([]);
  }

  // Implement the getParent method if your search results are hierarchical
  getParent(
    element: SearchResultItem
  ): vscode.ProviderResult<SearchResultItem> {
    return null;
  }

  // Implement the getTreeItem method to provide the tree item representation for a result
  getTreeItem(element: SearchResultItem): vscode.TreeItem {
    return element;
  }

  // Call this method to refresh the search results
  //   refresh(): void {
  //     this._onDidChangeTreeData.fire();
  //   }
}

class SearchResultItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly filePath: string,
    public readonly lineNumber: number
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `${this.label} (${this.filePath}:${this.lineNumber})`;
    this.command = {
      command: "extension.openFile",
      title: "Open File",
      arguments: [this.filePath, this.lineNumber],
    };
  }
}
