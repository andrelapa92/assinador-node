# Assinador de Documentos – Node.js

Este projeto foi desenvolvido como um **desafio técnico**, com o objetivo de implementar uma **API REST para assinatura digital de documentos** utilizando **Node.js**, **NestJS** e a biblioteca **Forge**.

A aplicação realiza a leitura de certificados digitais, geração de hash e assinatura de arquivos, seguindo boas práticas de organização, testes e execução via Docker.

---

## Tecnologias utilizadas

- Node.js 20.x
- NestJS
- TypeScript
- Forge / node-forge
- Jest (testes unitários)
- ESLint (Flat Config)
- Docker / Docker Compose

---

## Pré-requisitos

- Docker

## Instruções

Na raiz do projeto, execute:
```bash
# Clonar o repositório
git clone https://github.com/andrelapa92/assinador-node.git

# Subir os containers
docker compose up --build

# A API estará disponível em:
http://localhost:3000
```
