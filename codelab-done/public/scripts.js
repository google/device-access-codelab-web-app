
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

// Authentication Constants:
const OAUTH_SCOPE = "https://www.googleapis.com/auth/sdm.service";
const SERVER_URI = "https://[GCP-Project-Id].web.app";
const REDIRECT_URI = SERVER_URI + "/auth";
const PROXY_URI = SERVER_URI + "/proxy";

// Partner Credentials:
var clientId = "";
var clientSecret = "";
var projectId = "";

// Authentication Variables:
var oauthCode = "[OAuth Code...]";
var accessToken = "[Access Token...]";
var refreshToken = "[Refresh Token...]";

// State Variables:
var isSignedIn = false;
var deviceId = "";



/// Primary Functions ///


/** init - Initializes the loaded javascript */
function init() {
  readStorage();          // Reads data from browser's local storage if available
  handleAuth();           // Checks incoming authorization code from /auth path 
  exchangeCode();         // Exchanges authorization code to an access token
}

/** readStorage - Reads data from browser's local storage if available */
function readStorage() {
  if (localStorage["clientId"]) {
    updateClientId(localStorage["clientId"]);
  }
  if (localStorage["clientSecret"]) {
    updateClientSecret(localStorage["clientSecret"]);
  }
  if (localStorage["projectId"]) {
    updateProjectId(localStorage["projectId"]);
  }
  
  if (localStorage["oauthCode"]) {
    updateOAuthCode(localStorage["oauthCode"]);
  }
  if (localStorage["accessToken"]) {
    updateAccessToken(localStorage["accessToken"]);
  }
  if (localStorage["refreshToken"]) {
    updateRefreshToken(localStorage["refreshToken"]);
  }
  
  if (localStorage["isSignedIn"] === true || localStorage["isSignedIn"] === "true") {
    updateSignedIn(localStorage["isSignedIn"]);
  }
}

/** handleAuth - Detects and sends oauth response code to server */
function handleAuth () {
  
  // Check if the url is beginning with /auth.
  if (window.location.pathname.startsWith("/auth")) {
    console.log("/auth detected!");
    
    // Retreive query parameters from url.
    var queryparams = window.location.search.split("&");     
    
    // Extract key-value pairs from parameters.
    for (var i = 0; i < queryparams.length; i++) {
      var key = queryparams[i].split("=")[0];
      var val = queryparams[i].split("=")[1];
      
      // Send oAuth Code to server if found.
      if (key === "code") {
        updateOAuthCode(val);
      }
    }
    
    // Prevent back button action by injecting a previous state.
    window.history.pushState("object or string", "Title", "/");   
  }
}

/** exchangeCode - Exchanges OAuth Code to OAuth Tokens */
function exchangeCode() {
  if (oauthCode !== "[OAuth Code...]" && accessToken === "[Access Token...]" ) {
    var payload = {
      code: oauthCode,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    };

    var xhr = new XMLHttpRequest();
    xhr.open('POST', "https://www.googleapis.com/oauth2/v4/token");
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.onload = function () {
      var parsedResponse = JSON.parse(xhr.responseText);
      updateAccessToken(parsedResponse.access_token);
      updateRefreshToken(parsedResponse.refresh_token);
      updateSignedIn(true);
    };
    xhr.send(JSON.stringify(payload));
  }
}

/** oAuthSignIn - Handles the Sign-in button functionality */
function oauthSignIn() {
   
  // Google's OAuth 2.0 endpoint for requesting an access token:
  var oauthEndpoint = "https://nestservices.google.com/partnerconnections/" +
      projectId + "/auth";

  // Create <form> element to submit parameters to OAuth 2.0 endpoint.
  var form = document.createElement('form');
  form.setAttribute('method', 'GET');
  form.setAttribute('action', oauthEndpoint);

  // Parameters to pass to OAuth 2.0 endpoint.
  var params = {
    'access_type': 'offline',
    'client_id': clientId,
    'include_granted_scopes': 'true',
    'prompt' : 'consent',
    'redirect_uri': REDIRECT_URI,
    'response_type': 'code',
    'scope': OAUTH_SCOPE,
    'state': 'pass-through value'
  };

  // Add form parameters as hidden input values.
  for (var p in params) {
    var input = document.createElement('input');
    input.setAttribute('type', 'hidden');
    input.setAttribute('name', p);
    input.setAttribute('value', params[p]);
    form.appendChild(input);
  }

  // Add form to page and submit it to open the OAuth 2.0 endpoint.
  document.body.appendChild(form);
  form.submit();
}

/** oAuthSignIn - Handles the Sign-out button functionality */
function oauthSignOut() {
  // updateClientId("");
  // updateClientSecret("");
  // updateProjectId("");
  
  updateOAuthCode("[OAuth Code...]");
  updateAccessToken("[Access Token...]");
  updateRefreshToken("[Refresh Token...]");
  
  clearDevices();
  
  updateSignedIn(false);
}



/// Device Access Functions ///


function deviceAccessRequest(method, call, localpath, payload = null) {
    var xhr = new XMLHttpRequest();
    
    // We are doing our post request to device access endpoint:
    xhr.open(method, "https://smartdevicemanagement.googleapis.com/v1" + localpath);
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.onload = function () {
      // Response is passed to deviceAccessResponse function:
      deviceAccessResponse(call, xhr.response)
    };
    
    if ('POST' === method && payload)
        xhr.send(JSON.stringify(payload));
    else
        xhr.send();
}

function proxyRequest(method, call, localpath, payload = null) {

    var xhr = new XMLHttpRequest();
    
    // We are doing our post request to our proxy server:
    xhr.open(method, PROXY_URI);
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.onload = function () {
      // Response is passed to deviceAccessResponse function:
      deviceAccessResponse(call, xhr.response);
    };
    
    // We are passing the device access endpoint in address field of the payload:
    payload.address = "https://smartdevicemanagement.googleapis.com/v1" + localpath;
    
    if ('POST' === method && payload)
        xhr.send(JSON.stringify(payload));
    else
        xhr.send();
}

function deviceAccessResponse(call, response) {
  console.log(response);
  switch(call) {
    case 'listDevices':
      var data = JSON.parse(response);
      var devices = data.devices;
      
      clearDevices();
      
      for (let i = 0; i < devices.length; i++) {
        var str = data.devices[i].name;
        var n = str.lastIndexOf('/');
        var devName = str.substring(n + 1);
        addDevice(devName);
      }
      break;
    case 'thermostatMode':
      console.log("Thermostat Mode Set!");
      break;
    case 'temperatureSetpoint':
      console.log("Temperature Setpoint Set!");
      break;
    default:
      console.log("Unknown call!");
  }
}



/// Helper Functions ///


function addDevice(deviceName){
  // Create an Option object       
  var opt = document.createElement("option");        

  // Assign text and value to Option object
  opt.text = deviceName;
  opt.value = deviceName;

  // Add an Option object to Drop Down List Box
  id("sctDeviceSelect").options.add(opt);
  
  // If this is the first device added, choose it
  if(id("sctDeviceSelect").options.length == 1){
    deviceId = deviceName;
  }
}

function clearDevices(){
  var length = id("sctDeviceSelect").options.length;
  for (let i = length - 1; i >= 0; i--) {
    id("sctDeviceSelect").options[i] = null;
  }
}



/// UI Controller Functions ///


function signInOut() {
  if (isSignedIn) {
    oauthSignOut();
  } else { 
    var gSignInMeta = document.createElement("meta");
    gSignInMeta.name = "google-signin-client_id";
    gSignInMeta.content = clientId;
    document.head.appendChild(gSignInMeta);
    
    oauthSignIn();
  }
}

function selectDevice() {
  console.log("Selected Device...");
  deviceId = id("sctDeviceSelect").value;
}



/// Device Access Functions ///


function listDevices() {
  var endpoint = "/enterprises/" + projectId + "/devices";
  deviceAccessRequest('GET', 'listDevices', endpoint);
}

function postThermostatMode() {
  var endpoint = "/enterprises/" + projectId + "/devices/" + deviceId + ":executeCommand";
  var tempMode = id("tempMode").value;
  var payload = {
    "command": "sdm.devices.commands.ThermostatMode.SetMode",
    "params": {
      "mode": tempMode
    }
  };
  
  proxyRequest('POST', 'thermostatMode', endpoint, payload);
}


function postTemperatureSetpoint() {
  var endpoint = "/enterprises/" + projectId + "/devices/" + deviceId + ":executeCommand";
  var heatCelsius = parseFloat(id("heatCelsius").value);
  var coolCelsius = parseFloat(id("coolCelsius").value);

  var payload = {
    "command": "",
    "params": {}
  };
  
  if ("HEAT" === id("tempMode").value) {
    payload.command = "sdm.devices.commands.ThermostatTemperatureSetpoint.SetHeat";
    payload.params["heatCelsius"] = heatCelsius;
  }
  else if ("COOL" === id("tempMode").value) {
    payload.command = "sdm.devices.commands.ThermostatTemperatureSetpoint.SetCool";
    payload.params["coolCelsius"] = coolCelsius;
  }
  else if ("HEATCOOL" === id("tempMode").value) {
    payload.command = "sdm.devices.commands.ThermostatTemperatureSetpoint.SetRange";
    payload.params["heatCelsius"] = heatCelsius;
    payload.params["coolCelsius"] = coolCelsius;
  } else {
    console.log("Off and Eco mode don't allow this function");
    return;
  }
  
  proxyRequest('POST', 'temperatureSetpoint', endpoint, payload);
}



/// UI Update Functions ///


/** id - Short form to get UI elements by handle */
function id(id) {
    return document.getElementById(id);
}

function typeClientId() {
  updateClientId(id("clientId").value);
}

function typeClientSecret() {
  updateClientSecret(id("clientSecret").value);
}

function typeProjectId() {
  updateProjectId(id("projectId").value);
}

function updateClientId(value) {
  clientId = value;
  localStorage["clientId"] = clientId;
  id("clientId").value = clientId;
}

function updateClientSecret(value) {
  clientSecret = value;
  localStorage["clientSecret"] = clientSecret;
  id("clientSecret").value = clientSecret;
}

function updateProjectId(value) {
  projectId = value;
  localStorage["projectId"] = projectId;
  id("projectId").value = projectId;
}

function updateOAuthCode(value) {
  oauthCode = value;
  localStorage["oauthCode"] = oauthCode;
  id("oauthCode").innerText = oauthCode;
}

function updateAccessToken(value) {
  accessToken = value;
  localStorage["accessToken"] = accessToken;
  id("accessToken").innerText = accessToken;
}

function updateRefreshToken(value) {
  refreshToken = value;
  localStorage["refreshToken"] = refreshToken;
  id("refreshToken").innerText = refreshToken;
}

function updateSignedIn(value) {
  isSignedIn = value;
  localStorage["isSignedIn"] = isSignedIn;
  
  if (isSignedIn) {
    id("btnSignIn").innerText = "Sign Out";
  }
  else {
    id("btnSignIn").innerText = "Sign In";
  }
}
