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
    propTypes = {},
    state = {},
    output = {},
    onValidate,
    onSave,
    onNormalize,
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

  const validate = (callback, toValidate = propTypes) => {
    if (onValidate) return onValidate(state, toValidate)

    const results = Object.keys(toValidate).map((key) => {
      try {
        const value = toValidate[key]
          ? toValidate[key](state, key, namespace, 'prop', key)
          : Promise.resolve()

        if (value instanceof Error) {
          throw value;
        }

        return isPromise(value)
          ? value.then((value) => ({ key, value }), err => ({ key, err }))
          : Promise.resolve({ key, value: state[key] })
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
    if (onNormalize) return onNormalize()

    Object.keys(state).forEach((key) => {
      const val = state[key]
      state[key] = output[key] ? output[key](val) : val
    })
  }

  const save = (callback) => {
    if (onSave) return onSave(state)

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

  // the onChange handler for prop
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

  const props = Object.keys(propTypes).reduce((all, prop) => {
    const value = state[prop]

    all[prop] = typeof value === 'object'
      ? { 'data-flux-key': prop, onFocus, onBlur }
      : { 'data-flux-key': prop, value, onChange, onFocus, onBlur }

    return all
  }, {})

  return {
    props,
    save,
    cancel,
    validate,
    normalize,
    change,
    state,
  }
}
