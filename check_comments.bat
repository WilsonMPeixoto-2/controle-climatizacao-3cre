@echo off
set GITHUB_TOKEN=
gh api repos/WilsonMPeixoto-2/controle-climatizacao-3cre/pulls/6/comments --jq ".[] | {id: .id, path: .path, body: .body, line: .line}"
