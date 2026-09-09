export type DigitalFormat = "PDF" | "KINDLE";
export type DigitalProduct = { slug:string; title:string; hook:string; pdfFile:string; kindleFile:string };

export const DIGITAL_PRODUCTS:DigitalProduct[]=[
  {slug:"codigos-de-energia-volume-1",title:"Vibracional — Códigos de Energia, Volume 1",hook:"Símbolos, frequências e relações energéticas apresentados em uma jornada visual.",pdfFile:"codigos-de-energia-volume-1.pdf",kindleFile:"codigos-de-energia-volume-1.epub"},
  {slug:"livro-da-sabedoria-volume-1",title:"Livro da Sabedoria — Volume 1",hook:"Uma leitura sobre conhecimento, bem e mal e os símbolos que atravessam essa dualidade.",pdfFile:"livro-da-sabedoria-volume-1.pdf",kindleFile:"livro-da-sabedoria-volume-1.epub"},
  {slug:"os-manuscritos-escondidos-volume-2",title:"Os Manuscritos Escondidos — Volume 2",hook:"Conhecimentos, símbolos e manuscritos reunidos em uma obra extensa e ilustrada.",pdfFile:"os-manuscritos-escondidos-volume-2.pdf",kindleFile:"os-manuscritos-escondidos-volume-2.epub"},
  {slug:"livro-da-sabedoria-volume-3-parte-1",title:"Livro da Sabedoria, Volume 3 — A Nova Era, Parte 1",hook:"Reflexões sobre consciência, desejo, transformação e os caminhos de uma nova era.",pdfFile:"livro-da-sabedoria-volume-3-parte-1.pdf",kindleFile:"livro-da-sabedoria-volume-3-parte-1.epub"},
  {slug:"livro-da-sabedoria-volume-3-parte-2",title:"Livro da Sabedoria, Volume 3 — A Nova Era, Parte 2",hook:"A continuação da obra, aprofundando escolhas, emoções e níveis de consciência.",pdfFile:"livro-da-sabedoria-volume-3-parte-2.pdf",kindleFile:"livro-da-sabedoria-volume-3-parte-2.epub"},
  {slug:"geometria-sagrada-universal",title:"A Geometria Sagrada Universal",hook:"Descubra padrões e proporções associados à natureza, ao ser humano e ao universo.",pdfFile:"geometria-sagrada-universal.pdf",kindleFile:"geometria-sagrada-universal.epub"},
  {slug:"como-descalcificar-a-glandula-pineal",title:"Como Descalcificar a Glândula Pineal",hook:"Um guia ilustrado sobre a glândula pineal e práticas apresentadas pelo autor.",pdfFile:"como-descalcificar-a-glandula-pineal.pdf",kindleFile:"como-descalcificar-a-glandula-pineal.epub"},
  {slug:"astrologia-cabalista",title:"Astrologia Cabalista",hook:"Uma introdução visual às relações entre astrologia, símbolos e tradição cabalista.",pdfFile:"astrologia-cabalista.pdf",kindleFile:"astrologia-cabalista.epub"},
  {slug:"tabuas-de-esmeralda-de-thoth",title:"As Tábuas de Esmeralda de Thoth",hook:"Tradução e interpretação de um dos textos mais conhecidos da tradição hermética.",pdfFile:"tabuas-de-esmeralda-de-thoth.pdf",kindleFile:"tabuas-de-esmeralda-de-thoth.epub"},
  {slug:"despertar-alcalino-parte-1",title:"Despertar Alcalino — Parte 1",hook:"A abertura de uma série sobre alimentação, hábitos e a busca por saúde verdadeira.",pdfFile:"despertar-alcalino-parte-1.pdf",kindleFile:"despertar-alcalino-parte-1.epub"},
  {slug:"despertar-alcalino-parte-2",title:"Despertar Alcalino — Parte 2",hook:"Uma leitura provocativa sobre indústria, escolhas alimentares e comportamento.",pdfFile:"despertar-alcalino-parte-2.pdf",kindleFile:"despertar-alcalino-parte-2.epub"},
  {slug:"despertar-alcalino-parte-3",title:"Despertar Alcalino — Parte 3",hook:"Compare alimentos orgânicos e industrializados e descubra os argumentos da obra.",pdfFile:"despertar-alcalino-parte-3.pdf",kindleFile:"despertar-alcalino-parte-3.epub"},
  {slug:"despertar-alcalino-parte-4",title:"Despertar Alcalino — Parte 4",hook:"Mentalidade, consciência e a ideia de que mudanças profundas começam por dentro.",pdfFile:"despertar-alcalino-parte-4.pdf",kindleFile:"despertar-alcalino-parte-4.epub"}
];

export const digitalPrice=(format:DigitalFormat)=>format==="PDF"?11.99:39.99;
