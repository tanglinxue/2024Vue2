let id = 0;
// import Dep from './dep';
import { pushTarget, popTarget } from './dep';

//每个属性有一个dep(属性就是被观察者)，watcher就是观察者(属性变化了会通知观察者来更新)  观察者模式

//1.当我们创建渲染watcher的时候我们会把当前的渲染watcher放到Dep.target上
//2.调用_render()会取值走到get上
class Watcher {//不同组件有不同的watcher 目前只有一个渲染根实例
  constructor(vm, exprOrFn, options, cb) {
    this.id = id++;
    this.renderWatcher = options;//是一个渲染watcher
    if (typeof exprOrFn === 'string') {
      this.getter = function () {
        return vm[exprOrFn]
      }
    } else {
      this.getter = exprOrFn //getter意味着调用这个函数可以发生取值操作
    }

    this.deps = [] //后续我们实现计算属性，和一些清理工作需要用到
    this.depsId = new Set()
    this.lazy = options.lazy;
    this.dirty = this.lazy//缓存值
    this.cb = cb;
    this.value = '';
    this.user = options.user; // 标识是否是用户自己的watcher
    this.vm = vm
    this.value = this.lazy ? undefined : this.get()

  }
  addDep(dep) {//一个组件对应多个属性，重复的属性不用记录
    let id = dep.id;
    if (!this.depsId.has(id)) {
      this.deps.push(dep)
      this.depsId.add(id)
      dep.addSub(this)//watcher已经记住了dep了而且去重了，此时让dep也记住watcher
    }
  }
  evaluate() {
    this.value = this.get() //获取到用户函数的返回值，并且还要标识为脏
    this.dirty = false
  }
  get() {
    pushTarget(this)
    //Dep.target = this;//静态属性就是只有一份
    let value = this.getter.call(this.vm)//会去vm上取值
    //Dep.target = null//渲染完毕后就清空
    popTarget()
    return value
  }
  depend() {
    let i = this.deps.length;
    while (i--) {
      this.deps[i].depend()//让计算属性watcher也收集渲染watcher
    }
  }
  update() {
    if (this.lazy) {
      //如果是计算属性依赖的值变化了，就标识计算属性是脏值了
      this.dirty = true
    } else {
      //this.get()//重新渲染
      queueWatcher(this)//把当前的watcher暂存起来
    }
  }
  run() {
    let oldVal = this.value;
    let newVal = this.get()

    if (this.user) {
      this.cb.call(this.vm, newVal, oldVal)
    }
  }
}

let queue = [];
let has = {}
let pending = false
function flushScheduLerQueue() {
  let flushQueue = queue.slice(0)
  queue = []
  has = {}
  pending = false;
  flushQueue.forEach(q => q.run()) //在刷新的过程中可能还有新的watcher,重新放到queue中
}
function queueWatcher(watcher) {
  const id = watcher.id;
  if (!has[id]) {
    queue.push(watcher)
    has[id] = true;
    if (!pending) {
      //不管我们的update执行多少次，但是最终只执行一轮刷新操作
      nextTick(flushScheduLerQueue, 0)
      pending = true
    }
  }
}

let callbacks = []
let waiting = false;
function flushCallbacks() {
  let cbs = callbacks.slice(0)
  waiting = false;
  callbacks = []
  cbs.forEach(cb => cb())//按照顺序依次执行
}

//nextTick没有直接使用某个api，而是采用优雅降级的方式
//内部先采用的是promise(ie不兼容) MutationObserver(h5的API) 可以考虑ie专享的 setImmediate setTimeout
let timerFunc;
if (Promise) {
  timerFunc = () => {
    Promise.resolve().then(flushCallbacks)
  }
} else if (MutationObserver) {
  let observer = new MutationObserver(flushCallbacks);//这里传入的回调是异步执行的
  let textNode = document.createTextNode(1);
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    textNode.textContent = 2
  }
} else if (setImmediate) {
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  timerFunc = () => {
    setTimeout(flushCallbacks)
  }
}




//nextTick不是创建了一个异步任务，而是将这个任务维护到了队列中而已
export function nextTick(cb) {
  callbacks.push(cb)//维护nextTick中的callback方法
  if (!waiting) {
    setTimeout(() => {
      timerFunc()//最后一起刷新
    }, 0)
    waiting = true;
  }
}

//需要给每个属性增加一个dep，目的就是收集watcher
//一个视图中有多个属性（n个属性会对应一个视图) n个dep对应一个视图
//一个属性对应着多个视图
export default Watcher
