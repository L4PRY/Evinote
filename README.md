# Evinote
Notes board webapp made with sveltekit and postgres.

# setup devenv
prequisites:
- [podman](https://podman.io) or [docker](https://docker.com)
- [node.js](https://nodejs.org/en/download/)

### 1. install dependencies
```bash
npm install
```

### 2. start database
> [!IMPORTANT]
> use `docker:db:start` instead if you are planning on using docker / docker-compose.

```bash
npm run db:start
```

### 3. push schema to database
```bash
npm run db:push
```

### 4. start dev server
```bash
npm run dev
```

made wit luv by patrik, lados and matyi ❤️
