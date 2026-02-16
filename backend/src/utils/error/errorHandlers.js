import { AlreadyExists, BadRequest, InternalServerError, NotFound } from './customErrors.js';

const handleErrors = (error, req, res, detail) => {
    const showError = (httpStatus) => {
        console.log('**********************************************');
        console.log(detail);
        console.log(req.body);
        console.log('error.message: ' + error.message);
        return res.status(httpStatus).send({ success: false, message: error.message });
    };

    if (error instanceof BadRequest) {
        showError(400);
    } else if (error instanceof AlreadyExists) {
        showError(400);
    } else if (error instanceof InternalServerError) {
        showError(500);
    } else if (error instanceof NotFound) {
        showError(404);
    } else {
        showError(500);
    }
};

export default {
    handleErrors
};