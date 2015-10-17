const createAction = (namespace, name) => {
  const type = `${namespace}/${name}`
  return {
    id: type,
    dispatch(payload) {
      const id = Math.random().toString(18).substr(2, 16)

      return {
        type,
        payload,
        meta: {
          id,
          namespace,
          name,
        },
      }
    },
  }
}

export const getActionCreators = (namespace) => {
  return {
    saved: createAction(namespace, 'saved'),
    canceled: createAction(namespace, 'canceled'),
    changed: createAction(namespace, 'changed'),
    failed: createAction(namespace, 'failed'),
  }
}

export default (namespace, dispatcher, opts) => {
  const { fields, state, validators, output } = opts

  // get the action creators
  const { changed, saved, canceled, failed } = getActionCreators(namespace)

  // build action dispatchers
  const save = (callback) => {
    const invalidState = Object.keys(validators).reduce((x, key) => {
      try {
        validators[key](state[key])
      } catch (e) {
        x[key] = e.message
      }
      return x
    }, {})

    const isValid = !Object.keys(invalidState).length

    if (isValid) {
      dispatcher.dispatch(saved.dispatch(state));
    } else {
      dispatcher.dispatch(failed.dispatch(invalidState));
    }

    if (callback) callback(isValid, state)
  }
  const cancel = () => dispatcher.dispatch(canceled.dispatch(state))
  const change = (key, val) => {
    state[key] = output[key] ? output[key](val) : val
    dispatcher.dispatch(changed.dispatch(state))
  }

  // the onChange handler for fields
  const onChange = (ev) => {
    const target = ev.target
    if (target.dataset.fluxKey) change(target.dataset.fluxKey, target.value)
  }

  // the fields as props
  const props = fields.reduce((all, field) => {
    all[field] = {
      value: state[field],
      'data-flux-key': field,
      onChange,
    }
    return all
  }, {})

  return {
    form: { props, save, cancel, change, state }
  }
}
