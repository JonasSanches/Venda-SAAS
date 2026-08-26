# Deploy na VPS HostGator

Requisitos: Ubuntu 22.04, Docker Engine, Docker Compose, Git e portas 22, 80 e 443 liberadas.

1. Clone o repositório privado em `/opt/vendamais-app`.
2. Copie `deploy/vps/.env.production.example` para `deploy/vps/.env.production`.
3. Preencha os segredos somente no servidor e aplique permissão `chmod 600`.
4. Aponte os registros DNS `@` e `www` para o IP da VPS.
5. Execute `docker compose -f deploy/vps/docker-compose.yml up -d --build`.
6. Consulte `docker compose -f deploy/vps/docker-compose.yml ps` e os logs da API.

O Caddy provisiona e renova automaticamente o certificado HTTPS depois que o DNS estiver propagado.
