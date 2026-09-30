# Deploy na VPS HostGator

Requisitos: Ubuntu 22.04, Docker Engine, Docker Compose, Git e portas 22, 80 e 443 liberadas.

1. Clone o repositório privado em `/opt/vendamais-app`.
2. Copie `deploy/vps/.env.production.example` para `deploy/vps/.env.production`.
3. Preencha os segredos somente no servidor e aplique permissão `chmod 600`.
4. Aponte os registros DNS `@` e `www` para o IP da VPS.
5. Em uma atualização manual com novas migrações, execute-as separadamente com `docker compose -f deploy/vps/docker-compose.yml run --rm --no-deps api corepack pnpm --filter @varejo/database exec prisma migrate deploy --schema prisma/schema.prisma`.
6. Execute `docker compose -f deploy/vps/docker-compose.yml up -d --build`.
7. Consulte `docker compose -f deploy/vps/docker-compose.yml ps` e os logs da API. O deploy automático já executa as migrações antes de substituir os contêineres.

O Caddy provisiona e renova automaticamente o certificado HTTPS depois que o DNS estiver propagado.

## Transcrição de vídeos do YouTube

Para que vídeos autorizados sem legendas públicas possam ser transcritos pelo
áudio, inclua `OPENAI_API_KEY` em `deploy/vps/.env.production`. A chave fica
somente no servidor, nunca no navegador. A imagem da API já instala `ffmpeg` e
`yt-dlp` para preparar o áudio antes do envio ao provedor de transcrição.

## Notificações no celular

As notificações de venda usam Web Push. Após publicar a versão que contém esse
recurso, gere uma única vez as chaves VAPID no servidor:

```bash
cd /opt/vendamais-app
docker compose -f deploy/vps/docker-compose.yml run --rm --no-deps api node apps/api/scripts/generate-vapid-keys.cjs
```

Copie os valores retornados para `deploy/vps/.env.production` como
`PUSH_VAPID_PUBLIC_KEY` e `PUSH_VAPID_PRIVATE_KEY`; defina também
`PUSH_VAPID_SUBJECT="mailto:seu-email@dominio.com"`. Em seguida, execute o
deploy novamente. Não publique nem envie a chave privada.

Se o console da hospedagem não permitir colar, gere e grave as chaves somente
na VPS, sem mostrá-las na tela:

```bash
docker compose -f deploy/vps/docker-compose.yml run --rm --no-deps api node apps/api/scripts/print-vapid-env.cjs > /tmp/vendamais-push.env
sed -i '/^PUSH_VAPID_/d' deploy/vps/.env.production
cat /tmp/vendamais-push.env >> deploy/vps/.env.production
rm /tmp/vendamais-push.env
docker compose -f deploy/vps/docker-compose.yml up -d --force-recreate api
```

No celular, abra o Venda+ em HTTPS, instale-o na tela inicial e toque em
“Ativar notificações de vendas”. No iPhone, a instalação pela opção
“Adicionar à Tela de Início” é necessária para receber avisos em segundo plano.

## Atualização automática

O timer `vendamais-deploy.timer` consulta a branch `main` a cada dois minutos. Uma
nova revisão só é marcada como implantada depois que a API fica saudável. Instale
uma única vez, como root, com:

```bash
cd /opt/vendamais-app
git pull
bash deploy/vps/install-auto-deploy.sh
```

Consulte o histórico com:

```bash
journalctl -u vendamais-deploy.service -n 100 --no-pager
```

Migrações de banco continuam sendo uma etapa explícita e devem ser aplicadas antes
de versões que alterem o schema.

## Monitoramento e cópias de configuração

`vendamais-monitor.timer` verifica a aplicação e a conexão com o banco a cada cinco
minutos e alerta no journal quando há três falhas seguidas ou o disco ultrapassa
85%. Um webhook externo pode ser configurado em `/etc/vendamais-monitor.env` com
`MONITOR_ALERT_WEBHOOK_URL="..."`.

`vendamais-backup.timer` cria diariamente uma cópia protegida das configurações em
`/var/backups/vendamais`, mantendo 14 dias. Os dados comerciais residem no Supabase
e seguem a política de backup daquele projeto; a cópia local não substitui um
backup externo do banco nem protege contra a perda total da VPS.
