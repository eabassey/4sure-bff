'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const {mergeAll} = require('ramda');
const mingo = require("mingo");
const fetch = require('node-fetch');
const http = require('http');
const https = require('https');

const {Aggregator} = require("mingo/aggregator");
const { useOperators, OperatorType } = require("mingo/core");
const { $match, $group, } = require("mingo/operators/pipeline");
const { $min, $first, $sum } = require("mingo/operators/accumulator");

useOperators(OperatorType.PIPELINE, { $match, $group });
useOperators(OperatorType.ACCUMULATOR, { $min, $first, $sum });


// Constants
const PORT = process.env.PORT || 3030;
const HOST = '0.0.0.0';


// App
const app = express();


// Middlewares
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*")
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
//   next();
// });
// Custom Headers
app.use((req, res, next) => {
  res.setHeader('X-4SURE', 'Genius, if you are looking at this, you should be working with us.');
  // res.removeHeader('x-powered-by');
  next();
});
// app.use(bodyParser.json({ limit: process.env.REQUEST_LIMIT || '100kb' }));
// app.use(bodyParser.urlencoded({ extended: true, limit: process.env.REQUEST_LIMIT || '100kb' }));
// app.use(bodyParser.text({ limit: process.env.REQUEST_LIMIT || '100kb'}));
// app.use(cookieParser(process.env.SESSION_SECRET));

const runQuery = (query, collection) => {
    // let cursor;
    //  cursor = mingo.find(collection, query.where || {}, query.select || {});
    
    //  if (query.skip) {
    //     cursor = cursor.skip(query.skip)
    // }

    // if (query.limit) {
    //     cursor = cursor.limit(query.limit)
    // }

    // if (query.sort) {
    //     cursor = cursor.sort(query.sort)
    // }
    // return cursor.all();
    let agg = new Aggregator(query);
      
      // return an iterator for streaming results
      let result = agg.run(collection);
      return result;
};

const runCalls = (req) => {
    const backends = req.body.backends;
   return backends.map(backend => {
        const {url, query, key} = backend;
        let config = {};


        // FOWARED HEADERS TO BACKENDS
        if(req.headers['authorization']) {
            if (!config.headers) {
                config.headers = {};
            }
            config.headers['authorization'] = req.headers['authorization'];
        }

        //
        return fetch(url, config)
            .then(res => res.json())
            .then(data => {
                console.log({ checker: config });
                const result = query ? runQuery(query, data) : data;
                return {[key]: result};
            })
            .catch(err => console.error({ err }))
    });

}

//
// data { backends: [{key: 'pet', url: '', query: {}}]}
app.post('/query', async (req, res) => {
    const opts = runCalls(req);
    const result = await Promise.all(opts);
    const mergedResult = mergeAll(result);
    res.json(mergedResult);
});

app.get('hello', (req, res) => {
    res.json({hello: 'world'});
})

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);