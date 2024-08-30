let oldArrayProto = Array.prototype;

//newArrayProto.__proto__ = oldArrayProto
export let newArrayProto = Object.create(oldArrayProto)

let methods = [//找到所有的变异方法
  'push',
  'pop',
  'shift',
  'unshift',
  'reverse',
  'sort',
  'splice'
]

methods.forEach(method => {
  newArrayProto[method] = function (...args) {//这里重写了数组的方法
    console.log(method)
    const result = oldArrayProto[method].call(this, ...args)//内部调用原来的方法，函数的劫持，切片编程
    // 我们需要对新增的数据再次进行劫持
    let inserted;
    let ob = this.__ob__;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break;
      case 'splice':
        inserted = args.slice(2)
        break;
      default:
        break
    }
    console.log(this)
    console.log('更新')
    if (inserted) {
      //对新增的内容再次进行观测
      ob.observeArray(inserted)
    }
    ob.dep.notify()//通知更新

    return result
  }
})

