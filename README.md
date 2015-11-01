# flux-form

Flux form is a helper for managing forms with flux

```js
import fluxForm from 'flux-form'
import { Dispatcher } from 'flux'

const dispatcher = new Dispatcher()

const form = fluxForm('MyForm', dispatcher, {
  fields: [
    'name',
    'email',
  ],

  state: UserStore.getState(),
})
```

`fluxForm` will return a form object which contains all the fields you defined,
a save action, a cancel action, and the current form's state.

```js
class SampleFormComponent extends React.Component {
  render() {
    return (
      <div>
        <label>
          Name
          <input {...form.props.name} />
        </label>

        <label>
          Email
          <input {...form.props.email} />
        </label>

        <input type="button" onClick={form.save} />
      </div>
    )
  }
}
```

`...form.props.name` will add all of the props for the field `name` onto the
input. The two important props are `value` which contains the current value,
and `onChange` which is a function handler that sets the value.

Flux Form is meant to be bare bones and generic in that you can build adapters
on top of it so it works with your favorite flavor of flux.

For example, we can have an Alt specific form utility which creates a store
that you can connect your React component to.

## Validation

You can provide basic validation that can be triggered manually and also runs
automatically whenever the form is saved.

```js
const form = fluxForm('MyForm', dispatcher, {
  fields: [
    'username',
    'password',
  ],

  validators: {
    // you can asynchronously validate a field by returning a promise
    // for example, you can validate that the username is not taken here
    // by making an API call and rejecting the Promise
    username(data) {
      return new Promise((resolve, reject) {
        xhr.post('/validateUsername', { user: data }, (res) => {
          if (res.statusCode === 200) {
            resolve()
          } else {
            reject(res.responseText)
          }
        })
      })
    },

    // you throw an error if it does not pass validation
    password(data) {
      if (data.length <= 6) {
        throw new Error('Password must be longer than 6 characters')
      }
    },
  },
})
```

The validation can be triggered and it returns a Promise. You can also pass in
a node-style callback if you prefer.

```js
form.validate().then((state) => {
  // the successful state of the form
}, (errors) => {
  // a key value pair of errors
  // for example:
  // {
  //   password: 'Password must be longer than 6 characters',
  // }
})
```

You can also validate specific fields by passing in an Array to validate.

```js
form.validate(function (err, state) {
  // do something with err or state
}, ['username'])
```

## Normalization

Form fields are normalized either manually or automatically when saving.

```js
const form = fluxForm('MyForm', dispatcher, {
  fields: [
    'phone',
  ],

  output: {
    // some really crappy normalization lol
    phone(data) {
      // take the phone number and format it so it is without dashes and parens
      // and then add a +1 at the beginning
      return '+1' + String(data).replace(/[ |(|)|-]/g, '')
    },
  },
})
```

To trigger a normalization

```js
form.normalize()
```

## Focus

focus and blur actions are called whenever an element receives focus or is
blurred.

## Actions

Flux form works by firing off flux actions with the dispatcher you've provided.
The actions are dispatched in [FSA format](https://github.com/acdlite/flux-standard-action).

The following actions are provided

* saved
* canceled
* changed
* validationFailed
* focused
* blurred

You use `getActionCreators` in order to get the action creators. Action creators
are functions which return an FSA compliant payload ready to be dispatched.
Each action creator has an `id` field which is the string that you can use in your store
in order to handle the dispatch.

```js
import { getActionCreators } from 'flux-form'

const { saved } = getActionCreators('MyForm')

// sample usage
alt.dispatch(saved('foobar')) // { type: 'MyForm/saved', payload: 'foobar' }
```

Flux form will automatically dispatch change events, saved, focus, etc, which you can then
listen to yourself in order to keep track of state separately or in order to sync items.
