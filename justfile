set shell := ["powershell", "-NoLogo", "-Command"]

app:
    bun run dev-app

server:
    bun run dev-backend

typegen: 
    bun run typegen