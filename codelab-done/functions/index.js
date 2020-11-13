
/* Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const functions = require('firebase-functions');
const express = require('express');
const http = require('http');

const app = express();
app.use(express.json());


//***** Device Access - Proxy Server *****//

// Serving Get Requests (Not used) 
app.get('*', (request, response) => {
  response.status(200).send("Hello World!");
});

// Serving Post Requests
app.post('*', (request, response) => {
  
  setTimeout(() => {
    // Read the destination address from payload:
    var destination = request.body.address;
    
    // Create a new proxy post request:
    var xhr = new XMLHttpRequest();
    xhr.open('POST', destination);
    
    // Add original headers to proxy request:
    for (var key in request.headers) {
    	var value = request.headers[key];
      xhr.setRequestHeader(key, value);
    }
    
    // Add command/parameters to proxy request:
    var newBody = {};
    newBody.command = request.body.command;
    newBody.params = request.body.params;
    
    // Respond to original request with the response coming
    // back from proxy request (to Device Access Endpoint)
    xhr.onload = function () {
      response.status(200).send(xhr.responseText);
    };
    
    // Send the proxy request!
    xhr.send(JSON.stringify(newBody));
  }, 1000);
});

// Export our app to firebase functions:
exports.app = functions.https.onRequest(app);
