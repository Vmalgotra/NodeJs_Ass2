var express = require('express');
var app1 = express();
const log = require("./log.js");
var port = process.env.port ||5001;

app1.get("/health", function (request, response) {
    log.info("oa a hit Service1");
    response.json({ "Message": "health is  OK " });
});

app1.get("/product", function (request, response) {
    response.json({ "Product": "AppDynamics" });
});
app1.listen(port, function () {
    var datetime = new Date();
    var message = "Server runnning on Port:- " + port + "Started at :- " + datetime;
    log.info(message );
});

process.on('SIGTERM', () => {
    log.info('SIGTERM signal received. Initiating graceful shutdown.');
    setTimeout(() => {
        log.info('Completed resource cleanup. Shutting Down');
        process.exit(0);
    }, 10000);
  });

process.on('SIGINT', () => {
    log.info('SIGINT signal received.');
    setTimeout(() => {
        log.info('Shutting Down');
        process.exit(0);
    }, 10000);
  });

  