// grab the edit form and the empty error list, both are null on pages without them
const editForm = document.querySelector('#edit-workout-form')
const errorList = document.querySelector('#edit-errors')

// only wire up the form if this page actually has one
if (editForm) {
  editForm.addEventListener('submit', async (event) => {
    // stop the browser's normal submit, we're sending a PUT ourselves
    event.preventDefault()

    // turn every field in the form into a plain object like { exercise: 'Deadlift', sets: '4' }
    const data = Object.fromEntries(new FormData(editForm))

    try {
      // send the changes to the route for this workout's id
      const response = await fetch(`/workouts/${editForm.dataset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      // 2xx status means it saved, go back to the log
      if (response.ok) {
        window.location.href = '/workouts'
        return
      }

      // anything else, read the error messages and show them
      const result = await response.json()
      showErrors(result.errors)
    } catch (err) {
      // fetch itself failed, usually the server is down
      showErrors(['Could not reach the server. Is it running?'])
    }
  })
}

// fill the error list with one line per message and make it visible
function showErrors(messages) {
  errorList.innerHTML = ''
  messages.forEach((message) => {
    const item = document.createElement('li')
    // textContent, not innerHTML, so a message can never inject html into the page
    item.textContent = message
    errorList.appendChild(item)
  })
  errorList.hidden = false
}

// one listener on the whole list instead of one per button
const workoutList = document.querySelector('.workout-list')

// only wire this up on pages that have the list
if (workoutList) {
  workoutList.addEventListener('click', async (event) => {
    // find the delete button that was clicked, null if the click was somewhere else
    const deleteButton = event.target.closest('.card-delete')
    if (!deleteButton) return

    // read the exercise name off the same card so the question is specific
    const card = deleteButton.closest('.workout-card')
    const exercise = card.querySelector('.card-exercise').textContent
    if (!confirm(`Delete this ${exercise} session? This cannot be undone.`)) return

    try {
      const response = await fetch(`/workouts/${deleteButton.dataset.id}`, { method: 'DELETE' })
      if (response.ok) {
        // reload so the list, the empty state and later the stats all stay accurate
        window.location.reload()
        return
      }
      const result = await response.json()
      alert(result.errors.join('\n'))
    } catch (err) {
      alert('Could not reach the server. Is it running?')
    }
  })
}