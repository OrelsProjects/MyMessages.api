const AWS = require("aws-sdk");
const express = require("express");
const serverless = require("serverless-http");
const { v4 } = require('uuid');
const { dynamoDbClient } = require('./database');


const app = express();

const USERS_TABLE = 'users';
const PHONE_CALLS_TABLE = 'phone_calls';
const MESSAGES_SENT_TABLE = 'messages_sent';
const MESSAGES_TABLE = 'messages';
const FODLERS_TABLE = 'folders';
const MESSAGES_IN_FOLDERS_TABLE = 'messages_in_folders'

/* USERS */


// const schema = yup.object().shape({
//   first_name: yup.string().required(),
//   last_name: yup.string().required(),
//   gender: yup.string().required(),
// });

app.use(express.json());

app.get("/users/:id", async function (req, res) {
  const id = req.params.id;
  const params = {
    TableName: USERS_TABLE,
    Key: {
      id: id,
    },
  };

  try {
    const { Item } = await dynamoDbClient.get(params).promise();
    if (Item) {
      res.json(Item);
    } else {
      res
        .status(404)
        .json({ error: 'Could not find user with provided "id"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive user" });
  }
});;

app.post("/users", async function (req, res) {
  try {
    const body = req.body;
    const id = v4();
    body.id = id;
    const params = {
      TableName: USERS_TABLE,
      Item: body,
    };
    var result = await dynamoDbClient.put(params);
    result = await result.promise();
    res.json({
      body,
      executionDate: ` ${(new Date()).getTime()}`,
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create user" });
  }
});

/*  PHONECALLS  */

app.post("/phonecalls", async function (req, res) {
  try {
    const { number, contact_name, start_date, end_date, is_answered, type, messages_sent, user_id } = req.body;
    const id = v4();
    const object = { id, user_id, number, contact_name, start_date, end_date, is_answered, type }
    const params = {
      TableName: PHONE_CALLS_TABLE,
      Item: object,
    };
    await dynamoDbClient.put(params).promise();
    await addMessagesSent(messages_sent, id);
    res.json({
      object,
      executionDate: `${(new Date()).getTime()}`,
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create phonecall" });
  }
});;

const addMessagesSent = async (messages_sent, phone_call_id) => {
  if (!Array.isArray(messages_sent)) {
    return;
  }
  messages_sent.forEach((message_sent) => {
    message_sent.id = v4();
    message_sent.phone_call_id = phone_call_id;
  });
  await batchWrite(messages_sent, MESSAGES_SENT_TABLE).promise();
}

/* Messages */
app.post("/messages", async function (req, res) {
  try {
    const { title, short_title, body, folder_id, user_id } = req.body;
    const message_id = v4();
    const message_in_folder_id = v4();
    const object = { id: message_id, user_id, title, short_title, body, used_count: 0, is_active: true, position: 0 }
    const messageParams = {
      TableName: MESSAGES_TABLE,
      Item: object,
    };
    const messageInFolderParams = {
      TableName: MESSAGES_IN_FOLDERS_TABLE,
      Item: {
        id: message_in_folder_id,
        user_id,
        message_id: message_id,
        folder_id: folder_id,
      }
    }
    await dynamoDbClient.put(messageParams).promise();
    await dynamoDbClient.put(messageInFolderParams).promise();
    res.json({ message_id })
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create the message" });
  }
});

app.get("/messages/:uid", async function (req, res) {
  try {
    const user_id = req.params.uid;
    const params = {
      TableName: MESSAGES_TABLE,
      KeyConditionExpression: '#user_id = :user_id',
      ExpressionAttributeNames: {
        '#user_id': 'user_id',
      },
      ExpressionAttributeValues: {
        ':user_id': { S: user_id },
      },
    };
    const result = await dynamoDbClient.query(params).promise();
    let items = result.Items;
    res.json({ items });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not fetch the messages" });
  }
});

/* Folders */
app.post("/folders", async function (req, res) {
  try {
    const { title, user_id } = req.body;
    const id = v4();
    const object = { id, user_id, title, used_count: 0, is_active: true, position: 0 }
    const params = {
      TableName: FODLERS_TABLE,
      Item: object,
    };
    await dynamoDbClient.put(params).promise();
    res.json({ id })
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create folder" });
  }
});

app.get("/folders/:user_id", async function (req, res) {
  try {
    const result = await dynamoDbClient.scan({
      TableName: FODLERS_TABLE,
    }).promise();
    let items = result.Items
    res.json({ items })
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not fetch folders" });
  }
});

const batchWrite = (items, table_name) => {
  const batchItems = toBatchItems(items);
  const requestItems = {};
  requestItems[table_name] = batchItems;
  return dynamoDbClient.batchWrite({
    RequestItems: requestItems,
  });
}

const toBatchItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }
  var batchItems = [];
  items.forEach((item) => {
    batchItems.push({
      PutRequest: {
        Item: item
      }
    });
  });
  return batchItems;
}

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
