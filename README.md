# Code Snippet Generator

Uma extensão para VS Code/Cursor que permite gerar snippets de código bonitos como imagens PNG.

## Funcionalidades

- 🎨 Gera imagens PNG de código com design moderno
- ⌨️ Atalho de teclado: `Ctrl+Shift+S` (Windows/Linux) ou `Cmd+Shift+S` (Mac)
- 🎯 Suporte a múltiplas linguagens de programação
- 📁 Salva automaticamente na pasta `snippets` do workspace
- 🖼️ Design inspirado no VS Code com dots de janela e badge de linguagem

## Como usar

1. **Selecione o código** que deseja transformar em imagem
2. **Use o atalho** `Ctrl+Shift+S` (ou `Cmd+Shift+S` no Mac)
3. **Aguarde** a geração da imagem
4. **Acesse** a pasta `snippets` no seu workspace para ver o resultado

## Instalação para desenvolvimento

1. Clone este repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Compile o TypeScript:
   ```bash
   npm run compile
   ```
4. Abra o projeto no VS Code/Cursor
5. Pressione `F5` para executar a extensão em modo debug

## Estrutura do projeto

```
├── src/
│   └── extension.ts          # Código principal da extensão
├── package.json              # Configuração da extensão
├── tsconfig.json            # Configuração TypeScript
├── .vscodeignore           # Arquivos ignorados no pacote
└── README.md               # Este arquivo
```

## Tecnologias utilizadas

- **TypeScript** - Linguagem principal
- **Puppeteer** - Geração de screenshots
- **VS Code API** - Integração com o editor
- **HTML/CSS** - Estilização dos snippets

## Personalização

Você pode personalizar o visual dos snippets editando a função `createHTML` no arquivo `src/extension.ts`. As principais opções de personalização incluem:

- Cores do tema
- Fontes utilizadas
- Tamanho e espaçamento
- Estilo dos elementos (dots, badge, etc.)

## Exemplo de uso

1. Abra um arquivo de código
2. Selecione um trecho de código
3. Pressione `Ctrl+Shift+S`
4. A imagem será salva em `workspace/snippets/snippet-YYYY-MM-DD-HH-MM-SS.png`

## Licença

MIT
