import * as vscode from "vscode";
import * as puppeteer from "puppeteer";
import * as fs from "fs-extra";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  console.log("Code Snippet Generator is now active!");

  let disposable = vscode.commands.registerCommand(
    "code-snippet-generator.generateSnippet",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor found");
        return;
      }

      const selection = editor.selection;
      const text = editor.document.getText(selection);

      if (!text.trim()) {
        vscode.window.showErrorMessage("Please select some code first");
        return;
      }

      try {
        await generateSnippetImage(text, editor.document.languageId);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to generate snippet: ${error}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

async function generateSnippetImage(
  code: string,
  language: string
): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    throw new Error("No workspace folder found");
  }

  const outputDir = path.join(workspaceFolder.uri.fsPath, "snippets");
  await fs.ensureDir(outputDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `snippet-${timestamp}.png`;
  const outputPath = path.join(outputDir, filename);

  // Create HTML with syntax highlighting
  const html = createHTML(code, language);

  // Launch browser and generate image
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html);

    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get the element and take screenshot
    const element = await page.$(".code-container");
    if (!element) {
      throw new Error("Could not find code container element");
    }

    await element.screenshot({
      path: outputPath,
      type: "png",
    });

    vscode.window
      .showInformationMessage(
        `Snippet generated successfully: ${filename}`,
        "Open Folder"
      )
      .then((selection) => {
        if (selection === "Open Folder") {
          vscode.commands.executeCommand(
            "revealInExplorer",
            vscode.Uri.file(outputPath)
          );
        }
      });
  } finally {
    await browser.close();
  }
}

function createHTML(code: string, language: string): string {
  // Escape HTML entities
  const escapedCode = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
            background: #1e1e1e;
            color: #d4d4d4;
        }
        
        .code-container {
            background: #2d2d30;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            border: 1px solid #3e3e42;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #3e3e42;
        }
        
        .language-badge {
            background: #007acc;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
        }
        
        .dots {
            display: flex;
            gap: 6px;
        }
        
        .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        
        .dot.red { background: #ff5f56; }
        .dot.yellow { background: #ffbd2e; }
        .dot.green { background: #27ca3f; }
        
        .code-block {
            background: #1e1e1e;
            border-radius: 6px;
            padding: 16px;
            overflow-x: auto;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre;
            color: #d4d4d4;
        }
        
        /* Syntax highlighting colors */
        .keyword { color: #569cd6; }
        .string { color: #ce9178; }
        .comment { color: #6a9955; }
        .number { color: #b5cea8; }
        .function { color: #dcdcaa; }
        .class { color: #4ec9b0; }
        .operator { color: #d4d4d4; }
        .punctuation { color: #d4d4d4; }
    </style>
</head>
<body>
    <div class="code-container">
        <div class="header">
            <div class="dots">
                <div class="dot red"></div>
                <div class="dot yellow"></div>
                <div class="dot green"></div>
            </div>
            <div class="language-badge">${language}</div>
        </div>
        <div class="code-block">${escapedCode}</div>
    </div>
</body>
</html>
    `;
}

export function deactivate() {}
