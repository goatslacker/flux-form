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
