import { allowListES2020, customEvalSdk, runWithScope } from '../../../src/lib/web-worker-runtime/sandbox'
import { createModuleRuntime } from '../../../src/lib/web-worker-runtime/context'

const example = `'use strict';

console.log(undefined);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnNvbGUubG9nKHRoaXMpIl0sIm5hbWVzIjpbInRoaXMiXSwibWFwcGluZ3MiOiI7O0FBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQ0EsU0FBSSxDQUFDOzsifQ==
`

const exampleFailingWithStack = `'use strict';

function testFunctionName() {
    throw new Error('test');
}
testFunctionName();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcbmZ1bmN0aW9uIHRlc3RGdW5jdGlvbk5hbWUoKSB7XG4gIHRocm93IG5ldyBFcnJvcigndGVzdCcpXG59XG5cbnRlc3RGdW5jdGlvbk5hbWUoKSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLFNBQVMsZ0JBQWdCLEdBQUE7QUFDdkIsSUFBQSxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQ3pCLENBQUM7QUFFRCxnQkFBZ0IsRUFBRTs7In0=
`

// const originalConsole = console

describe('Sandbox', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('throw 1', async () => {
    const log = jest.fn(($) => {
      throw new Error('1')
    })

    await expect(() => customEvalSdk(example, { console: { log } }, false)).rejects.toThrow('1')
    expect(log).toBeCalled()
  })

  it('throw source map', async () => {
    let stack = 'null'

    try {
      await customEvalSdk(exampleFailingWithStack, {}, true)
    } catch (err: any) {
      stack = err.stack
    }

    expect(stack).toContain('at testFunctionName (eval at')
  })

  it('compiled code scopes work for "falsy" variables', async () => {
    const src = `
    var __defProp = Object.defineProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, { get: all[name], enumerable: true });
    };
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var src_exports = {};
    __export(src_exports, {
      onStart: () => onStart,
      onUpdate: () => onUpdate,
    });
    module.exports = __toCommonJS(src_exports);

    var dt = 0;
    var onUpdate = () => { log(++dt) };
    
    `.trim()

    {
      const log = jest.fn()
      const context = Object.create(null)
      context.log = log
      const sceneModule = createModuleRuntime(null as any, console, context)

      await customEvalSdk(src, context, false)

      await sceneModule.exports.onUpdate!(0.0)
      expect(log).toBeCalledWith(1) // evaluate new result
      await sceneModule.exports.onUpdate!(0.1)
      expect(log).toBeCalledWith(2) // global scalar vars should be mutable with ++
    }
  })


  it('runWithScope returns values consistently', async () => {
    const symbol = Symbol('123')
    expect(await runWithScope('return symbol', { symbol })).toEqual(symbol)
  })

  it('runWithScope returns values consistently shadowing names', async () => {
    const console = Symbol('123')
    expect(await runWithScope('return console', { console })).toEqual(console)
    expect(await runWithScope('return test', { test })).toEqual(test)
  })

  it('runWithScope properly proxies functions for testing', async () => {
    const fn = jest.fn().mockReturnValue(3)
    expect(await runWithScope('return fn()', { fn })).toEqual(3)
  })

  it('runWithScope properly proxies functions for testing in objects', async () => {
    const fn = jest.fn().mockReturnValue(3)
    expect(await runWithScope('return obj.fn()', { obj: { fn } })).toEqual(3)
  })

  it('runWithScope properly proxies functions for testing in objects with shadowing', async () => {
    const log = jest.fn().mockReturnValue(3)
    expect(await runWithScope('return console.log()', { console: { log } })).toEqual(3)
  })

  it('runWithScope works with define value property', async () => {
    const log = jest.fn().mockReturnValue(3)

    const context = {}
    Object.defineProperty(context, 'console', {
      configurable: false,
      value: { log }
    })

    expect(await runWithScope('return console.log()', context)).toEqual(3)
  })

  it('runWithScope works with define getter property', async () => {
    const log = jest.fn().mockReturnValue(3)

    const context = {}
    Object.defineProperty(context, 'console', {
      configurable: false,
      get() {
        return { log }
      }
    })

    expect(await runWithScope('return console.log()', context)).toEqual(3)
  })

  it('runWithScope should fail upon unknown function with shadowing', async () => {
    await expect(runWithScope('return console.log()', {})).rejects.toThrow(
      "Cannot read properties of undefined (reading 'log')"
    )
  })

  it('runWithScope this should be Proxy', async () => {
    const that: any = await runWithScope('return this', {})
    expect(that).toMatchObject({})
    expect(that.console).toEqual(undefined)
    expect(that.eval).toEqual(eval)
  })

  it('runWithScope globalThis should be Proxy', async () => {
    const that: any = await runWithScope('return globalThis', {})
    expect(that).toMatchObject({})
    expect(that.console).toEqual(undefined)
    expect(that.eval).toEqual(eval)
  })

  it('runWithScope globalThis.test==1', async () => {
    const that: any = await runWithScope('return globalThis.test', { test: 1 })
    expect(that).toEqual(1)
  })

  it('runWithScope this.test==1', async () => {
    const that: any = await runWithScope('return this.test', { test: 1 })
    expect(that).toEqual(1)
  })

  it('this should be the proxy', async () => {
    const log = jest.fn().mockImplementation((x) => { })

    await customEvalSdk(example, { console: { log } }, false)

    expect(log).toBeCalledTimes(1)
  })

  it('this should be the proxy (eval)', async () => {
    const log = jest.fn().mockImplementation((x) => { })

    await customEvalSdk(example, { console: { log } }, false)

    expect(log).toBeCalledTimes(1)
  })

  it('globalThis should be the proxy', async () => {
    let that: any = -1
    const log = jest.fn().mockImplementation(($) => {
      that = $
    })

    await customEvalSdk(`console.log(globalThis)`, { console: { log } }, false)

    expect(log).toBeCalledTimes(1)
    expect(that.console).toHaveProperty('log')
    expect(that.console).not.toHaveProperty('error')
    expect(that.require).toBeUndefined()
    expect(that.setTimeout).toBeUndefined()
    expect(that.setInterval).toBeUndefined()
    expect(that.Promise).not.toBeUndefined()
  })

  describe('', () => {
    it('runWithScope works with define value property', async () => {
      let i = 0
      const context = {}
      Object.defineProperty(context, 'console', {
        configurable: false,
        value: {
          log() {
            return i++
          }
        }
      })
      await customEvalSdk('console.log()', context, true)
      expect(i).toEqual(1)
      await customEvalSdk('console.log()', context, false)
      expect(i).toEqual(2)
    })

    it('runWithScope works with define getter property', async () => {
      let i = 0
      const context = {}
      Object.defineProperty(context, 'console', {
        configurable: false,
        get() {
          return {
            log() {
              return i++
            }
          }
        }
      })
      await customEvalSdk('console.log()', context, true)
      expect(i).toEqual(1)
      await customEvalSdk('console.log()', context, false)
      expect(i).toEqual(2)
    })
  })

  it('checks stdlib', () => {
    for (const key of allowListES2020) {
      expect(globalThis).toHaveProperty(key)
    }
  })

  describe('checks default ES2020 properties exist', () => {
    allowListES2020.filter((key) => key !== 'undefined').map((key) => checkExistence(key, true))
  })
  describe('checks extra features do not exist', () => {
    const nonExistentKeys = ['fetch', 'require', 'process', 'setTimeout', 'setInterval', 'console', 'module', 'exports']
    nonExistentKeys.map((key) => checkExistence(key, false))
  })
})

export function checkExistence(property: string, exists: boolean) {
  it(`globalThis.${property} existence (devtool)`, async () => {
    let that: any = -1
    const x = jest.fn(($) => {
      that = $
    })

    await customEvalSdk(`x(globalThis.${property})`, { x }, true)

    expect(x).toBeCalledTimes(1)

    if (exists) {
      expect(that).not.toBeUndefined()
    } else {
      expect(that).toBeUndefined()
    }
  })

  it(`globalThis.${property} existence`, async () => {
    let that: any = -1
    const x = jest.fn(($) => {
      that = $
    })

    await customEvalSdk(`x(globalThis.${property})`, { x }, false)

    expect(x).toBeCalledTimes(1)

    if (exists) {
      expect(that).not.toBeUndefined()
    } else {
      expect(that).toBeUndefined()
    }
  })

  it(`this.${property} existence (devtool)`, async () => {
    let that: any = -1
    const x = jest.fn(($) => {
      that = $
    })

    await customEvalSdk(`x(this.${property})`, { x }, true)

    expect(x).toBeCalledTimes(1)

    if (exists) {
      expect(that).not.toBeUndefined()
    } else {
      expect(that).toBeUndefined()
    }
  })

  it(`this.${property} existence`, async () => {
    let that: any = -1
    const x = jest.fn(($) => {
      that = $
    })

    await customEvalSdk(`x(this.${property})`, { x }, false)

    expect(x).toBeCalledTimes(1)

    if (exists) {
      expect(that).not.toBeUndefined()
    } else {
      expect(that).toBeUndefined()
    }
  })

  it(`in global context ${property} existence (devtool)`, async () => {
    let that: any = -1
    const x = jest.fn(($) => {
      that = $
    })

    await customEvalSdk(`x(${property})`, { x }, true)

    expect(x).toBeCalledTimes(1)
    if (exists) {
      expect(that).not.toBeUndefined()
    } else {
      expect(that).toBeUndefined()
    }
  })

  it(`in global context ${property} doesnt exist (non-devtool)`, async () => {
    let that: any = -1
    const x = jest.fn(($) => {
      that = $
    })

    await customEvalSdk(`x(${property})`, { x }, false)

    expect(x).toBeCalledTimes(1)
    if (exists) expect(that).not.toStrictEqual(undefined)
    else expect(that).toStrictEqual(undefined)
  })
}

describe('dcl runtime', () => {
  it(`onUpdate works`, async () => {
    const context = Object.create(null)
    const sceneModule = createModuleRuntime(null as any, console, context)

    // run the code of the scene
    await customEvalSdk('exports.onUpdate = function() { return 123 }', context, false)

    expect(await sceneModule.exports.onUpdate!(0)).toEqual(123)
  })

  it(`setImmediate exists`, async () => {
    const context = Object.create(null)
    const sceneModule = createModuleRuntime(null as any, console, context)

    // run the code of the scene
    await customEvalSdk('exports.onUpdate = function() { return typeof setImmediate }', context, false)

    expect(await sceneModule.exports.onUpdate!(0)).toEqual('function')
  })

  it(`setImmediate is called once, onStart works`, async () => {
    const fn = jest.fn()
    const context = Object.create({ fn })
    const sceneModule = createModuleRuntime(null as any, console, context)

    await customEvalSdk('setImmediate(fn)', context, false)

    expect(fn).not.toHaveBeenCalled()
    await sceneModule.onStart!()
    expect(fn).toHaveBeenCalledTimes(1)
    await sceneModule.onUpdate(0)
    expect(fn).toHaveBeenCalledTimes(1)
    await sceneModule.onStart!()
    expect(fn).toHaveBeenCalledTimes(1)
    await sceneModule.onUpdate(0)
    await sceneModule.onStart!()
    await sceneModule.onUpdate(0)
    await sceneModule.onStart!()
  })

  it(`scoped setImmediate is the same as globalThis.setImmediate`, async () => {
    const context = Object.create(null)
    const sceneModule = createModuleRuntime(null as any, console, context)

    await customEvalSdk('exports.onStart = function() { if(setImmediate !== globalThis.setImmediate) throw new Error("they are different") }', context, false)
    await sceneModule.exports.onStart!()
  })
})
