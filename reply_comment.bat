@echo off
set GITHUB_TOKEN=
gh api repos/WilsonMPeixoto-2/controle-climatizacao-3cre/pulls/6/comments/3398126349/replies -f body="Resolvido. Adicionamos a nova migration 20260611020000_security_definer_grants.sql que revoga explicitamente o privilégio de execução padrao de PUBLIC em todas as funcoes SECURITY DEFINER e concede acesso estrito apenas para anon, authenticated e service_role."
