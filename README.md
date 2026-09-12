# Comparador de Bicicletas

Aplicação estática para registrar e comparar opções de bicicletas durante a pesquisa em lojas. Os dados são gravados automaticamente no `localStorage` do navegador, portanto não dependem de conta nem servidor.

## Recursos

- Cadastro e edição imediata de várias bicicletas.
- Campos para loja, marca, modelo, preço, parcelamento, quadro, rodas, pneus, freios, transmissão, garantia e observações.
- Página de cards para escolher uma bike ao editar ou exportar.
- Exportação de uma bike em Markdown via área de transferência.
- Exportação de todas as opções, com tabela comparativa e fichas individuais, em Markdown.
- Interface responsiva para usar no celular enquanto visita lojas.

## Publicar no GitHub Pages

1. Abra **Settings** no repositório.
2. Entre em **Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**.
4. Selecione a branch `main` e a pasta `/(root)`.
5. Salve. Em alguns minutos, o GitHub mostrará o endereço da página.

> Importante: o `localStorage` fica salvo no navegador e no domínio usado. Use sempre o mesmo navegador/dispositivo para manter seus dados. Ao limpar os dados do site ou trocar de aparelho, os cadastros não acompanham automaticamente; exporte em Markdown como backup antes disso.
