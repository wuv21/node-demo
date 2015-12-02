/*
    server.js
    main server script for our task list web service
*/

//require various modules we will need
var path = require('path');                 //path building helper library
var express = require('express');           //express.js framework
var bodyParser = require('body-parser');    //request body parsing middleware
var morgan = require('morgan');             //request logging middleware
var sqlite = require('sqlite3');            //sqlite driver

//create the Express application
var app = express();

//log all requests to stdout using the 'dev' format
app.use(morgan('dev'));

//automatically parse JSON posted in the request body
//parsed data will be available on the req.body property
app.use(bodyParser.json());

//serve static files from the /static subdirectory
app.use(express.static(path.join(__dirname, 'static')));

//implement API routes
app.get('/api/tasks', function(req, res, next) {
    db.all('select rowid, * from tasks where done == 0', function(err, rows) {
        if (err) {
            return next(err);
        }

        res.json(rows);
    });
});

app.post('/api/tasks', function(req, res, next) {
    var newTask = {
        title: req.body.title || 'New Task',
        done: false,
        createdOn: new Date()
    };
    var sql = 'insert into tasks (title, done, createdOn) values (?,?,?)';
    db.run(sql, [newTask.title, newTask.done, newTask.createdOn], function(err) {
        if (err) {
            return next(err);
        }

        newTask.rowid = this.lastID;

        res.status(201).location('/api/tasks/' + newTask.rowid).json(newTask);
    });
});

app.put('/api/tasks/:rowid', function(req, res, next) {
    var sql = 'update tasks set done=? where rowid=?';
    db.run(sql, [req.body.done, req.params.rowid], function(err) {
        if (err) {
            return next(err);
        }

        res.json(res.body);
    });
});


//error handler
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json(err);
});

//open/create the SQLite database
var db = new sqlite.Database(path.join(__dirname, 'data/tasks.db'), function(err) {
    //if there was an error, throw and exit
    if (err) {
        throw err;
    }

    //ensure that our tasks table exists
    db.run('create table if not exists tasks(title string, done int, createdOn datetime)', function(err) {
        if (err) {
            throw err;
        }

        //start the web server
        app.listen(8080, function() {
            console.log('server listening on http://localhost:8080');
        });

    });
});

//close the database when the process exits
process.on('exit', function(code) {
    console.log('closing the database');
    db.close();
});
