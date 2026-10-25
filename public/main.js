var updateButtons = document.querySelectorAll('.update-note')
var deleteButtons = document.querySelectorAll('.delete-note')

Array.from(updateButtons).forEach(function (button) {
  button.addEventListener('click', function () {
    var id = this.dataset.id
    var text = prompt('Update your note:')
    if (text === null || text === '') return
    fetch('/notes', {
      method: 'put',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, text: text })
    }).then(function (response) {
      if (response.ok) window.location.reload()
    })
  })
})

Array.from(deleteButtons).forEach(function (button) {
  button.addEventListener('click', function () {
    var id = this.dataset.id
    if (!confirm('Delete this note?')) return
    fetch('/notes', {
      method: 'delete',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
    }).then(function (response) {
      if (response.ok) window.location.reload()
    })
  })// grab every button on the page by its class, the classes come from notes.ejs
const updateButtons = document.querySelectorAll('.update-note')
const deleteButtons = document.querySelectorAll('.delete-note')
const moodButtons = document.querySelectorAll('.update-mood')

// go through the update buttons one by one and give each one a click job
Array.from(updateButtons).forEach(function (button) {
  button.addEventListener('click', function () {
    // the id of the note that owns this button, stamped on it in data-id
    const id = this.dataset.id
    // ask me for the new text, the answer lands in text
    const text = prompt('Update your note:')
    // if i cancel or leave it empty, stop here, change nothing
    if (text === null || text === '') return
    // send the id and the new text to the put route as json
    fetch('/notes', {
      method: 'put',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, text: text })
    }).then(function (response) {
      // server said ok, reload so the list shows what is really in the database
      if (response.ok) window.location.reload()
    })
  })
})

// same idea for the delete buttons, these are the X icons on each card now
Array.from(deleteButtons).forEach(function (button) {
  button.addEventListener('click', function () {
    const id = this.dataset.id
    // ask first, if i say no, stop here
    if (!confirm('Delete this note?')) return
    // delete only needs the id, the server double checks the note is mine
    fetch('/notes', {
      method: 'delete',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
    }).then(function (response) {
      if (response.ok) window.location.reload()
    })
  })
})

// the mood buttons, each click moves the mood one step in the cycle
Array.from(moodButtons).forEach(function (button) {
  button.addEventListener('click', function () {
    const id = this.dataset.id
    // the mood this note is wearing right now, stamped on the button in data-mood
    const current = this.dataset.mood
    // work out the next mood, blank goes to happy, happy goes to sad, sad wraps back to blank
    let next = 'blank'
    if (current === 'blank') next = 'happy'
    if (current === 'happy') next = 'sad'
    if (current === 'sad') next = 'blank'
    // send it to the mood route, that route only touches the mood and nothing else
    fetch('/notes/mood', {
      method: 'put',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, mood: next })
    }).then(function (response) {
      if (response.ok) window.location.reload()
    })
  })
})

})
