import express from 'express';
import restaurantController from '../controllers/restaurantController.js';

const router = express.Router();

router.get('/', restaurantController.getRestaurants);
router.get('/:id', restaurantController.getRestaurantById);
router.get('/cnpj/:cnpj', restaurantController.getRestaurantByCNPJ);
router.post('/', restaurantController.createRestaurant);
router.put('/:id', restaurantController.updateRestaurant);
router.delete('/:id', restaurantController.deleteRestaurant);

export default router;