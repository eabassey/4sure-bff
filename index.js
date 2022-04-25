'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const {mergeAll} = require('ramda');
const mingo = require("mingo");
const axios = require('axios');
const http = require('http');
const https = require('https');
import fetch from 'node-fetch';


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
  res.setHeader('x-4sure', 'You should be working for us now..');
  // res.removeHeader('x-powered-by');
  next();
});
// app.use(bodyParser.json({ limit: process.env.REQUEST_LIMIT || '100kb' }));
// app.use(bodyParser.urlencoded({ extended: true, limit: process.env.REQUEST_LIMIT || '100kb' }));
// app.use(bodyParser.text({ limit: process.env.REQUEST_LIMIT || '100kb'}));
// app.use(cookieParser(process.env.SESSION_SECRET));

const runQuery = (query, collection) => {
    return mingo.find(collection, query.find).all();
};

const runCalls = (req) => {
    const backends = req.body.backends;
   return backends.map(backend => {
        const {url, query, key} = backend;
        const axiosData = {
            url,
            headers: {},
            method: 'get',
              // `httpAgent` and `httpsAgent` define a custom agent to be used when performing http
                // and https requests, respectively, in node.js. This allows options to be added like
                // `keepAlive` that are not enabled by default.
                httpAgent: new http.Agent({ keepAlive: true, rejectUnauthorized: false }),
                httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: false }),
        };

        // FOWARED HEADERS TO BACKENDS
        if(req.headers) {
            axiosData.headers = req.headers;
        }

        //
        return axios(axiosData)
          .then(response => {
            console.log({ check: response.data });
            const result = query ? runQuery(query, response.data) : response.data;
            return key ? {[key]: result} : result;
          })
          .catch(err => console.error({ err }));
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

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);