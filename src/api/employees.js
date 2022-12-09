const express = require('express');
const serverless = require('serverless-http');
const app = express();

app.get('/employees', async function (req, res) {
    res.status(200).send({ body: "worked" });
});


module.exports.handler = serverless(app);
