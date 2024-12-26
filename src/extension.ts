// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated

    async function installExtension(extensionId: string, disable: boolean = false, messages: string[]) {
        try {
            await vscode.commands.executeCommand('workbench.extensions.installExtension', extensionId);
            if (disable) {
                try {
                    // Enable/Disable extension
                    // await vscode.commands.executeCommand( 'workbench.extensions.enableExtension', extensionId );
                    await vscode.commands.executeCommand('workbench.extensions.disableExtension', extensionId);
                    // vscode.window.showInformationMessage(`Extension ${extensionId} installed successfully`);
                    messages.push(`Extension ${extensionId} installed successfully`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to disable extension: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    messages.push(`!!! Failed to disable extension ${extensionId}.`);
                }
            } else {
                // vscode.window.showInformationMessage(`Extension ${extensionId} installed successfully`);
                messages.push(`Extension ${extensionId} installed successfully`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to install extension: ${error instanceof Error ? error.message : 'Unknown error'}`);
            messages.push(`!!! Failed to install extension ${extensionId}`);
        }
    }
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand('extension-export.exportExtentions', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        // vscode.window.showInformationMessage('Hello World from extension_export!');
        const allExtensions = vscode.extensions.all;
        // console.log(allExtensions, 'all');
        const userExtensions = allExtensions.filter((ext) => !ext.id.startsWith('vscode.'));
        // console.log(userExtensions, 'user');
        // userExtensions.forEach(ext => {
        //     console.log(`name: ${ext.packageJSON.name}, id: ${ext.id}, active: ${ext.isActive}`);
        // });
        const extensions = userExtensions.map(ext => { return { name: ext.packageJSON.name, id: ext.id, isActive: ext.isActive } });

        vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('vscode-extensions.json'),
            filters: {
                'Text files': ['json']
            }
        }).then(fileUri => {
            if (fileUri) {
                fs.writeFileSync(fileUri.fsPath, JSON.stringify(extensions));
                vscode.window.showInformationMessage('Extensions list exported successfully!');
            }
        });
    });


    const disposableImport = vscode.commands.registerCommand('extension-export.importExtensions', async () => {
        try {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'Text files': ['json'],
                    'All files': ['*']
                }
            });
            async function showQuickSummary(items: string[]) {
                // const items = [
                //     'Total Files: 25',
                //     'Processed: 20',
                //     'Errors: 0'
                // ];

                await vscode.window.showQuickPick(items, {
                    placeHolder: 'Summary Results',
                    canPickMany: false
                });
            }
            const messages: string[] = [];

            if (fileUri && fileUri[0]) {
                const content = await vscode.workspace.fs.readFile(fileUri[0]);
                const text = Buffer.from(content).toString('utf8');
                // console.log(text);
                const extensions = JSON.parse(text);
                if (!extensions || !Array.isArray(extensions) || extensions.length === 0) {
                    vscode.window.showInformationMessage('No available extensions');
                } else {
                    // vscode.window.showInformationMessage(`Find ${extensions.length} extensions`);
                    messages.push(`Find ${extensions.length} extensions:`);
                    const allExtensions = vscode.extensions.all.filter((ext) => !ext.id.startsWith('vscode.')).map(i => i.id);
                    extensions.forEach(ext => {
                        if (!allExtensions.includes(ext.id)) {
                            installExtension(ext.id, !ext.isActive, messages);
                        } else {
                            // vscode.window.showInformationMessage(`Extension ${ext.name}(${ext.id}) already installed`);
                            messages.push(`Extension ${ext.name}(${ext.id}) already installed`);
                        }
                    })
                }
            }
            if (messages.length > 3) {
                showQuickSummary(messages);
            }

        } catch (err) {
            vscode.window.showInformationMessage('Failed to read extension file! JSON file needed!');
        } finally {

        }


    });

    context.subscriptions.push(disposable, disposableImport);
}

// This method is called when your extension is deactivated
export function deactivate() { }
