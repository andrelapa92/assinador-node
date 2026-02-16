import { Sequelize } from 'sequelize';
import dbConfig from '../config/database.js';
import UserModel from './userModel.js';
import RestaurantModel from './restaurantModel.js';

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

let sequelize;
if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const models = {
    User: UserModel(sequelize, Sequelize.DataTypes),
    Restaurant: RestaurantModel(sequelize, Sequelize.DataTypes)
};

Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

export default models;