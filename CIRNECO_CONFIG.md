# 🦮 Cirneco Configuration

Get configuration help at: https://cirne.co/how-to

## About .cirneco.json

This file is automatically created and updated by Cirneco.
You can customize themes, options, and add custom themes here.

## Example Configuration

```json
{
  "theme": "dark-mode",
  "options": {
    "showTitle": true,
    "showLanguageBadge": true,
    "showWindowControls": true
  },
  "customThemes": {
    "my-custom-theme": {
      "name": "My Custom Theme",
      "description": "A custom theme created by you",
      "colors": {
        "background": "#1a1a1a",
        "container": "#2d2d2d",
        "codeBlock": "#1e1e1e",
        "text": "#ffffff",
        "border": "#404040",
        "badge": "#007acc"
      },
      "syntax": {
        "keyword": "#569cd6",
        "string": "#ce9178",
        "comment": "#6a9955",
        "number": "#b5cea8",
        "function": "#dcdcaa",
        "class": "#4ec9b0",
        "operator": "#d4d4d4",
        "punctuation": "#d4d4d4",
        "variable": "#9cdcfe",
        "property": "#9cdcfe"
      },
      "options": {
        "showTitle": false,
        "showLanguageBadge": true,
        "showWindowControls": false
      }
    }
  }
}
```

## Configuration Options

### Global Options
- `showTitle`: Show/hide the filename in the title bar
- `showLanguageBadge`: Show/hide the language badge
- `showWindowControls`: Show/hide the window control buttons

### Theme Extension
You can extend existing themes by using the same name:
```json
{
  "theme": "dark-mode",
  "customThemes": {
    "dark-mode": {
      "colors": {
        "background": "#0a0a0a"
      },
      "options": {
        "showTitle": false
      }
    }
  }
}
```

This will merge your customizations with the built-in dark-mode theme. 