# Deploy na VPS HostGator

Requisitos: Ubuntu 22.04, Docker Engine, Docker Compose, Git e portas 22, 80 e 443 liberadas.

1. Clone o repositório privado em `/opt/vendamais-app`.
2. Copie `deploy/vps/.env.production.example` para `deploy/vps/.env.production`.
3. Preencha os segredos somente no servidor e aplique permissão `chmod 600`.
4. Aponte os registros DNS `@` e `www` para o IP da VPS.
5. Em uma atualização com novas migrações, execute-as separadamente com `docker compose -f deploy/vps/docker-compose.yml run --rm --no-deps api corepack pnpm --filter @varejo/database exec prisma migrate deploy --schema prisma/schema.prisma`.
6. Execute `docker compose -f deploy/vps/docker-compose.yml up -d --build`.
7. Consulte `docker compose -f deploy/vps/docker-compose.yml ps` e os logs da API.

O Caddy provisiona e renova automaticamente o certificado HTTPS depois que o DNS estiver propagado.

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
