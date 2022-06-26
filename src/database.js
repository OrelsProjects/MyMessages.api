const AWS = require("aws-sdk");

AWS.config.loadFromPath("./secrets.json");
const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

module.exports = { dynamoDbClient };