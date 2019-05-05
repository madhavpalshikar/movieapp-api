let models = {};

models.movies = {
    "99popularity": Number,
    "director": String,
    "genre": Array,
    "imdb_score": Number,
    "name": String,
    "isDeleted": Boolean,
    "users": Array
};

models.groups = {
    "group": String,
    "permissions": Array
};

models.users = {
    "name": String,
    "username": String,
    "password": String,
    "group": String
};

module.exports = models;
