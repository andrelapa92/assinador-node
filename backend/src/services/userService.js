import userRepository from "../repositories/userRepository.js";
import { AlreadyExists, NotFound } from "../utils/error/customErrors.js";
import bcrypt from "bcrypt";

async function getUsers() {
    return await userRepository.getUsers();
}

async function getUserById(id) {
    const existingUser = await userRepository.getUserById(id);
    if (!existingUser) {
        throw new NotFound(`Usuário com ID ${id} não encontrado.`);
    }
    return existingUser;
}

async function getUserByEmail(email) {
    const existingUser = await userRepository.getUserByEmail(email);
    if (existingUser) {
        return existingUser;
    } else {
        return false;
    }
}

async function createUser(reqBody) {
    const existingUser = await getUserByEmail(reqBody.email);
    if (existingUser) {
        throw new AlreadyExists('E-mail já cadastrado.');
    }
    reqBody.password = await bcrypt.hash(reqBody.password, 10);
    return await userRepository.createUser(reqBody);
}


async function updateUser(id, reqBody) {
    const existingUser = await getUserById(id);
    reqBody.password = await bcrypt.hash(reqBody.password, 10);
    return await userRepository.updateUser(existingUser, reqBody);
}

async function deleteUser(id) {
    const existingUser = await userRepository.getUserById(id);
    if (!existingUser) {
        throw new NotFound(`Usuário com ID ${id} não encontrado.`);
    } else {
        return await userRepository.deleteUser(id);
    }
}

export default {
    getUsers,
    getUserById,
    getUserByEmail,
    createUser,
    updateUser,
    deleteUser
};