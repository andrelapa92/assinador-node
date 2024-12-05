import restaurantRepository from "../repositories/restaurantRepository.js";
import { AlreadyExists, NotFound } from "../utils/error/customErrors.js";
import cnpjService from "../services/external/cnpjService.js"

async function getRestaurants() {
    return await restaurantRepository.getRestaurants();
}

async function getRestaurantById(id) {
    const existingRestaurant = await restaurantRepository.getRestaurantById(id);
    if (!existingRestaurant) {
        throw new NotFound(`Usuário com ID ${id} não encontrado.`);
    }
    return existingRestaurant;
}

async function getRestaurantByCNPJ(cnpj) {
    const existingRestaurant = await restaurantRepository.getRestaurantByCNPJ(cnpj);
    if (existingRestaurant) {
        return existingRestaurant;
    } else {
        return false;
    }
}

async function createRestaurant(reqBody) {
    const existingRestaurant = await getRestaurantByCNPJ(reqBody.cnpj);
    if (existingRestaurant) {
        throw new AlreadyExists('CNPJ já cadastrado.');
    }
    reqBody.cnpjData = await cnpjService.getCNPJInfo(reqBody.cnpj);
    console.log(reqBody.cnpjData);
    if (!reqBody.cnpjData) {
        throw new Error('Não foi possível obter informações do CNPJ.');
    }
    return await restaurantRepository.createRestaurant(reqBody);
}

async function updateRestaurant(id, reqBody) {
    const existingRestaurant = await getRestaurantById(id);
    return await restaurantRepository.updateRestaurant(existingRestaurant, reqBody);
}

async function deleteRestaurant(id) {
    const existingRestaurant = await restaurantRepository.getRestaurantById(id);
    if (!existingRestaurant) {
        throw new NotFound(`Usuário com ID ${id} não encontrado.`);
    } else {
        return await restaurantRepository.deleteRestaurant(id);
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