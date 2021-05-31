const bodyParser = require('body-parser')
const cors = require('cors')
const errorhandler = require('errorhandler')
const express = require('express')
const http = require('http')
const methods = require('methods')
const morgan = require('morgan')
const passport = require('passport')
const path = require('path')
const session = require('express-session')

const model = require('./models')
const config = require('./config')
require('./config/passport')

function doStart(app) {
  app.use(cors())

  // Normal express config defaults
  app.use(morgan('combined'))
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())
  app.use(require('method-override')())
  const buildDir = path.join(__dirname, 'react-redux-realworld-example-app', 'build');
  app.use(express.static(buildDir));
  app.get(new RegExp('^(?!' + config.apiPath + '(/|$))'), function (req, res) {
    res.sendFile(path.join(buildDir, 'index.html'));
  });
  app.use(session({ secret: 'conduit', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }))
  app.use(require('./routes'))

  // 404 handler.
  app.use(function (req, res, next) {
    res.status(404).send('error: 404 Not Found ' + req.path)
  })

  // Error handlers
  if (config.isProduction) {
    app.use(function(err, req, res, next) {
      res.status(500).send('error: 500 Internal Server Error')
    });
  } else {
    app.use(errorhandler())
  }

  if (!module.parent) {
    (async () => {
      try {
        await model.sequelize.authenticate();
        await model.sequelize.sync();
        start();
      } catch (e) {
        console.error(e);
        process.exit(1)
      }
    })()
  }
}

function start(cb) {
  const server = app.listen(config.port, function() {
    console.log('Backend listening on: http://localhost:' + config.port)
    cb && cb(server)
  })
}

const app = express()
doStart(app)

module.exports = { app, start }
