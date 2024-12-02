[Link to deployed version of this app](https://www.embedded-finance-dev.com)

**Note**: This application uses service workers via MSW (Mock Service Worker). Be aware that service workers can become stale in Chromium based browsers such as Chrome, which may require a page reload to ensure the service worker is active.

# Embedded Finance Showcase App

[Embedded Finance](https://www.jpmorgan.com/payments/solutions/embedded-finance) allows you to add a full range of finance features to your online experience. This showcase is a collection of code samples highlighting how to connect and use Embedded Finance APIs.

You can:

- Spin-up a sample application with UI that demonstrates the main use case for each endpoint. For example, making a transaction.
- Explore the API resources using a Postman Collection.
- Register as a developer and use the showcase application to send requests to live endpoints in our external UAT environment. You must set up SSL authentication for this option.

## What's included in this repo?

There are three main directories for you to access:

- `/app` for the showcase UI and server experience.
- `/postman` for the Postman Collection.
- `/embedded-finance-sdk` for the Embedded Finance SDK
- `/embedded-components` for the Embedded UI Components

### Application (App)

A TS/JS application with a client and server used to demonstrate how to integrate with our APIs on frontend applications.

All your actions on this application are served by mock data included in the app codebase.

### Postman Collection

Get straight to the API endpoints in action, make calls and see responses.
To use the Postman collection, import the collection file to Postman and follow the included setup instructions to access all possible calls to the Embedded Finance API. You will need certificates to run these calls.

### [Embedded Finance SDK](./embedded-finance-sdk/)

Embedded Finance SDK provides a set of tools to validate payment data based on the given country, handle complex conditional logic, and ensure a smooth implementation of UI. Currently published to NPM as [@jpmorgan-payments/embedded-finance-sdk](https://www.npmjs.com/package/@jpmorgan-payments/embedded-finance-sdk)

## Included in the App project folders

### [Client](./app/client/)

This is the core UI application written in TS/JS with the React framework. This application illustrates the various capabilities of Embedded Finance, using mocked responses stored within the codebase.

Such capabilities include:

- Making payments.
- Requesting a debit card.
- Adding a recipient. A recipient is someone you can make a payment to.
- Checking an account balance.
- Authenticating with ForgeRock using forgerock-javascript-sdk
  - To test this locally, you will need to define `VITE_FR_URL` and `VITE_FR_CLIENT` in `./app/client/.env`

Check out the [features](./app/client/src/features/) directory to explore the the components and hooks that explore these features.

### [API-Server](./app/server/)

If you would like to hit the API's using your own credentials you will need to run this codebase following the instructions within the readme. This code allows you to hit J.P. Morgan UAT APIs.

## Run the Showcase Application locally

Install and run a TS/JS application with a client and server used to demonstrate how to integrate with our APIs on frontend applications.

### Install and serve the app

This example requires Yarn.

To start our client code with mocked responses:

1. Clone this repo

2. Install the `client` folder:

```
cd app
cd client
yarn install
```

3. Start the UI:

```
yarn start
```

4. Open a browser and navigate to the locally deployed app using the URL provided in the command line. Usually `localhost:3000`.

You have deployed the showcase Embedded Finance app. Follow the onscreen instructions to explore the finance functionality available.

## Register as a developer for access to UAT

If you are interested in going further with Embedded Finance APIs, you can join the developer community at J.P. Morgan, and get access to the UAT environment.

This process can take a few days, and in order to make calls to the UAT, you must provide some SSL certificates.

To register as a developer with J.P. Morgan's APIs, visit [developer.payments.jpmorgan.com](https://developer.payments.jpmorgan.com).

Once you have completed onboarding, and you have the correct certificate files ready, you can upload them to your server.

**Warning**
Do not commit certificate files to your codebase. They must be stored on your server.

1. Create a folder called, for example, `certs` that is included in `.gitignore`.
2. Add your certificate files in the new folder.
3. Open `server.js` and check that the below lines match where your certs are:

```js
  agent: new https.Agent({
    key: fs.readFileSync('certs/jpmc.key'),
    cert: fs.readFileSync('certs/jpmc.crt'),
    passphrase: process.env.PASSPHRASE,
    rejectUnauthorized: false,
  }),
```

3. If your SSL certs have a passphrase create a `.env.local` file and include it
   here, otherwise delete this line.
4. Inside your Embedded Finance project, run:

```console
cd server
yarn install
yarn start
```

You can now send API calls to the Embedded Finance CAT environment.
