import fluxForm from './src/fluxForm'
import React from 'react'
import { ok } from 'assert';

const { PropTypes } = React;

const propTypes = {
  name: PropTypes.string.isRequired,
  stats: PropTypes.shape({
    height: PropTypes.number.isRequired,
    weight: PropTypes.number.isRequired,
  }).isRequired,
  age: PropTypes.number,
}

const success = (msg, test) => x => ok(test(x), msg)
const fail = msg => () => ok(false, msg)

const makeForm = (state) => {
  return fluxForm('Person', { dispatch() { } }, { propTypes, state })
}

const form = makeForm({
  name: 'Josh',
  age: 'fuck',
})

form.validate().then(state => console.log('ok', state), (state) => console.log(state))

//makeForm({
//  name: 'Josh',
//  age: 'fuck',
//}).validate()
//.then((state) => { console.log('@', state)})
//.then(fail('Form did not validate properly'))
//.catch(success('Error was thrown', err => {
//  console.log(err)
//  return false
//}))

// XXX
// OK now that we're using propTypes we'll want to make sure we do something...
