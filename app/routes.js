

// the Workout model from step 3, every workout save and lookup goes through its rules
const Workout = require('./models/workout')

module.exports = function (app, passport, db) {

  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get('/', function (req, res) {
    res.render('index.ejs');
  });

  
         // WORKOUTS SECTION =========================
    // the logged in user's training log, only their workouts, newest first
    app.get('/workouts', isLoggedIn, async (req, res) => {
      try {
        // the filter is the privacy: only workouts stamped with this user's id
        const workouts = await Workout.find({ user: req.user._id })
          .sort({ date: -1, createdAt: -1 })
                // totals for the stats strip, volume comes from the model virtual
        const stats = {
          sessions: workouts.length,
          totalVolume: workouts.reduce((sum, workout) => sum + workout.volume, 0)
        }
        res.render('workouts.ejs', {
          user: req.user,
          workouts: workouts,
          stats: stats,
          errors: req.flash('workoutError')
        })
      } catch (err) {
        console.log(err)
        res.status(500).send('Something went wrong loading your workouts.')
      }
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

        // show the edit page for one workout, but only if it belongs to the logged in user
    app.get('/workouts/:id/edit', isLoggedIn, async (req, res) => {
      try {
        // id from the url AND owner from the session, both must match
        const workout = await Workout.findOne({ _id: req.params.id, user: req.user._id })
        // no match means it doesn't exist or it isn't yours, same answer either way
        if (!workout) return res.status(404).send('Workout not found.')
        res.render('edit-workout.ejs', {
          user: req.user,
          workout: workout,
          // the category list comes straight from the model, so there's one source of truth
          categories: Workout.schema.path('category').enumValues
        })
      } catch (err) {
        // a garbled id like /workouts/abc/edit can't become an ObjectId, treat it as not found
        if (err.name === 'CastError') return res.status(404).send('Workout not found.')
        console.log(err)
        res.status(500).send('Something went wrong loading that workout.')
      }
    })

        // save changes to one workout, owner only, with the same rules as create
    app.put('/workouts/:id', isLoggedIn, async (req, res) => {
      // only these fields can change, the owner stamp is never taken from the browser
      const changes = {
        exercise: req.body.exercise,
        category: req.body.category,
        sets: req.body.sets,
        reps: req.body.reps,
        weight: req.body.weight,
        effort: req.body.effort,
        note: req.body.note
      }
      // only touch the date if one was sent, an empty box keeps the old date
      if (req.body.date) changes.date = req.body.date

      try {
        const workout = await Workout.findOneAndUpdate(
          // which workout: this id AND this owner
          { _id: req.params.id, user: req.user._id },
          // what to change
          changes,
          // new: hand back the updated version, runValidators: enforce the schema rules on updates too
          { new: true, runValidators: true }
        )
        if (!workout) return res.status(404).json({ errors: ['Workout not found.'] })
        res.json({ ok: true })
      } catch (err) {
        if (err.name === 'ValidationError') {
          const messages = Object.values(err.errors).map(e => e.message)
          return res.status(400).json({ errors: messages })
        }
        // a bad id in the url is a 404, a bad value in a field like sets is a 400
        if (err.name === 'CastError' && err.path === '_id') {
          return res.status(404).json({ errors: ['Workout not found.'] })
        }
        if (err.name === 'CastError') {
          return res.status(400).json({ errors: [`Check the ${err.path} field.`] })
        }
        console.log(err)
        res.status(500).json({ errors: ['Something went wrong saving your changes.'] })
      }
    })

        // delete one workout, owner only
    app.delete('/workouts/:id', isLoggedIn, async (req, res) => {
      try {
        // same double check as edit: this id AND this owner
        const workout = await Workout.findOneAndDelete({ _id: req.params.id, user: req.user._id })
        if (!workout) return res.status(404).json({ errors: ['Workout not found.'] })
        res.json({ ok: true })
      } catch (err) {
        if (err.name === 'CastError') return res.status(404).json({ errors: ['Workout not found.'] })
        console.log(err)
        res.status(500).json({ errors: ['Something went wrong deleting that workout.'] })
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
