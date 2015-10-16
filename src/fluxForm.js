const fsa = (type, payload) => {
  return {
    // FSA
    type,
    payload,
    // Alt
    action: type,
    data: payload,
  }
}

export const getActionCreators = (namespace) => {
  const saveId = `${namespace}/saved`
  const cancelId = `${namespace}/canceled`
  const changeId = `${namespace}/changed`
  const failId = `${namespace}/failed`

  return {
    saved: {
      id: saveId,
      dispatch: data => fsa(saveId, data),
    },
    canceled: {
      id: cancelId,
      dispatch: data => fsa(cancelId, data),
    },
    changed: {
      id: changeId,
      dispatch: data => fsa(changeId, data),
    },
    failed: {
      id: failId,
      dispatch: data => fsa(failId, data),
    },
  }
}

export default (namespace, dispatcher, opts) => {
  const { fields, state, validators } = opts

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
    state[key] = val
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
