-- Renomeia exclusivamente o usuário de teste solicitado, preservando
-- e-mail, senha, perfil, permissões e vínculo com a empresa.
UPDATE "users" AS "user"
SET "name" = 'Alexandre Varão Backstar'
FROM "tenants" AS "tenant"
WHERE "user"."tenant_id" = "tenant"."id"
  AND LOWER("tenant"."name") = 'testse'
  AND "user"."name" = 'Jonas Zampietro Sanches'
  AND LOWER("user"."email") LIKE 'teste@yahoo%';
