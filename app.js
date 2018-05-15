const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const favicon = require('serve-favicon');
const logger = require('morgan');
const mongoose = require('mongoose');
const path = require('path');

const config = require('./config/config').instance;
const ModuleLoader = require('./module-loader');

//Set up app
const appPort = config.app.port;
const app = express();
app.listen(appPort, () => {
	console.log('[Mercury] Listening on port ' + appPort);
});

//Set up DB
const dbSchema = config.db.schema;
const dbUrl = config.db.url;
const dbPort = config.db.port;
const dbString = 'mongodb://' + dbUrl + ':' + dbPort + '/' + dbSchema;
mongoose.connect(dbString, config.db.options);

//Headers
app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Headers', 'Origin, Authorization, X-Requested-With, Content-Type, Accept, Cache-Control, Pragma');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
});

//View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

//Middleware
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Ensure user is logged in before doing anything else
const isLoggedIn = require('./modules/auth/middleware/is-logged-in');
app.use(isLoggedIn);

//See required file for details
const manageHealthNotifications = require('./modules/building-agency/middleware/manage-health-notifications');
app.use(manageHealthNotifications);

//Module loader
const moduleLoader = new ModuleLoader(app);
moduleLoader.load(config.app.moduleRoot);

//Fallback - render index
app.use(function (req, res) {
	return res.render('index');
});

module.exports = app;
