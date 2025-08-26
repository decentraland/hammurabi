import { EasingFunction } from "@dcl/protocol/out-js/decentraland/sdk/components/tween.gen";

type EasingFunctionImpl = (progress: number) => number;

interface EasingDictionary {
  [easing: number]: EasingFunctionImpl;
}

const pow = Math.pow;
const sqrt = Math.sqrt;
const sin = Math.sin;
const cos = Math.cos;
const PI = Math.PI;
const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
const c4 = (2 * PI) / 3;
const c5 = (2 * PI) / 4.5;

const bounceOut: EasingFunctionImpl = function (x) {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (x < 1 / d1) {
    return n1 * x * x;
  } else if (x < 2 / d1) {
    return n1 * (x -= 1.5 / d1) * x + 0.75;
  } else if (x < 2.5 / d1) {
    return n1 * (x -= 2.25 / d1) * x + 0.9375;
  } else {
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
};

export const easingsFunctions: EasingDictionary = {
  [EasingFunction.EF_LINEAR]: (x) => x,
  [EasingFunction.EF_EASEINQUAD]: function (x) {
    return x * x;
  },
  [EasingFunction.EF_EASEOUTQUAD]: function (x) {
    return 1 - (1 - x) * (1 - x);
  },
  [EasingFunction.EF_EASEINCUBIC]: function (x) {
    return x * x * x;
  },
  [EasingFunction.EF_EASEOUTCUBIC]: function (x) {
    return 1 - pow(1 - x, 3);
  },
  [EasingFunction.EF_EASEINQUART]: function (x) {
    return x * x * x * x;
  },
  [EasingFunction.EF_EASEOUTQUART]: function (x) {
    return 1 - pow(1 - x, 4);
  },
  [EasingFunction.EF_EASEINQUINT]: function (x) {
    return x * x * x * x * x;
  },
  [EasingFunction.EF_EASEOUTQUINT]: function (x) {
    return 1 - pow(1 - x, 5);
  },
  [EasingFunction.EF_EASEINSINE]: function (x) {
    return 1 - cos((x * PI) / 2);
  },
  [EasingFunction.EF_EASEOUTSINE]: function (x) {
    return sin((x * PI) / 2);
  },
  [EasingFunction.EF_EASEINEXPO]: function (x) {
    return x === 0 ? 0 : pow(2, 10 * x - 10);
  },
  [EasingFunction.EF_EASEOUTEXPO]: function (x) {
    return x === 1 ? 1 : 1 - pow(2, -10 * x);
  },
  [EasingFunction.EF_EASEINCIRC]: function (x) {
    return 1 - sqrt(1 - pow(x, 2));
  },
  [EasingFunction.EF_EASEOUTCIRC]: function (x) {
    return sqrt(1 - pow(x - 1, 2));
  },
  [EasingFunction.EF_EASEINBACK]: function (x) {
    return c3 * x * x * x - c1 * x * x;
  },
  [EasingFunction.EF_EASEOUTBACK]: function (x) {
    return 1 + c3 * pow(x - 1, 3) + c1 * pow(x - 1, 2);
  },
  [EasingFunction.EF_EASEINELASTIC]: function (x) {
    return x === 0
      ? 0
      : x === 1
        ? 1
        : -pow(2, 10 * x - 10) * sin((x * 10 - 10.75) * c4);
  },
  [EasingFunction.EF_EASEOUTELASTIC]: function (x) {
    return x === 0
      ? 0
      : x === 1
        ? 1
        : pow(2, -10 * x) * sin((x * 10 - 0.75) * c4) + 1;
  },
  [EasingFunction.EF_EASEINBOUNCE]: function (x) {
    return 1 - bounceOut(1 - x);
  },
  [EasingFunction.EF_EASEOUTBOUNCE]: bounceOut,
};