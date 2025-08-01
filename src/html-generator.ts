import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';

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

export function createHTMLWithFilename(code: string, language: string, theme: Theme, filename?: string): string {
  console.log('createHTMLWithFilename called with filename:', filename);
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
        html, body {
            margin: 0;
            padding: 0;
            font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
            background: ${theme.colors.background};
            color: ${theme.colors.text};
            min-height: 100vh;
            width: 100%;
        }
        
        body {
            padding: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: visible;
        }
        
        .code-container {
            background: ${theme.colors.container};
            border-radius: 16px;
            box-shadow: 
                0 20px 40px rgba(0, 0, 0, 0.4),
                0 8px 16px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            border: 1px solid ${theme.colors.border};
            width: 800px;
            position: relative;
            overflow: visible;
            max-width: 100%;
            min-height: 200px;
            margin-bottom: 30px;
        }
        
        .window-header {
            background: #2d2d2d;
            padding: 12px 20px;
            border-bottom: 1px solid ${theme.colors.border};
            display: flex;
            align-items: center;
            gap: 8px;
            min-height: 40px;
        }
        
        .window-controls {
            display: flex;
            gap: 6px;
        }
        
        .window-control {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        
        .window-control.close {
            background: #ff5f56;
        }
        
        .window-control.minimize {
            background: #ffbd2e;
        }
        
        .window-control.maximize {
            background: #27ca3f;
        }
        
        .window-title {
            color: #ffffff;
            font-size: 14px;
            font-weight: 500;
            opacity: 1;
            flex: 1;
            text-align: center;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }
        
        .code-content {
            padding: 24px;
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
            overflow-y: visible;
            font-size: 16px;
            line-height: 1.7;
            white-space: pre;
            color: ${theme.colors.text};
            border: 1px solid ${theme.colors.border};
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
            position: relative;
            word-wrap: break-word;
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
        <div class="window-header">
            <div class="window-controls">
                <div class="window-control close"></div>
                <div class="window-control minimize"></div>
                <div class="window-control maximize"></div>
            </div>
            <div class="window-title">${filename ? filename : 'untitled'}</div>
            <div class="language-badge">${language}</div>
        </div>
        <div class="code-content">
            <div class="code-block">${highlightedCode}</div>
        </div>
    </div>
</body>
</html>
    `;
} 