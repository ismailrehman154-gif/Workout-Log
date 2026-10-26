// grab the ObjectId tool out of the mongodb box, same destructuring as halal eats
// the browser sends ids as plain text, this turns them back into real ids so mongo can match them
const { ObjectId } = require('mongodb')

// the Workout model from step 3, every workout save and lookup goes through its rules
const Workout = require('./models/workout')

module.exports = function (app, passport, db) {

  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get('/', function (req, res) {
    res.render('index.ejs');
  });

  // NOTES SECTION ========================= (cahnged the profile.ejs to be notes, so i made the url appropriate to the project theme)
  // changed: this was /profile, and it showed every message on the board to everyone
  // now it finds only the notes stamped with the logged in user's id (makes it more private and personal, compared to the savage auth where everyone was able to see eachothers posted documents)
  app.get('/notes', isLoggedIn, function (req, res) { // LoggedIn is defined on the bottom, already utilized by savage auth and it checks if there is an account made, and signed in, if there isnt then passport cannot run and req.user doesnt exist so it would crash
    db.collection('notes').find({ user: req.user._id.toString() }).toArray((err, result) => {
      if (err) return console.log(err)
      // build the notes page and hand it the user and their notes
      res.render('notes.ejs', {
        user: req.user,
        notes: result
      })
    })
  });
  // WORKOUTS SECTION =========================
  // the logged in user's training log, isLoggedIn bounces anyone without a session
  app.get('/workouts', isLoggedIn, function (req, res) {
    res.render('workouts.ejs', {
      user: req.user,
      // any messages saved by a failed create, empty array if none
      errors: req.flash('workoutError')
    })
  });

      // save a new workout for the logged in user
    // async because Workout.create returns a promise we wait on
    app.post('/workouts', isLoggedIn, async (req, res) => {
      try {
        await Workout.create({
          exercise: req.body.exercise,
          category: req.body.category,
          sets: req.body.sets,
          reps: req.body.reps,
          weight: req.body.weight,
          effort: req.body.effort,
          // an empty date box sends "", so we pass undefined and let the default kick in
          date: req.body.date || undefined,
          note: req.body.note,
          // the owner stamp comes from the session, never from the form
          user: req.user._id
        })
        res.redirect('/workouts')
      } catch (err) {
        // the model said no, collect its messages and show them on the page
        if (err.name === 'ValidationError') {
          const messages = Object.values(err.errors).map(e => e.message)
          req.flash('workoutError', messages)
          return res.redirect('/workouts')
        }
        // anything else is a real problem, log it so we can see it in the terminal
        console.log(err)
        res.status(500).send('Something went wrong saving that workout.')
      }
    })
    
  // LOGOUT ==============================
  // same as the savage.auth, untouched 
  app.get('/logout', function (req, res) {
    req.logout(() => {
      console.log('User has logged out!')
    });
    res.redirect('/');
  });

  // notes routes ===============================================================
  // changed: everything in this section was /messages with thumbs up and thumbs down before
  // not using messages because i wanted to personalize it,
  //  also removed the thumbs up and thumbs down route because i wont be using a likes functionality, 
  // just updating the content in each document rather than the amount of likes


  // save a new note in the notes box
  // the user stamp comes from passport knowing who is logged in, the browser never sends it
  // mood and date ride along now, they come from the picker and the date input in the form
  app.post('/notes', isLoggedIn, (req, res) => {
    db.collection('notes').insertOne({ title: req.body.title, text: req.body.text, mood: req.body.mood, date: req.body.date, user: req.user._id.toString() }, (err, result) => {
      if (err) return console.log(err)
      console.log('saved to database')
      // send them back to the notes page so they see the new note in the list
      res.redirect('/notes')
    })
  })

  // find one note and change its text
  // the id picks the exact note, the user stamp makes sure it belongs to your account
  app.put('/notes', isLoggedIn, (req, res) => {
    db.collection('notes')
      .findOneAndUpdate({ _id: new ObjectId(req.body.id), user: req.user._id.toString() }, {
        // $set changes only the text and leaves the title and stamp alone
        $set: {
          text: req.body.text
        }
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
  })

  // find one note and change only its mood
  // this route belongs to the mood button alone, kept separate from the text update on purpose
  // the front end works out what the next mood in the cycle is and sends it here to be saved
  app.put('/notes/mood', isLoggedIn, (req, res) => {
    db.collection('notes')
      .findOneAndUpdate({ _id: new ObjectId(req.body.id), user: req.user._id.toString() }, {
        // $set changes only the mood and leaves the text, title and stamp alone
        $set: {
          mood: req.body.mood
        }
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
  })

  // find one note and delete it, same double check as update
  app.delete('/notes', isLoggedIn, (req, res) => {
    db.collection('notes').findOneAndDelete({ _id: new ObjectId(req.body.id), user: req.user._id.toString() }, (err, result) => {
      if (err) return res.send(500, err)
      res.send('Note deleted!')
    })
  })

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================    copied this from savage auth (i copied the file structure from savage auth as well)
  // =============================================================================
  // this whole section is the original auth code, only the success redirects changed

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get('/login', function (req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/workouts', // changed: was /profile, now sends them to their notes
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // SIGNUP =================================
  // show the signup form
  app.get('/signup', function (req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });



  // i deleted the unlink button, i do not have that for this project


  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/workouts', // changed: was /notes (using my own project as a boiler plate after usinga auth as a boiler plate) BOLIERPLATECEPTION
    failureRedirect: '/signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

};

// route middleware to ensure user is logged in
// same as the original: if they are logged in, let them through, if not, send them home
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/');
}
