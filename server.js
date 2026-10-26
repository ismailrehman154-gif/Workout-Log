// server.js

// load the .env locker first, before anything asks for process.env
require('dotenv').config();

// set up ======================================================================
// get all the tools we need
const express  = require('express');
const app      = express();
const port     = process.env.PORT || 8030;

const mongoose = require('mongoose');
const passport = require('passport');
const flash    = require('connect-flash');

const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser   = require('body-parser');
const session      = require('express-session');

const configDB = require('./config/database.js');

let db

// configuration ===============================================================
// connect to the cluster, and use dbName to pick the Workout-Log database inside it
mongoose.connect(configDB.url, { dbName: configDB.dbName }, (err) => {
  if (err) return console.log(err)
  // ask mongoose for the raw database it opened, this one has .collection() like Halal Eats
  db = mongoose.connection.db
  // print the name so we can see which database we actually landed in
  console.log('Connected to database:', db.databaseName)
  // routes only get wired up once the database is ready
  require('./app/routes.js')(app, passport, db);
});
require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()) //adding this because my updates and deletes didnt work for the halal eats app
app.use(express.static('public'))


app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
    secret: 'rcbootcamp2021b', // session secret
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);