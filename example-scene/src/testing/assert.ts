// VERBATIM COPY OF https://github.com/LemonPi/deep-close-to

import { Entity, LastWriteWinElementSetComponentDefinition } from "@dcl/sdk/ecs";

var pSlice = Array.prototype.slice;
var supportsArgumentsClass = (function () {
  return Object.prototype.toString.call(arguments)
})() == '[object Arguments]';

const isArguments = supportsArgumentsClass ? supported : unsupported;

function supported(object: any) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
};

function unsupported(object: any) {
  return object &&
    typeof object == 'object' &&
    typeof object.length == 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'callee') &&
    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
    false;
};

var floatEpsilon = 0.0000001;

function closeTo(actual: any, expected: any, delta?: number) {
  delta = delta || floatEpsilon;
  return Math.abs(actual - expected) < delta;
}

type Options = { strict: boolean, comp: typeof closeTo }

export function assertEquals(a: any, b: any, message: string = 'Values are not equal') {
  if (!deepCloseTo(a, b)) throw new Error(`${message} - ${JSON.stringify(a)} != ${JSON.stringify(b)}`)
}

export function assert(a: any, message: string = 'assertion failed') {
  if (!a) throw new Error(message)
}

export function assertComponentValue<T>(entity: Entity, component: LastWriteWinElementSetComponentDefinition<T>, value: T) {
  assert(component.has(entity), `The entity doesn't have a ${component.componentName} component`)
  assertEquals(component.get(entity)!, value, `Invalid ${component.componentName} values`)
}

export function deepCloseTo(actual: any, expected: any, opts: Partial<Options> = {}): boolean {
  opts = Object.assign({}, { comp: closeTo }, opts);
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return opts.comp!(actual, expected);

    // 7.3. Other pairs that do not both pass typeof value == 'object',
    // equivalence is determined by ==.
  } else if (!actual || !expected || typeof actual !== 'object' && typeof expected !== 'object') {
    if (opts.strict) {
      if (!actual && !expected) {
        return actual === expected;
      }

      if (typeof actual !== typeof expected) {
        return false;
      }
    }
    if (!actual && !expected) {
      return actual == expected;
    }
    return opts.comp!(actual, expected);

    // 7.4. For all other Object pairs, including Array objects, equivalence is
    // determined by having the same number of owned properties (as verified
    // with Object.prototype.hasOwnProperty.call), the same set of keys
    // (although not necessarily the same order), equivalent values for every
    // corresponding key, and an identical 'prototype' property. Note: this
    // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected, opts as any);
  }
};

function isUndefinedOrNull(value: any) {
  return value === null || value === undefined;
}

function isBuffer(x: any) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') return false;
  return true;
}

function objEquiv(a: any, b: any, opts: Options) {
  var i, key;
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepCloseTo(a, b, opts);
  }
  if (isBuffer(a)) {
    if (!isBuffer(b)) {
      return false;
    }
    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  try {
    var ka = Object.keys(a),
      kb = Object.keys(b);
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepCloseTo(a[key], b[key], opts)) return false;
  }
  return typeof a === typeof b;
}