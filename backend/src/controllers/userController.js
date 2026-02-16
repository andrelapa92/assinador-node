import userService from "../services/userService.js";
import errorHandlers from "../utils/error/errorHandlers.js";


async function getUsers(req, res) {
    try {
        const user = await userService.getUsers();
        return res.status(200).send({success: true, data: user});
    } catch (error) {
        errorHandlers.handleErrors(error, req, res, 'CONTROLLER.GET_USERS');
    }
}

async function getUserById(req, res) {
    try {
        const user = await userService.getUserById(req.params.id);
        return res.status(200).send({success: true, data: user});
    } catch (error) {
        errorHandlers.handleErrors(error, req, res, 'CONTROLLER.GET_USER_BY_ID');
    }
}

async function createUser(req, res) {
    try {
        const user = await userService.createUser(req.body);
        if (user) {
            return res.status(201).send({ success: true, data: user });
        }
    } catch (error) {
        errorHandlers.handleErrors(error, req, res, 'CONTROLLER.CREATE_USER');
    }
}

async function updateUser(req, res) {
    try {
        const user = await userService.updateUser(req.params.id, req.body);
        return res.status(200).send({success: true, data: user});
    } catch (error) {
        errorHandlers.handleErrors(error, req, res, 'CONTROLLER.UPDATE_USER');
    }
}

async function deleteUser(req, res) {
    try {
        await userService.deleteUser(req.params.id);
        return res.status(200).send({success: true, data: `Usuário com ID ${req.params.id} excluído com sucesso.`});
    } catch (error) {
        errorHandlers.handleErrors(error, req, res, 'CONTROLLER.DELETE_USER');
    }
}

export default {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};