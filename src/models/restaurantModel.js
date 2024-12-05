import { DataTypes } from 'sequelize';

const RestaurantModel = (sequelize, Sequelize) => {
    const Restaurant = sequelize.define('Restaurant', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        cnpj: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        main_activity: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        state: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        neighborhood: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        zip_code: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        public_place: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        number: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        timestamps: false,
    });
    return Restaurant;
}

export default RestaurantModel;