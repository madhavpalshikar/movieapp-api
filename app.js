const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const md5 = require('md5');
const models = require('./models');

app.use(session(
    { secret: 'movie', resave: false, saveUninitialized: true, cookie: { maxAge: 1200000 }}    
));

mongoose.connect('mongodb://madhav:db1988@ds149596.mlab.com:49596/movieapp', 
    {useNewUrlParser: true }, (err)=>{
        if(err) {
            console.log('Some problem with the connection ' +err);
        }else{
            console.log('The Mongoose connection is ready');
        }
});

// setting up the schema models
let movies = mongoose.model('movies', models.movies);
let groups = mongoose.model('groups', models.groups);
let users = mongoose.model('users', models.users);

// Loading the group permissions
let groupPermissions = [];
groups
    .find()
    .exec()
    .then(data => {
        for (const key in data) {
           groupPermissions[data[key].group] = data[key].permissions;
        }
    })
    .catch(function(err){
       console.log('error', err);
    })

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: "6080117629",
    resave: false,
    saveUninitialized: true
}));

app.get('/', (req, res) => {
    res.send('Welcome to Movieapp-api');
});

app.post('/getAuthorize', (req, res) => {
    users
        .find()
        .where("username").equals(req.body.username)
        .where("password").equals(md5(req.body.password))
        .exec()
        .then(data => {
            console.log('Authorization', data);
            if(data.length > 0){
                req.session.userID = data[0]._id;
                req.session.username = data[0].username;
                req.session.group = data[0].group;
                req.session.token = md5(data[0]._id + Math.random());
                res.send(JSON.stringify({status:200, isAuthorized: true, accessToken: req.session.token, message: "Welcome "+ data[0].name +" to Moviesapp-api"}));
            }
            else{
                res.send(JSON.stringify({status:400, isAuthorized: false, message: "Sorry! Authorization Failed."}));
            }
        })
        .catch(function(err){
            res.send(JSON.stringify({status: 400, message: 'Error', error: err}));
        })
    
});

app.use('/movie', (req, res, next) => {
    // check here groups and permissions
   if(req.session.token && req.session.token == req.body.accessToken){
        if(req.session.group=="Admin"){
            next();
        }
        else if(groupPermissions[req.session.group].indexOf(req.path) > -1){    
            next();
        }
        else{
            res.send(JSON.stringify({status:400, isAuthorized: false, message: "Sorry! You do not have permission to access this api"}));
        }
    }
    else
    {
        res.send(JSON.stringify({status:400, isAuthorized: false, message: "Sorry! Authorization Failed."}));
    }
})

app.post('/movie/add', (req, res) => {
    let movieData = {};
    let datacheck = false;
    if(req.body.genre){
        movieData.genre = req.body.genre.split(',');
        datacheck = true;
    }

    if(req.body["99popularity"]){
        movieData["99popularity"] = req.body["99popularity"];
        datacheck = true;
    }

    if(req.body.director){
        movieData.director = req.body.director;
        datacheck = true;
    }

    if(req.body.imdb_score){
        movieData.imdb_score = req.body.imdb_score;
        datacheck = true;
    }

    if(req.body.name){
        movieData.name = req.body.name;
        datacheck = true;
    }

    if(datacheck){
        movies
            .create(movieData)
            .then(record => {
                console.log('movieData', record);
                res.send(JSON.stringify({status: 200, message: 'Movie '+movieData.name+' added successfully.', data: record }));
            })
            .catch(function(err){
                res.send(JSON.stringify({status: 400, message: 'Error', error: err}));
            })
    }
    else{
        res.send(JSON.stringify({status: 400, message: 'Please Send valid parameters' }));
    }
});

app.post('/movie/update', (req, res) => {
    let movieData = {};
    let datacheck = false;
    if(req.body.genre){
        movieData.genre = req.body.genre.split(',');
        datacheck = true;
    }

    if(req.body["99popularity"]){
        movieData["99popularity"] = req.body["99popularity"];
        datacheck = true;
    }

    if(req.body.director){
        movieData.director = req.body.director;
        datacheck = true;
    }

    if(req.body.imdb_score){
        movieData.imdb_score = req.body.imdb_score;
        datacheck = true;
    }

    if(req.body.name){
        movieData.name = req.body.name;
        datacheck = true;
    }

    if(datacheck){
        movies
        .updateOne({ _id: req.body.id }, movieData)
        .then(data => {
            res.send(JSON.stringify({status: 200, message: 'Movie '+req.body.id+' updated' }));
        })
        .catch(function(err){
            res.send(JSON.stringify({status: 400, message: 'Error', error: err}));
        })
    }
    else{
        res.send(JSON.stringify({status: 400, message: 'Please Send valid parameters' }));
    }
});

app.post('/movie/delete', (req, res) => {
    movies
        .updateOne({ _id: req.body.id }, { isDeleted: true})
        .then(data => {
            res.send(JSON.stringify({status: 200, message: 'Movie '+req.body.id+' deleted from the record.' }));
        })
        .catch(function(err){
            res.send(JSON.stringify({status: 400, message: 'Error', error: err}));
        })
});

app.post('/movie/view', (req, res) => {

    if(req.session.group == "Admin"){
        // All movies (with soft deleted records)
        movies
        .find()
        .exec()
        .then(data => {
            res.send(JSON.stringify(data));
        })
        .catch(function(err){
            res.send(JSON.stringify({status: 400, message: 'Error', error: err}));
        })
    }
    else
    {
        movies
        .find({users: req.session.username, isDeleted: false})
        .select(["genre","_id","99popularity","director","imdb_score","name"])
        .exec()
        .then(data => {
            res.send(JSON.stringify(data));
        })
        .catch(function(err){
            res.send(JSON.stringify({status: 400, message: 'Error', error: err}));
        })
    }


});

app.use('/admin', (req, res, next) => {
    // checking if it's admin
    if(req.session.token && req.session.token == req.body.accessToken){
        if(req.session.group=="Admin"){    
            next();
        }
        else{
            res.send(JSON.stringify({status:400, isAuthorized: false, message: "Sorry! You do not have permission to access this api"}));
        }
    }
    else
    {
        res.send(JSON.stringify({status:400, isAuthorized: false, message: "Sorry! Authorization Failed."}));
    }
});

app.post('/admin/changeUserRole', (req, res) => {

    if(groupPermissions[req.body.group]){
        users
        .find({username: req.body.username})
        .exec()
        .then(rec => {
            if(rec.length > 0){
                users
                .updateOne({ username: req.body.username }, { group: req.body.group})
                .then(data => {
                    res.send(JSON.stringify({status: 200, message: 'Group is updated for user '+req.body.username }));
                })
            }
            else
            {
                res.send(JSON.stringify({status: 400, message: 'Invalid Username' }));
            }
        })
        .catch(function(err){
            res.send(JSON.stringify({status: 400, message: 'Error', error: err}));
        })
           
    }
    else
    {
        res.send(JSON.stringify({status: 400, message: 'Invalid Group Name' }));
    }
});

app.post('/admin/assignMovie', (req, res) => {
    movies
        .find({users: req.body.username})
        .exec()
        .then(rec => {
            if(rec.length > 0){
                res.send(JSON.stringify({status: 200, message: 'This user has already assigned to this movies.'}));
            }
            else{
                movies
                .updateOne(
                    { _id: req.body.id }, 
                    { $push: { users: req.body.username } }
                )
                .then(data => {
                    movies
                        .find()
                        .where('_id').equals(req.body.id)
                        .exec()
                        .then(record => {
                            res.send(JSON.stringify({status: 200, data: record, message: 'User has been successfully assigned.'}));
                        })
                        .catch(function(err){
                            res.send(JSON.stringify({status: 400, message: 'Error', error: err}));
                        })
                })
                .catch(function(err){
                    res.send(JSON.stringify({status: 400, message: 'Error', error: err}));
                })
            }
        })
        .catch(function(err){
            res.send(JSON.stringify({status: 400, message: 'Error', error: err}));
        })
});

app.post('/admin/unassignMovie', (req, res) => {
    movies
        .find({users: req.body.username})
        .exec()
        .then(rec => {
            if(rec.length > 0){
                movies
                    .updateOne( {_id: req.body.id}, { $pull: {users: req.body.username } } )
                    .then(record => {
                        res.send(JSON.stringify({status: 200, message: 'User has been successfully unassigned.', data: record}));
                    })
                    .catch(function(err){
                        res.send(JSON.stringify({status: 400, message: 'Error', error: err}));
                    })
                }
            else{
                res.send(JSON.stringify({status: 400, message: 'User is not present in the movie access list'}));
            }
        })
});

app.post('/admin/allUsers', (req, res) => {
        users
        .find()
        .exec()
        .then(data => {
            res.send(JSON.stringify(data));
        })
        .catch(function(err){
            res.send(JSON.stringify({status: 400, message: 'Error', error: err}));
        })

});

app.listen(3000, (err)=>{
    if(err){
        console.log('Error:', err);
        return;
    }
    console.log('Movieapp-api running on port 3000');
});