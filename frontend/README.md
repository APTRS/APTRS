
## What is this?

aptrs-react is a React front end to the [Automated Penetration Testing Reporting System](https://github.com/Anof-cyber/APTRS)

Written in TypeScript, this app uses no server resources except to deliver the JavaScript bundle. The back end relies on the APTRS [API](https://www.postman.com/anof-cyber/workspace/aptrs/collection/24236036-131e5e02-32e5-45be-9c15-02c91fe9230a)

## Installation

`npm install`

Note that this will also install a custom build of CK Editor in the `/packages/ckeditor` director

There is a file called `env.example` in the root of the project that you will need to customize. Copy it to `.env` or `.env.local` and add the API url.

## Available Scripts

In the project directory, you can run:

`npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

`npm test`

Launches the test runner in the interactive watch mode.\


`npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the docs about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.


