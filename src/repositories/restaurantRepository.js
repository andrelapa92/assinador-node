import models from "../models/index.js";
import * as dateFnsTz from 'date-fns-tz';

const timeZone = 'America/Sao_Paulo';
const date = new Date();
const formatString = 'yyyy-MM-dd HH:mm:ss';
const zonedDate = dateFnsTz.formatInTimeZone(date, timeZone, formatString);

async function getRestaurants() {
    try {
        return await models.Restaurant.findAll();
    } catch (error) {
        throw new Error('Erro ao buscar restaurantes no banco de dados.');
    }
}

async function getRestaurantById(id) {
    try {
        return await models.Restaurant.findByPk(id);
    } catch (error) {
        throw new Error('Erro ao buscar restaurante pelo ID no banco de dados.');
    }
}

async function getRestaurantByCNPJ(cnpj) {
    try {
        const existingRestaurant = await models.Restaurant.findOne({ where: { cnpj } });
        if (existingRestaurant) {
            return existingRestaurant;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        throw new Error('Erro ao buscar restaurante pelo CNPJ no banco de dados.');
    }
}

async function createRestaurant(reqBody) {
    try {
        console.log(reqBody.cnpjData.atividade_principal);
        reqBody.name = reqBody.name || reqBody.cnpjData.fantasia;
        reqBody.main_activity = reqBody.main_activity || reqBody.cnpjData.atividade_principal[0].text;
        reqBody.state = reqBody.state || reqBody.cnpjData.uf;
        reqBody.city = reqBody.city || reqBody.cnpjData.municipio;
        reqBody.neighborhood = reqBody.neighborhood || reqBody.cnpjData.bairro;
        reqBody.zip_code = reqBody.zip_code || reqBody.cnpjData.cep;
        reqBody.public_place = reqBody.public_place || reqBody.cnpjData.logradouro;
        reqBody.number = reqBody.number || reqBody.cnpjData.numero;
        reqBody.created_at = zonedDate;
        reqBody.updated_at = zonedDate;
        return await models.Restaurant.create(reqBody);
    } catch (error) {
        throw new Error('Erro ao inserir restaurante no banco de dados.');
    }
}

async function updateRestaurant(existingRestaurant, body) {
    try {
        body.updated_at = new Date;
        return await existingRestaurant.update(body);
    } catch (error) {
        throw new Error('Erro ao atualizar restaurante no banco de dados.');
    }
}

async function deleteRestaurant(id) {
    try {
        return await models.Restaurant.destroy({ where: { id } });
    } catch (error) {
        throw new Error('Erro ao excluir restaurante do banco de dados.');
    }
}

export default {
    getRestaurants,
    getRestaurantById,
    getRestaurantByCNPJ,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant
};