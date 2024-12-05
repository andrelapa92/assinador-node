import restaurantService from "../services/restaurantService.js";
import errorHandlers from "../utils/error/errorHandlers.js";
import cnpjUtils from "../utils/cnpjUtils.js";


async function getRestaurants(req, res) {
    try {
        const restaurant = await restaurantService.getRestaurants();
        return res.status(200).send({success: true, data: restaurant});
    } catch (error) {
        errorHandlers.handleErrors(error, req, res, 'CONTROLLER.GET_RESTAURANTS');
    }
}

async function getRestaurantById(req, res) {
    try {
        const restaurant = await restaurantService.getRestaurantById(req.params.id);
        return res.status(200).send({success: true, data: restaurant});
    } catch (error) {
        errorHandlers.handleErrors(error, req, res, 'CONTROLLER.GET_RESTAURANT_BY_ID');
    }
}

async function getRestaurantByCNPJ(req, res) {
    try {
        const restaurant = await restaurantService.getRestaurantByCNPJ(req.params.cnpj);
        return res.status(200).send({success: true, data: restaurant});
    } catch (error) {
        errorHandlers.handleErrors(error, req, res, 'CONTROLLER.GET_RESTAURANT_BY_CNPJ');
    }
}

async function createRestaurant(req, res) {
    try {
        req.body.cnpj = cnpjUtils.cleanCNPJ(req.body.cnpj);
        const restaurant = await restaurantService.createRestaurant(req.body);
        if (restaurant) {
            return res.status(201).send({ success: true, data: restaurant });
        }
    } catch (error) {
        errorHandlers.handleErrors(error, req, res, 'CONTROLLER.CREATE_RESTAURANT');
    }
}

async function updateRestaurant(req, res) {
    try {
        const restaurant = await restaurantService.updateRestaurant(req.params.id, req.body);
        return res.status(200).send({success: true, data: restaurant});
    } catch (error) {
        errorHandlers.handleErrors(error, req, res, 'CONTROLLER.UPDATE_RESTAURANT');
    }
}

async function deleteRestaurant(req, res) {
    try {
        await restaurantService.deleteRestaurant(req.params.id);
        return res.status(200).send({success: true, data: `Usuário com ID ${req.params.id} excluído com sucesso.`});
    } catch (error) {
        errorHandlers.handleErrors(error, req, res, 'CONTROLLER.DELETE_RESTAURANT');
    }
}

export default {
    getRestaurants,
    getRestaurantById,
    getRestaurantByCNPJ,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
};