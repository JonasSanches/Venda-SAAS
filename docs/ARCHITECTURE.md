# Arquitetura

## Princípios

1. **Isolamento por padrão:** tenant inferido do token, filtro no ORM e RLS no banco.
2. **Fiscal assíncrono:** a venda é registrada antes da autorização fiscal; jobs têm idempotência.
3. **Livro razão:** estoque e caixa são movimentos imutáveis, com estornos em vez de edição.
4. **Auditoria:** ações sensíveis registram ator, tenant, IP, recurso e antes/depois.
5. **Módulos, não microserviços prematuros:** monólito modular inicialmente, com eventos internos.

## Contextos de negócio

| Contexto | Responsabilidade |
|---|---|
| Identity | login, MFA, sessões, papéis e permissões |
| Tenancy | clientes, planos, filiais e configurações |
| Catalog | produtos, variações, combos, adicionais e preços |
| Inventory | depósitos, lotes, movimentos, inventário e ficha técnica |
| Sales | pedidos, mesas, comandas, itens, descontos e pagamentos |
| Cash | abertura, suprimento, sangria e fechamento |
| Purchasing | fornecedores, pedidos de compra e recebimento |
| Fiscal | NF-e/NFC-e, certificados, XML, eventos e contingência |
| Finance | contas, centros de custo e conciliação |
| Platform | planos, cobrança, suporte, flags e limites |

## Fluxo fiscal

```text
Venda concluída -> Outbox -> Fila fiscal -> validação tributária
                                      -> assinatura -> SEFAZ
                                      -> XML/protocolo no S3
                                      -> status e auditoria
```

O adaptador `FiscalProvider` não contém regra de venda. Credenciais e certificados são
criptografados por tenant. Produção exige gestão de chaves em KMS/Vault e nunca deve
persistir senha de certificado em texto puro.

O primeiro ciclo de homologação contempla **SP e RJ**. A UF do estabelecimento é validada
contra `FISCAL_ENABLED_UFS`; documentos de outras UFs são recusados até que seus endpoints,
regras, contingência e cenários de homologação sejam certificados.

## Isolamento

O modelo compartilhado com RLS atende a maioria dos clientes. Clientes enterprise podem
ser roteados para banco dedicado por meio de um registry de conexões, sem alterar os
contratos de domínio. Backups e restaurações devem permitir recorte por tenant.

## Segurança operacional

- Argon2id para senha; MFA obrigatório para administradores.
- JWT curto e refresh token rotativo armazenado como hash.
- Rate limit, CSP, CORS explícito e proteção contra replay.
- Segredos fora do repositório e criptografia de campos fiscais.
- Logs sem CPF, tokens, cartões ou certificados.
- Auditoria append-only e exportável.
- Dependências verificadas no CI; SAST, secret scanning e SBOM.

## Próximas entregas

1. Autenticação, tenants, usuários, filiais e RBAC.
2. Catálogo, estoque por movimentos e fornecedores.
3. Pedido/PDV, caixa, pagamentos e impressão.
4. Emissor NFC-e/NF-e em homologação e contingência.
5. Financeiro, relatórios, integrações e modo offline.
