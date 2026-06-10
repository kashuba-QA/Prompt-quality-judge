# Prompt Quality Judge — Project Instructions

## Repository

All changes are committed and pushed to the `main` branch of:

```
https://github.com/kashuba-QA/Prompt-quality-judge.git
```

## Workflow

- Work happens on the `main` branch directly.
- After completing any task, stage relevant files and push to `origin/main`.
- Do not create feature branches unless explicitly asked.

## Project structure

| File / Folder | Purpose |
|---|---|
| `index.html` | Main single-page app (Prompt Quality Judge UI) |
| `config.js` | Runtime configuration (API base URL, Lambda URL, etc.) |
| `amplify.yml` | AWS Amplify build config |
| `Draft/` | Draft versions of the UI |
| `LAMBDA_SETUP.md` | Step-by-step guide for setting up the AWS Lambda proxy |

## Test accounts

| Role | Email | Password |
|---|---|---|
| LLM Judge | judgetest@net.com | 12345678Qq |
