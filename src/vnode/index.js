export function createElementVnode(vm, tag, data, ...children) {
  if (data == null) {
    data = {}
  }
  let key = data.key;
  if (key) {
    delete data.key
  }

  return vnode(vm,
    tag,
    key,
    data,
    children)
}

export function createTextVnode(vm, text) {
  return vnode(vm,
    undefined,
    undefined,
    undefined,
    undefined, text)
}

//ast一样吗?ast做的是语法层面的转化，他描述的是语法本身(可以描述js css html)
//我们的虚拟DOM是描述的dom元素，可以增加一些自定义属性（描述dom的）
function vnode(vm, tag, key, data, children, text) {
  return {
    vm, tag, key, data, children, text
  }
}
