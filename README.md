# Evinote
Notetaking and information sharing webapp made with sveltekit and postgres. ✨

## links
* [Kanban](https://github.com/users/L4PRY/projects/1)
* [Specification sheet](/../../issues/5)
* [DB Schema](/../../issues/1)

## setup devenv
prequisites:
- [podman](https://podman.io) or [docker](https://docker.com)
- [node.js](https://nodejs.org/en/download/)

### 1. install dependencies
```bash
npm install
```

### 2. start database
```bash
# podman
npm run db:start

# docker
npm run docker:db:start
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
