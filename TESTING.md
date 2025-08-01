# Como testar a extensão

## Pré-requisitos

1. **Node.js** instalado (versão 16 ou superior)
2. **VS Code** ou **Cursor** instalado
3. **Git** (opcional, para controle de versão)

## Passos para testar

### 1. Instalar dependências

```bash
npm install
```

### 2. Compilar o projeto

```bash
npm run compile
```

### 3. Executar a extensão em modo debug

1. Abra o projeto no VS Code/Cursor
2. Pressione `F5` ou vá em `Run and Debug` (Ctrl+Shift+D)
3. Selecione "Run Extension"
4. Uma nova janela do VS Code será aberta com a extensão carregada

### 4. Testar a funcionalidade

1. Na nova janela do VS Code, abra o arquivo `example.js`
2. Selecione um trecho de código (por exemplo, a função `calculateFibonacci`)
3. Pressione `Ctrl+Shift+S` (ou `Cmd+Shift+S` no Mac)
4. Aguarde a geração da imagem
5. Verifique se a pasta `snippets` foi criada no workspace
6. Abra a imagem gerada para ver o resultado

## Estrutura esperada após o teste

```
Sideprojects/
├── snippets/
│   └── snippet-YYYY-MM-DD-HH-MM-SS.png
├── src/
│   └── extension.ts
├── out/
│   └── extension.js
├── example.js
└── ... (outros arquivos)
```

## Solução de problemas

### Erro: "No active editor found"

- Certifique-se de que um arquivo está aberto e ativo

### Erro: "Please select some code first"

- Selecione um trecho de código antes de executar o comando

### Erro: "Failed to generate snippet"

- Verifique se o Puppeteer foi instalado corretamente
- Certifique-se de que há espaço em disco suficiente
- Verifique se o workspace tem permissões de escrita

### Imagem não aparece

- Verifique a pasta `snippets` no workspace
- Use o comando "Reveal in Explorer" na notificação

## Personalização

Para personalizar o visual dos snippets, edite a função `createHTML` no arquivo `src/extension.ts`. Você pode modificar:

- Cores do tema
- Fontes utilizadas
- Tamanho e espaçamento
- Estilo dos elementos (dots, badge, etc.)

## Próximos passos

1. **Empacotar a extensão**: Use `vsce package` para criar um arquivo .vsix
2. **Publicar no marketplace**: Siga as instruções do VS Code Marketplace
3. **Adicionar mais temas**: Implemente diferentes temas de cores
4. **Adicionar configurações**: Permita que o usuário configure o visual
