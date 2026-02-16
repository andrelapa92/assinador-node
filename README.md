# Assinador de documentos em NodeJS
Este projeto foi desenvolvido com o intuito de assinar documentos a partir de uma aplicação em NodeJS.<br>
Foram utilizadas bibliotecas amplamente conhecidas como Express e Sequelize.

## Primeiros Passos
Para rodar o projeto, basta executar os seguintes comandos:

# clonar o repositório
`git clone https://github.com/andrelapa92/assinador-node.git`
# copiar variáveis de ambiente
`cp .env.example .env`
# subir os containers
`docker compose up -d --build`

## Rotas

### Listar Usuários
Retorna uma lista de usuários.<br>
Método: GET<br>
Endpont: localhost:3000/api/v1/users

### Buscar Usuário Pelo ID
Retorna um usuário pelo ID.<br>
Método: GET<br>
Endpont: localhost:3000/api/v1/users/:id

### Criar Usuário
Cria um usuário.<br>
Método: POST<br>
Endpont: localhost:3000/api/v1/users<br>
Body:
```json
{
    "name": "Nome do Usuário",
    "email": "email@email.com",
    "password": "senha"
}
```


### Atualizar Usuário
Atualiza um usuário.<br>
Método: PUT<br>
Endpont: localhost:3000/api/v1/users/:id<br>
Body:
```json
{
    "name": "Novo Nome do Usuário"
}
```

### Deletar Usuário
Deleta um usuário.<br>
Método: DELETE<br>
Endpont: localhost:3000/api/v1/users/:id