#!/usr/bin/env node

var express = require('express');
var nStore = require('nStore');
var DNode = require('dnode');
var Hash = require('traverse/hash');

var port = Number(process.argv[2]) || 9000;

var nStoreSession = require('nStoreSession');

var app = express.createServer();
app.use(express.staticProvider(__dirname + '/static'));
app.use(express.cookieDecoder());
app.use(express.bodyDecoder());
app.use(express.session({
    store : new nStoreSession({ dbFile : __dirname + '/data/sessions.db' }),
    secret : 'todo: set this in the stackvm site config with cli.js'
}));

app.configure('development', function () {
    app.use(express.errorHandler({ 
        dumpExceptions: true,
        showStack: true 
    }));
});

app.configure('production', function () {
    app.use(express.errorHandler());
});

app.get('/js/dnode.js', require('dnode/web').route());

var db = { user : nStore(__dirname + '/data/users.db') };
require('./lib/web')(app, db);

app.listen(port, '0.0.0.0');

var Service = require('./lib/service');
db.user.all(function (err, hashes, metas) {
    Service(db, function (service) {
        DNode(service).listen(app, {
            transports : 'websocket xhr-multipart xhr-polling htmlfile'
                .split(/\s+/),
        });
        console.log('StackVM running at http://localhost:' + port);
    });
});