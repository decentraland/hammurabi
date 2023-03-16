function swap<T>(arr: Array<T>, a: number, b: number) {
  var temp = arr[a];
  arr[a] = arr[b];
  arr[b] = temp;
}

function factorial(n: number): number {
  var val = 1;
  for (var i = 1; i < n; i++) {
    val *= i;
  }
  return val;
}

export function* permute<T>(perm: Array<T>) {
  const total = factorial(perm.length);

  for (var j = 0, i = 0, inc = 1; j < total; j++, inc *= -1, i += inc) {
    for (; i < perm.length - 1 && i >= 0; i += inc) {
      yield perm.slice();
      swap(perm, i, i + 1);
    }

    yield perm.slice();

    if (inc === 1) {
      swap(perm, 0, 1);
    } else {
      swap(perm, perm.length - 1, perm.length - 2);
    }
  }
}
