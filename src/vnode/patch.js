import { isSameVnode } from './index';

function createComponent(vnode) {
  let i = vnode.data;
  if ((i = i.hook) && (i = i.init)) {
    i(vnode)//初始化组件
  }
  if (vnode.componetInstance) {
    return true //说明是组件
  }
}

export function createElm(vnode) {
  let { tag, data, children, text } = vnode;
  if (typeof tag === 'string') {//标签
    //创建真实元素 也要区分是组件还是元素
    if (createComponent(vnode)) {//组件
      return vnode.componetInstance.$el
    }
    vnode.el = document.createElement(tag);//这里将真实节点和虚拟节点对应起来，后续如果修改属性了
    patchProps(vnode.el, {}, data)
    children.forEach(child => {
      vnode.el.appendChild(createElm(child))
    })
  } else {
    vnode.el = document.createTextNode(text)
  }
  return vnode.el
}

export function patchProps(el, oldProps = {}, props = {}) {

  let oldStyles = oldProps.style || {};
  let newStyles = props.style || {};
  for (let key in oldStyles) {//老的样式中有，新的没，没有则删除
    if (!newStyles[key]) {
      el.style[key] = ''
    }
  }

  for (let key in oldProps) { //老的属性中有，新的没有 要删除老的
    if (!props[key]) {
      el.removeAttribute(key)
    }
  }

  for (let key in props) {//用新的覆盖老的
    if (key === 'style') {
      for (let styleName in props.style) {
        el.style[styleName] = props.style[styleName]
      }
    } else {
      el.setAttribute(key, props[key])
    }
  }
  return el

}

export function patch(oldVnode, vnode) {
  if (!oldVnode) {//这就是组件的挂载
    return createElm(vnode)
  }
  //写的是初渲染流程
  const isRealElement = oldVnode.nodeType;
  if (isRealElement) {
    const elm = oldVnode;//获取真实元素
    const parentElm = elm.parentNode;//拿到父元素
    let newElm = createElm(vnode)
    parentElm.insertBefore(newElm, elm.nextSibing)
    parentElm.removeChild(elm)
    return newElm
  } else {
    //1.两个节点不是同一个节点，直接删除老的换上新的(没有比对了)
    //2.两个节点是同一个节点(判断节点的tag和节点的key) 比较两个节点的属性是否有差异(复用老的节点，将差异的属性更新)
    //3.节点比较完毕后就需要比较两人的儿子
    return patchVnode(oldVnode, vnode)
  }
}


function patchVnode(oldVnode, vnode) {
  if (!isSameVnode(oldVnode, vnode)) {
    let el = createElm(vnode)
    oldVnode.el.parentNode.replaceChild(el, oldVnode.el)
    return el
  }
  //文本的情况 文本我们期望比较一下文本的内容
  let el = vnode.el = oldVnode.el; //复用老节点的元素
  if (!oldVnode.tag) {
    if (oldVnode.text !== vnode.text) {
      el.textContent = vnode.text;//用新的文本覆盖掉老的
    }
  }
  //是标签 是标签我们需要比对标签的属性
  patchProps(el, oldVnode.data, vnode.data)


  //比较儿子节点，比较的时候，一方有儿子，一方没儿子
  let oldChildren = oldVnode.children || [];
  let newChildren = vnode.children || [];

  if (oldChildren.length > 0 && newChildren.length > 0) {
    //完整的diff算法，需要比较两个人的儿子
    updateChildren(el, oldChildren, newChildren)
  } else if (newChildren.length > 0) {//没有老
    mountChildren(el, newChildren)
  } else if (oldChildren.length > 0) {//新的没有，老的有，要删除
    el.innerHTML = '';//可以循环删除
  }
  return el
}

function mountChildren(el, newChildren) {
  for (let i = 0; i < newChildren.length; i++) {
    let child = newChildren[i];
    el.appendChild(createElm(child))
  }
}

function updateChildren(el, oldChildren, newChildren) {
  //我们操作列表经常会是有 push shift pop unshift reverse sort这些方法(针对这些情况做一个优化)
  //vue2中采用双指针的方式比较两个节点
  //我们为了 比较两个儿子的时候 增高性能 我们会有一些优化手段
  let oldStartIndex = 0;
  let oldEndIndex = oldChildren.length - 1;
  let oldStartVnode = oldChildren[0]
  let oldEndVnode = oldChildren[oldEndIndex]

  let newStartIndex = 0;
  let newEndIndex = newChildren.length - 1;
  let newStartVnode = newChildren[0]
  let newEndVnode = newChildren[newEndIndex]

  function makeIndexByKey(children) {
    let map = {}
    children.forEach((child, index) => {
      map[child.key] = index;
    })
    return map
  }
  let map = makeIndexByKey(oldChildren)
  console.log(map)
  //循环的时候为啥要加key
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) { //有任何一个不满足则停止||有一个为true就继续；
    if (!oldStartVnode) {
      oldStartVnode = oldChildren[++oldStartIndex]
    } else if (!oldEndVnode) {
      oldEndVnode = oldChildren[--oldEndIndex]
    } else if (isSameVnode(oldStartVnode, newStartVnode)) {//双方有一方头指针大于尾指针则停止循环
      patchVnode(oldStartVnode, newStartVnode)//如果是相同节点，则递归比较子节点
      oldStartVnode = oldChildren[++oldStartIndex]
      newStartVnode = newChildren[++newStartIndex]
      //比较开头节点
    } else if (isSameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode)//如果是相同节点，则递归比较子节点
      oldEndVnode = oldChildren[--oldEndIndex]
      newEndVnode = newChildren[--newEndIndex]
    } else if (isSameVnode(oldEndVnode, newStartVnode)) {
      patchVnode(oldEndVnode, newStartVnode)
      //insertBefore具备移动性会将原来的元素移走
      el.insertBefore(oldEndVnode.el, oldStartVnode.el)//将老的尾巴移动到老的前面去
      oldEndVnode = oldChildren[--oldEndIndex]
      newStartVnode = newChildren[++newStartIndex]
    } else if (isSameVnode(oldStartVnode, newEndVnode)) {
      patchVnode(oldStartVnode, newEndVnode)
      //insertBefore具备移动性会将原来的元素移走
      el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibing)//将老的尾巴移动到老的前面去
      oldStartVnode = oldChildren[++oldStartIndex]
      newEndVnode = newChildren[--newEndIndex]
    } else {
      //在给动态列表添加key的时候，要尽量避免用索引，因为索引前后都是从0开始，可能会发生错误复用

      //乱序比对
      //根据老的列表做一个映射关系，用新的去找，找到则移动，找不到则添加，最后多余的就删除

      let moveIndex = map[newStartVnode.key]//如果拿到则说明是我要移动的索引
      if (moveIndex !== undefined) {
        let moveVnode = oldChildren[moveIndex]//找到对应的虚拟节点，复用
        el.insertBefore(moveVnode.el, oldStartVnode.el)
        oldChildren[moveIndex] = undefined;//表示这个节点已经移动走了
        patchVnode(moveVnode, newStartVnode)//比对属性和子节点
      } else {
        el.insertBefore(createElm(newStartVnode), oldStartVnode.el)
      }
      newStartVnode = newChildren[++newStartIndex]
    }

  }

  if (newStartIndex <= newEndIndex) {//新的多了，多余的就插入进去
    for (let i = newStartIndex; i <= newStartIndex; i++) {
      let childEl = createElm(newChildren[i])
      //这里可能是向后追加，还有可能是向前追加
      let anchor = newChildren[newEndIndex + 1] ? newChildren[newEndIndex + 1].el : null;//获取下一个元素
      el.insertBefore(childEl, anchor) //anchor为null的时候则会认为是appendChild
    }
  }

  if (oldStartIndex <= oldEndIndex) {//老的多了，需要删除老的
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      if (oldChildren[i]) {
        let childEl = oldChildren[i].el;
        el.removeChild(childEl)
      }
    }
  }
  console.log(oldStartVnode, newStartVnode, oldEndVnode, newEndVnode)
}
