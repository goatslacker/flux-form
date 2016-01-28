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

const test = f => x => f(x)
const fail = msg => () => ok(false, msg)

const spec = (name, state, onSuccess, onFailure) => {
  console.log(`> ${name}...`)
  return fluxForm(
    name,
    { dispatch() { } },
    { propTypes, state }
  ).validate()
  .then(onSuccess, onFailure)
  .then(() => {
    console.log(`√ ${name}`)
  })
  .catch((err) => {
    console.error(`ø ${name}`)
    console.error(err.stack)
    return Promise.reject(err)
  })
}

const runner = (specs) => {
  return Promise.all(specs).then(() => console.log('OK.'), () => {
    console.log('Failed.')
    process.exit(1);
  })
}

runner([
  spec(
    'Data missing',
    {},
    fail('Form validated properly'),
    test((state) => {
      ok(state.name instanceof Error, 'state.name is missing')
      ok(state.stats instanceof Error, 'state.stats is missing')
    })
  ),
  spec(
    'Name is there',
    {
      name: 'Josh',
      age: 14,
    },
    fail('Form validated properly'),
    test((state) => {
      ok(state.name === 'Josh', 'state.name is present')
    })
  ),
  spec(
    'Stats is empty',
    {
      name: 'Josh',
      stats: {},
      age: 21,
    },
    fail('Form validated properly'),
    test((state) => {
      ok(state.stats instanceof Error, 'state.stats is an empty obj')
    })
  ),
  spec(
    'Stats has incorrect props',
    {
      name: 'Josh',
      stats: { height: 151, weight: '83' },
      age: 28,
    },
    fail('Form validated properly'),
    test((state) => {
      ok(state.stats instanceof Error, 'state.stats is an empty obj')
    })
  ),
  spec(
    'All good',
    {
      name: 'Josh',
      stats: { height: 149, weight: 101 },
      age: 35,
    },
    test((state) => {
      ok(state.name === 'Josh')
      ok(state.stats.height === 149)
      ok(state.stats.weight === 101)
      ok(state.age === 35)
    }),
    fail('Form had an error')
  ),
])
