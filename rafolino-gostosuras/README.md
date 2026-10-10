# Rafolino Gostosuras

Web app para calcular custo, preço e produção dos doces da Rafolino Gostosuras: ingredientes, receitas, fornadas e lista de compras.

- Feito para celular, funciona também no computador.
- Os dados ficam salvos **no próprio aparelho** (no navegador). Não tem servidor, banco de dados nem login.
- Depois de aberto uma vez, funciona **sem internet**.
- Dá para **instalar na tela inicial** como se fosse um aplicativo.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | A página do app |
| `styles.css` | Visual (estilo Doceria Pop) |
| `app.js` | Cálculos, telas e salvamento no aparelho |
| `manifest.webmanifest` | Nome, cores e ícones para instalar na tela inicial |
| `sw.js` | Faz o app abrir sem internet |
| `icons/` | Ícones do app |

## Publicar no GitHub Pages

1. Crie um repositório novo no GitHub (por exemplo `rafolino-gostosuras`). Pode ser público.
2. Na página do repositório, clique em **Add file › Upload files** e arraste **todo o conteúdo desta pasta**, incluindo a pasta `icons`. Clique em **Commit changes**.
3. Vá em **Settings › Pages**. Em *Build and deployment*, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)**, e salve.
4. Em um ou dois minutos o endereço aparece no topo dessa página, algo como `https://SEU-USUARIO.github.io/rafolino-gostosuras/`.

## Instalar no celular

- **iPhone (Safari):** abra o endereço, toque em Compartilhar e depois em **Adicionar à Tela de Início**.
- **Android (Chrome):** abra o endereço, toque no menu ⋮ e depois em **Instalar app** ou **Adicionar à tela inicial**.

## Bom saber

- Cada aparelho tem os seus próprios dados. O que o Rafolino edita no celular dele não aparece no seu, e vice-versa.
- Limpar os dados do navegador ou desinstalar o app apaga o que foi editado. O botão **Restaurar valores iniciais** (aba Fornadas) volta para os valores de exemplo.
- Ao publicar uma versão nova do código, aumente o número em `VERSION` no `sw.js` (ex.: `rafolino-v2`) para os celulares pegarem a atualização. Os dados salvos não se perdem.
- Os preços iniciais de ingredientes e de venda são estimativas. Troque pelos valores reais.
