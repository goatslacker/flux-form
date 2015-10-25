import isPromise from 'is-promise'

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
    focused: createAction(namespace, 'focused'),
    blurred: createAction(namespace, 'blurred'),
  }
}

export default (namespace, dispatcher, opts) => {
  const {
    fields = [],
    state = {},
    validators = {},
    output = {},
  } = opts

  // get the action creators
  const {
    changed,
    saved,
    canceled,
    failed,
    focused,
    blurred,
  } = getActionCreators(namespace)

  const validate = (callback) => {
    const results = Object.keys(validators).map((key) => {
      try {
        const value = validators[key](state[key])
        return isPromise(value)
          ? value.then((value) => ({ key, value }), err => ({ key, err }))
          : Promise.resolve({ key, value })
      } catch (err) {
        return Promise.resolve({ key, err })
      }
    })

    return Promise.all(results).then((result) => {
      const hasErrors = result.some(({ err }) => !!err)
      const values = result.reduce((o, { key, value, err }) => {
        o[key] = err ? err : value
        return o
      }, {})

      if (hasErrors) {
        if (callback) callback(values)
        return Promise.reject(values)
      } else {
        if (callback) callback(null, values)
        return values
      }
    })
  }

  const normalize = () => {
    Object.keys(state).forEach((key) => {
      const val = state[key]
      state[key] = output[key] ? output[key](val) : val
    })
  }

  const save = (callback) => {
    normalize()
    return validate().then(() => {
      dispatcher.dispatch(saved.dispatch(state));
      if (callback) callback(null, state)
      return state
    }, (err) => {
      dispatcher.dispatch(failed.dispatch(err));
      if (callback) callback(err)
      return Promise.reject(err)
    })
  }

  const cancel = () => dispatcher.dispatch(canceled.dispatch(state))

  const focus = key => dispatcher.dispatch(focused.dispatch(key))

  const blur = key => dispatcher.dispatch(blurred.dispatch(key))

  const change = (key, val) => {
    state[key] = val
    dispatcher.dispatch(changed.dispatch(state))
  }

  // the onChange handler for fields
  const onChange = (ev) => {
    const target = ev.target
    if (target.dataset.fluxKey) change(target.dataset.fluxKey, target.value)
  }

  const onFocus = (ev) => {
    const target = ev.target
    if (target.dataset.fluxKey) focus(target.dataset.fluxKey)
  }

  const onBlur = (ev) => {
    const target = ev.target
    if (target.dataset.fluxKey) blur(target.dataset.fluxKey)
  }

  // the fields as props
  const props = fields.reduce((all, field) => {
    all[field] = {
      value: state[field],
      'data-flux-key': field,
      onChange,
      onFocus,
      onBlur,
    }
    return all
  }, {})

  return {
    props,
    save,
    cancel,
    focus,
    blur,
    validate,
    normalize,
    change,
    state,
  }
}
