# Device Access Web Application Codelab

![Device Access Logo](https://www.gstatic.com/images/branding/product/2x/googleg_64dp.png)

Device Access enables access, control, and management of Nest devices within partner apps, solutions, and smart home ecosystems, using the Smart Device Management (SDM) API.

Developers can use the code in this repository with the [Building a Device Access Web Application](https://developers.google.com/nest/device-access/codelabs/web-app) codelab to build a functioning web application to control Nest Thermostats.

There are two variants of this codelab. `codelab-start` gives the full developer experience with some functions left blank for you to complete. `codelab-done` presents a fully functioning app, which you can deploy and use in a Firebase project after a few changes.

## Using codelab-start

Follow the steps in the [Building a Device Access Web Application](https://developers.google.com/nest/device-access/codelabs/web-app) codelab to build your application.

## Using codelab-done

Create a Firebase cloud project to host this app. Set the `SERVER_URI` in `scripts.js` to match the name of your project.

Navigate to `codelab-done/functions` directory

`cd device-access-codelab-web-app/codelab-done/functions`

Install necessary dependencies for the project

`npm install express firebase-tools xmlhttprequest --save`

Navigate back to codelab-done folder

`cd ..`

Deploy the app to your firebase project

`firebase deploy`

Enter the OAuth credentials you created on [Google Cloud Platform](https://console.cloud.google.com/), as well as the Project Id from the [Device Access Console](https://console.nest.google.com/device-access/) to complete the account linking flow for a Google account with a linked Nest Thermostat.

