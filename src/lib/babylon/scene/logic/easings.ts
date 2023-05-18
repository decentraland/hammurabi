import { EasingFunction } from "@dcl/protocol/out-ts/decentraland/sdk/components/tween.gen";

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
  [EasingFunction.TF_LINEAR]: (x) => x,
  [EasingFunction.TF_EASE_IN_QUAD]: function (x) {
    return x * x;
  },
  [EasingFunction.TF_EASE_OUT_QUAD]: function (x) {
    return 1 - (1 - x) * (1 - x);
  },
  [EasingFunction.TF_EASE_IN_OUT_QUAD]: function (x) {
    return x < 0.5 ? 2 * x * x : 1 - pow(-2 * x + 2, 2) / 2;
  },
  [EasingFunction.TF_EASE_IN_CUBIC]: function (x) {
    return x * x * x;
  },
  [EasingFunction.TF_EASE_OUT_CUBIC]: function (x) {
    return 1 - pow(1 - x, 3);
  },
  [EasingFunction.TF_EASE_IN_OUT_CUBIC]: function (x) {
    return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
  },
  [EasingFunction.TF_EASE_IN_QUART]: function (x) {
    return x * x * x * x;
  },
  [EasingFunction.TF_EASE_OUT_QUART]: function (x) {
    return 1 - pow(1 - x, 4);
  },
  [EasingFunction.TF_EASE_IN_OUT_QUART]: function (x) {
    return x < 0.5 ? 8 * x * x * x * x : 1 - pow(-2 * x + 2, 4) / 2;
  },
  [EasingFunction.TF_EASE_IN_QUINT]: function (x) {
    return x * x * x * x * x;
  },
  [EasingFunction.TF_EASE_OUT_QUINT]: function (x) {
    return 1 - pow(1 - x, 5);
  },
  [EasingFunction.TF_EASE_IN_OUT_QUINT]: function (x) {
    return x < 0.5 ? 16 * x * x * x * x * x : 1 - pow(-2 * x + 2, 5) / 2;
  },
  [EasingFunction.TF_EASE_IN_SINE]: function (x) {
    return 1 - cos((x * PI) / 2);
  },
  [EasingFunction.TF_EASE_OUT_SINE]: function (x) {
    return sin((x * PI) / 2);
  },
  [EasingFunction.TF_EASE_IN_OUT_SINE]: function (x) {
    return -(cos(PI * x) - 1) / 2;
  },
  [EasingFunction.TF_EASE_IN_EXPO]: function (x) {
    return x === 0 ? 0 : pow(2, 10 * x - 10);
  },
  [EasingFunction.TF_EASE_OUT_EXPO]: function (x) {
    return x === 1 ? 1 : 1 - pow(2, -10 * x);
  },
  [EasingFunction.TF_EASE_IN_OUT_EXPO]: function (x) {
    return x === 0
      ? 0
      : x === 1
        ? 1
        : x < 0.5
          ? pow(2, 20 * x - 10) / 2
          : (2 - pow(2, -20 * x + 10)) / 2;
  },
  [EasingFunction.TF_EASE_IN_CIRC]: function (x) {
    return 1 - sqrt(1 - pow(x, 2));
  },
  [EasingFunction.TF_EASE_OUT_CIRC]: function (x) {
    return sqrt(1 - pow(x - 1, 2));
  },
  [EasingFunction.TF_EASE_IN_OUT_CIRC]: function (x) {
    return x < 0.5
      ? (1 - sqrt(1 - pow(2 * x, 2))) / 2
      : (sqrt(1 - pow(-2 * x + 2, 2)) + 1) / 2;
  },
  [EasingFunction.TF_EASE_IN_BACK]: function (x) {
    return c3 * x * x * x - c1 * x * x;
  },
  [EasingFunction.TF_EASE_OUT_BACK]: function (x) {
    return 1 + c3 * pow(x - 1, 3) + c1 * pow(x - 1, 2);
  },
  [EasingFunction.TF_EASE_IN_OUT_BACK]: function (x) {
    return x < 0.5
      ? (pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
      : (pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
  },
  [EasingFunction.TF_EASE_IN_ELASTIC]: function (x) {
    return x === 0
      ? 0
      : x === 1
        ? 1
        : -pow(2, 10 * x - 10) * sin((x * 10 - 10.75) * c4);
  },
  [EasingFunction.TF_EASE_OUT_ELASTIC]: function (x) {
    return x === 0
      ? 0
      : x === 1
        ? 1
        : pow(2, -10 * x) * sin((x * 10 - 0.75) * c4) + 1;
  },
  [EasingFunction.TF_EASE_IN_OUT_ELASTIC]: function (x) {
    return x === 0
      ? 0
      : x === 1
        ? 1
        : x < 0.5
          ? -(pow(2, 20 * x - 10) * sin((20 * x - 11.125) * c5)) / 2
          : (pow(2, -20 * x + 10) * sin((20 * x - 11.125) * c5)) / 2 + 1;
  },
  [EasingFunction.TF_EASE_IN_BOUNCE]: function (x) {
    return 1 - bounceOut(1 - x);
  },
  [EasingFunction.TF_EASE_OUT_BOUNCE]: bounceOut,
  [EasingFunction.TF_EASE_IN_OUT_BOUNCE]: function (x) {
    return x < 0.5
      ? (1 - bounceOut(1 - 2 * x)) / 2
      : (1 + bounceOut(2 * x - 1)) / 2;
  },
};