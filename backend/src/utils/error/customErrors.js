export class AlreadyExists extends Error {
    constructor(message) {
        super(message);
        this.name = "AlreadyExists";
    }
}

export class BadRequest extends Error {
    constructor(message) {
        super(message);
        this.name = 'BadRequest';
    }
}

export class InternalServerError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InternalServerError';
    }
}

export class NotFound extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFound';
    }
}
