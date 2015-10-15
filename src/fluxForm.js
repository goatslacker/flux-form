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
    }
  }
}

export default (namespace, dispatcher, opts) => {
  const { fields, state, validators } = opts

  // get the action creators
  const { changed, saved, canceled } = getActionCreators(namespace)

  // build action dispatchers
  const save = () => dispatcher.dispatch(saved.dispatch(state))
  const cancel = () => dispatcher.dispatch(canceled.dispatch(state))
  const change = () => dispatcher.dispatch(changed.dispatch(state))

  // the onChange handler for fields
  const onChange = (ev) => {
    const target = ev.target
    if (target.dataset.fluxKey) {
      state[target.dataset.fluxKey] = target.value
      change()
    }
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
    form: { props, save, cancel, state }
  }
}
