# Molde 2 — bases fotográficas

Tratamento realizado com a ferramenta integrada de edição de imagens (ImageGen).
As referências são as fotos de frente e costas fornecidas pelo usuário.
O molde 1 não foi alterado. Os SVGs anteriores do molde 2 foram preservados.

## Prompts utilizados

Frente: extrair somente a bermuda frontal da foto para fundo realmente
transparente; preservar silhueta, proporções, cós curvo, quatro ilhós,
carcela assimétrica, costuras duplas, barras e dobras naturais. Neutralizar
o verde e clarear o tecido mantendo sombras suaves. Amarrar o cordão branco
em um pequeno laço natural, mantendo duas pontas compridas. Não transformar
em desenho vetorial, não inventar dobras geométricas nem redesenhar a peça.

Costas: extrair somente a bermuda traseira da foto para fundo realmente
transparente; preservar proporções, caimento assimétrico, cós, costura e dobra
central, barras e bolso direito com cantos inferiores chanfrados, dois ilhós
e aba preta com a arte branca BACKSTAR da referência. Neutralizar o verde
e clarear o tecido mantendo as dobras naturais. Não redesenhar a etiqueta.

## Integração

- `apps/web/public/molde-bermuda-cavada-2-foto-frente.png`
- `apps/web/public/molde-bermuda-cavada-2-foto-costas.png`

A silhueta imprimível do molde fotográfico usa o canal alfa da imagem.
O tecido é sobreposto à arte por multiplicação, mantendo o relevo visual.
A etiqueta traseira é reaplicada em composição normal por recorte, para
preservar as letras brancas independentemente da estampa.

As imagens são tratamentos assistidos por IA: não são moldes de corte
dimensionalmente calibrados nem garantia de reprodução pixel a pixel.
