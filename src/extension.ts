import * as vscode from "vscode";
import * as puppeteer from "puppeteer";
import * as fs from "fs-extra";
import * as path from "path";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import { createHTMLWithFilename } from "./html-generator";

export function activate(context: vscode.ExtensionContext) {
  console.log("Cirneco is now active!");

  let disposable = vscode.commands.registerCommand(
    "cirneco.generateSnippet",
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
        // Show loading notification
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: "Generating snippet...",
          cancellable: false
        }, async (progress) => {
          progress.report({ increment: 0 });
          await generateSnippetImage(text, editor.document.languageId);
          progress.report({ increment: 100 });
        });
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to generate snippet: ${error}`);
      }
    }
  );

  context.subscriptions.push(disposable);

  // Command with theme selection
  let disposableWithTheme = vscode.commands.registerCommand(
    "cirneco.generateSnippetWithTheme",
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

      // Show theme selection
      const builtInThemes = getAvailableThemes();
      
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      let allThemes = { ...builtInThemes };
      
      // Add custom themes from user config
      if (workspaceFolder) {
        const configPath = path.join(workspaceFolder.uri.fsPath, 'cirneco.json');
        try {
          if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configContent);
            if (config.customThemes) {
              Object.assign(allThemes, config.customThemes);
            }
          }
        } catch (error) {
          console.error('Error loading custom themes:', error);
        }
      }
      
      const themeNames = Object.keys(allThemes);
      
      const selectedTheme = await vscode.window.showQuickPick(themeNames, {
        placeHolder: "Select a theme for your snippet"
      });

      if (!selectedTheme) {
        return; // User cancelled
      }

      try {
        // Get filename from current document
        const fullPath = editor.document.fileName;
        const filename = fullPath.split('/').pop() || fullPath.split('\\').pop() || 'untitled';
        console.log('Full path:', fullPath);
        console.log('Extracted filename:', filename);
        
        // Show loading notification
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: `Generating snippet with ${selectedTheme} theme...`,
          cancellable: false
        }, async (progress) => {
          progress.report({ increment: 0 });
          await generateSnippetImageWithTheme(text, editor.document.languageId, selectedTheme, filename);
          progress.report({ increment: 100 });
        });
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to generate snippet: ${error}`);
      }
    }
  );

  context.subscriptions.push(disposableWithTheme);
}

async function generateSnippetImageWithTheme(
  code: string,
  language: string,
  themeName: string,
  documentFilename?: string
): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    throw new Error("No workspace folder found");
  }

  const outputDir = path.join(workspaceFolder.uri.fsPath, ".cirneco");
  await fs.ensureDir(outputDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputFilename = `snippet-${themeName}-${timestamp}.png`;
  const outputPath = path.join(outputDir, outputFilename);

  // Get theme
  const builtInThemes = getAvailableThemes();
  let allThemes = { ...builtInThemes };
  
  // Add custom themes from user config
  if (workspaceFolder) {
    const configPath = path.join(workspaceFolder.uri.fsPath, 'cirneco.json');
    try {
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        if (config.customThemes) {
          Object.assign(allThemes, config.customThemes);
        }
      }
    } catch (error) {
      console.error('Error loading custom themes:', error);
    }
  }
  
  const theme = allThemes[themeName] || getDefaultTheme();
  
      // Create HTML with specific theme and filename
    console.log('Document filename:', documentFilename);
    const html = createHTMLWithFilename(code, language, theme, documentFilename);

    // Launch browser and generate image
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      
      // Set initial viewport for high resolution
      await page.setViewport({
        width: 900,
        height: 600,
        deviceScaleFactor: 2, // 2x for retina/high DPI
      });
      
      await page.setContent(html);

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the element and calculate proper dimensions
      const element = await page.$(".code-container");
      if (!element) {
        throw new Error("Could not find code container element");
      }

      // Get element dimensions
      const boundingBox = await element.boundingBox();
      if (!boundingBox) {
        throw new Error("Could not get element dimensions");
      }

      // Calculate proper height with padding
      const actualHeight = Math.ceil(boundingBox.height);
      const padding = 300; // Increase padding significantly
      const contentHeight = actualHeight + padding;
      
      console.log('Element height:', actualHeight);
      console.log('Content height with padding:', contentHeight);
      
      // Reload page with correct viewport to avoid clipping
      await page.setViewport({
        width: 900,
        height: contentHeight,
        deviceScaleFactor: 2,
      });
      
      // Reload content with new viewport
      await page.setContent(html);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Increase wait time

      // Wait for element to be visible and get it again
      await page.waitForSelector('.code-container', { visible: true });
      const visibleElement = await page.$(".code-container");
      if (!visibleElement) {
        throw new Error("Could not find code container element");
      }

      // Take screenshot of the element with proper background
      await visibleElement.screenshot({
        path: outputPath,
        type: "png",
        omitBackground: false
      });

    vscode.window
      .showInformationMessage(
        `Snippet generated successfully with ${themeName} theme: ${outputFilename}`,
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



async function generateSnippetImage(
  code: string,
  language: string
): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    throw new Error("No workspace folder found");
  }

  const outputDir = path.join(workspaceFolder.uri.fsPath, ".cirneco");
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
    
    // Set viewport for high resolution
    await page.setViewport({
      width: 900,
      height: 600,
      deviceScaleFactor: 2, // 2x for retina/high DPI
    });
    
    await page.setContent(html);

    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get the element and take screenshot
    const element = await page.$(".code-container");
    if (!element) {
      throw new Error("Could not find code container element");
    }

    // Get element dimensions and adjust viewport height
    const boundingBox = await element.boundingBox();
    if (!boundingBox) {
      throw new Error("Could not get element dimensions");
    }

    // Adjust viewport height to fit content with some padding
    const contentHeight = Math.ceil(boundingBox.height) + 100; // Add padding
    await page.setViewport({
      width: 900,
      height: contentHeight,
      deviceScaleFactor: 2,
    });

    await element.screenshot({
      path: outputPath,
      type: "png",
      omitBackground: false
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

interface Theme {
  name: string;
  description: string;
  colors: {
    background: string;
    container: string;
    codeBlock: string;
    text: string;
    border: string;
    badge: string;
  };
  syntax: {
    keyword: string;
    string: string;
    comment: string;
    number: string;
    function: string;
    class: string;
    operator: string;
    punctuation: string;
    variable: string;
    property: string;
  };
}

interface CirnecoConfig {
  defaultTheme?: string;
  customThemes?: { [key: string]: Theme };
}

function loadTheme(): Theme {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return getDefaultTheme();
  }

  const configPath = path.join(workspaceFolder.uri.fsPath, 'cirneco.json');
  
  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);
      
      // Get all available themes (built-in + custom)
      const allThemes = { ...getAvailableThemes() };
      
      // Add custom themes from user config
      if (config.customThemes) {
        Object.assign(allThemes, config.customThemes);
      }
      
      // Get default theme
      const defaultThemeName = config.defaultTheme || 'dracula';
      if (allThemes[defaultThemeName]) {
        return allThemes[defaultThemeName];
      }
    }
  } catch (error) {
    console.error('Error loading theme:', error);
  }
  
  return getDefaultTheme();
}

function getAvailableThemes(): { [key: string]: Theme } {
  const themes: { [key: string]: Theme } = {};
  
  try {
    // Load theme mappings from themes.json
    const themesPath = path.join(__dirname, 'themes.json');
    if (fs.existsSync(themesPath)) {
      const themesContent = fs.readFileSync(themesPath, 'utf8');
      const themeMappings = JSON.parse(themesContent);
      
      // Load each theme from its individual file
      for (const [themeKey, themePath] of Object.entries(themeMappings)) {
        try {
          const fullThemePath = path.join(__dirname, themePath as string);
          
          if (fs.existsSync(fullThemePath)) {
            const themeContent = fs.readFileSync(fullThemePath, 'utf8');
            const theme = JSON.parse(themeContent);
            themes[themeKey] = theme;
          }
        } catch (error) {
          console.error(`Error loading theme ${themeKey}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error loading themes.json:', error);
  }
  
  // Fallback to default theme if no themes loaded
  if (Object.keys(themes).length === 0) {
    themes["dark-mode"] = {
      name: "Dark Mode",
      description: "Tema escuro moderno e minimalista",
      colors: {
        background: "#1a1a1a",
        container: "#2d2d2d",
        codeBlock: "#1e1e1e",
        text: "#e6e6e6",
        border: "#404040",
        badge: "#007acc"
      },
      syntax: {
        keyword: "#569cd6",
        string: "#ce9178",
        comment: "#6a9955",
        number: "#b5cea8",
        function: "#dcdcaa",
        class: "#4ec9b0",
        operator: "#d4d4d4",
        punctuation: "#d4d4d4",
        variable: "#9cdcfe",
        property: "#9cdcfe"
      }
    };
  }
  
  return themes;
}

function getDefaultTheme(): Theme {
  return getAvailableThemes()["dark-mode"];
}

function createHTML(code: string, language: string): string {
  const theme = loadTheme();
  // Map VS Code language IDs to Prism language names
  const languageMap: { [key: string]: string } = {
    'javascript': 'javascript',
    'typescript': 'typescript',
    'python': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'csharp': 'csharp',
    'php': 'php',
    'ruby': 'ruby',
    'go': 'go',
    'rust': 'rust',
    'swift': 'swift',
    'kotlin': 'kotlin',
    'scala': 'scala',
    'html': 'markup',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'json': 'json',
    'xml': 'markup',
    'yaml': 'yaml',
    'markdown': 'markdown',
    'sql': 'sql',
    'bash': 'bash',
    'shell': 'bash',
    'powershell': 'powershell'
  };

  const prismLanguage = languageMap[language] || 'javascript';
  
  // Highlight the code using Prism.js
  let highlightedCode = code;
  try {
    if (Prism.languages[prismLanguage]) {
      highlightedCode = Prism.highlight(code, Prism.languages[prismLanguage], prismLanguage);
    } else {
      // Fallback to plain text if language not supported
      highlightedCode = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
  } catch (error) {
    // Fallback to plain text if highlighting fails
    highlightedCode = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            margin: 0;
            padding: 30px;
            font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
            background: ${theme.colors.background};
            color: ${theme.colors.text};
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .code-container {
            background: ${theme.colors.container};
            border-radius: 16px;
            padding: 24px;
            box-shadow: 
                0 20px 40px rgba(0, 0, 0, 0.4),
                0 8px 16px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            border: 1px solid ${theme.colors.border};
            width: 800px;
            position: relative;
            overflow: hidden;
        }
        
        .code-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid ${theme.colors.border};
            position: relative;
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, ${theme.colors.border}, transparent);
        }
        
        .language-badge {
            background: ${theme.colors.badge};
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            position: relative;
        }
        
        .language-badge::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 20px;
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%);
        }
        
        .dots {
            display: flex;
            gap: 8px;
        }
        
        .dot {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            position: relative;
        }
        
        .dot::before {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
        }
        
        .dot.red { 
            background: linear-gradient(135deg, #ff5f56 0%, #ff4444 100%);
        }
        .dot.yellow { 
            background: linear-gradient(135deg, #ffbd2e 0%, #ffaa00 100%);
        }
        .dot.green { 
            background: linear-gradient(135deg, #27ca3f 0%, #22c55e 100%);
        }
        
        .code-block {
            background: ${theme.colors.codeBlock};
            border-radius: 12px;
            padding: 20px;
            overflow-x: auto;
            font-size: 16px;
            line-height: 1.7;
            white-space: pre;
            color: ${theme.colors.text};
            border: 1px solid ${theme.colors.border};
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
            position: relative;
        }
        
        .code-block::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, ${theme.colors.border}, transparent);
        }
        
        /* Enhanced syntax highlighting - Theme compatible */
        .token.keyword { color: ${theme.syntax.keyword}; font-weight: 500; }
        .token.string { color: ${theme.syntax.string}; }
        .token.comment { color: ${theme.syntax.comment}; font-style: italic; }
        .token.number { color: ${theme.syntax.number}; }
        .token.function { color: ${theme.syntax.function}; }
        .token.class-name { color: ${theme.syntax.class}; }
        .token.operator { color: ${theme.syntax.operator}; }
        .token.punctuation { color: ${theme.syntax.punctuation}; }
        .token.variable { color: ${theme.syntax.variable}; }
        .token.property { color: ${theme.syntax.property}; }
        .token.boolean { color: ${theme.syntax.number}; }
        .token.null { color: ${theme.syntax.number}; }
        .token.undefined { color: ${theme.syntax.number}; }
        .token.regex { color: ${theme.syntax.string}; }
        .token.tag { color: ${theme.syntax.keyword}; }
        .token.attr-name { color: ${theme.syntax.function}; }
        .token.attr-value { color: ${theme.syntax.string}; }
        .token.selector { color: ${theme.syntax.keyword}; }
        .token.important { color: ${theme.syntax.string}; font-weight: bold; }
        
        /* Scrollbar styling */
        .code-block::-webkit-scrollbar {
            height: 8px;
        }
        
        .code-block::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
        }
        
        .code-block::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
        }
        
        .code-block::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
        }
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
        <div class="code-block">${highlightedCode}</div>
    </div>
</body>
</html>
    `;
}

export function deactivate() {}
