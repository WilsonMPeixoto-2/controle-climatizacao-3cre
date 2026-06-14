@echo off
set GITHUB_TOKEN=
git status -sb
echo ===
git log --oneline --decorate -5
echo ===
git push -u origin feat/map-microcards-dossier-v5
echo ===
gh pr view 6 --json headRefOid,mergeable,mergeStateStatus,statusCheckRollup
