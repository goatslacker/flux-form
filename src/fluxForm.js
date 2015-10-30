import isPromise from 'is-promise'
import { generateActions } from 'create-actions'

export const getActionCreators = (namespace) => {
  return generateActions(namespace, [
    'saved',
    'canceled',
    'changed',
    'validationFailed',
    'focused',
    'blurred',
  ])
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
    validationFailed,
    focused,
    blurred,
  } = getActionCreators(namespace)

  const validate = (callback, toValidate = validators) => {
    const results = Object.keys(toValidate).map((key) => {
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
        dispatcher.dispatch(validationFailed(values))
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
      dispatcher.dispatch(saved(state));
      if (callback) callback(null, state)
      return state
    }, (err) => {
      if (callback) callback(err)
      return Promise.reject(err)
    })
  }

  const cancel = () => dispatcher.dispatch(canceled(state))

  const focus = key => dispatcher.dispatch(focused(key))

  const blur = key => dispatcher.dispatch(blurred(key))

  const change = (key, val) => {
    state[key] = val
    dispatcher.dispatch(changed(state))
  }

  // the onChange handler for fields
  const onChange = (ev) => {
    const target = ev.target
    if (target.dataset.fluxKey) {
      change(target.dataset.fluxKey, target.value)
      if (opts.onChange) opts.onChange(target.dataset.fluxKey, target.value)
    }
  }

  const onFocus = (ev) => {
    const target = ev.target
    if (target.dataset.fluxKey) {
      focus(target.dataset.fluxKey)
      if (opts.onFocus) opts.onFocus(target.dataset.fluxKey)
    }
  }

  const onBlur = (ev) => {
    const target = ev.target
    if (target.dataset.fluxKey) {
      blur(target.dataset.fluxKey)
      if (opts.onBlur) opts.onBlur(target.dataset.fluxKey)
    }
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
