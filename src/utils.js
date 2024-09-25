
const strats = {}
const LIFECYCLE = [
  'beforeCreate',
  'created'
]
LIFECYCLE.forEach(hook => {
  strats[hook] = function (p, c) {
    if (c) {
      if (p) {
        return p.concat(c)
      } else {
        return [c]
      }
    } else {
      return p
    }
  }
})
strats.components = function (parentVal, childVal) {
  const res = Object.create(parentVal)
  if (childVal) {
    for (let key in childVal) {//返回的是构造的函数的对象，可以拿到父亲原型上的属性，并且将儿子都拷贝到自己身上
      res[key] = childVal[key]
    }
  }
  return res
}
export function mergeOptions(parent, child) {
  const options = {}
  for (let key in parent) {//循环老的
    mergeField(key)
  }
  for (let key in child) {//循环老的
    if (!parent.hasOwnProperty(key)) {
      mergeField(key)
    }
  }
  function mergeField(key) {
    //策略模式减少if else
    if (strats[key]) {
      options[key] = strats[key](parent[key], child[key])
    } else {
      //如果不在策略中则以儿子为主
      options[key] = child[key] || parent[key]
    }
  }
  return options
}
