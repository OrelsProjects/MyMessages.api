require('dotenv').config();

const knex = require('knex')({
  client: 'pg',
  connection: {
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  },
  migrations: {
    tableName: 'migrations'
  }
});

const runRequest = async (req, res, request) => {
  try {
    const result = await request(req);
    console.log(`query result: ${result}, at: ${new Date()}`);
    res.status(200).json({
      body: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(
      {
        body: null,
        error: "Request failed."
      });
  }
}

const runRequestCallback = async (req, res, request) => {
  try {
    request(req, callback, callbackError);
  } catch (error) {
    console.log(error);
    res.status(500).json(
      {
        body: null,
        error: "Request failed."
      });
  }
}

const callbackError = (res, error) => {
  console.log(error);
  res.status(500).json(
    {
      body: null,
      error: "Request failed."
    });
}

const callback = (res, queryResult) => {
  try {
    res.status(200).json({
      body: queryResult,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(
      {
        body: null,
        error: "Request failed."
      });
  }
}

/* Knex Debugging */

// function isTransactionStart(querySpec) {
//   return querySpec.sql === 'BEGIN;';
// }

// function isTransactionEnd(querySpec) {
//   return querySpec.sql === 'COMMIT;' || querySpec.sql === 'ROLLBACK;';
// }

// const transactionDurations = {};

// knex.on('query', querySpec => {
//   console.log('On query', querySpec);

//   if (isTransactionStart(querySpec)) {
//     if (transactionDurations[querySpec.__knexUid]) {
//       console.error('New transaction started, before earlier was ended');
//       return;
//     }
//     transactionDurations[querySpec.__knexUid] = new Date().getTime();
//   }

//   if (isTransactionEnd(querySpec)) {
//     const startTime = transactionDurations[querySpec.__knexUid];
//     if (!startTime) {
//       console.error('Transaction end detected, but start time not found');
//     }
//     const endTime = new Date().getTime();
//     transactionDurations[querySpec.__knexUid] = null;
//     console.log('TRANSACTION DURATION', endTime - startTime);
//   }
// });

// // just as an example of other available events to show when they are called
// knex.on('query-response', (res, querySpec) => {
//   console.log('On query response', res, querySpec);
// });

// knex.on('query-error', (err, querySpec) => {
//   console.log('On query error', err, querySpec);
// });
/* Knex Debugging */

module.exports = {
  runRequest,
  knex,
  runRequestCallback,
};