let id = 0;
class Dep {
  constructor() {
    this.id = id++;//属性的dep要收集watcher
    this.subs = []//这里存放着当前属性对应的watcher有哪些
  }
  depend() {
    //这里我们不希望放重复的watcher，而且刚才只是一个单向的关系 dep->watcher
    //watcher记录dep
    Dep.target.addDep(this) //让watcher记住Dep
  }
  addSub(watcher) {
    this.subs.push(watcher)
  }
  notify() {
    this.subs.forEach(watcher => watcher.update())//告诉watcher要更新
  }
}

Dep.target = null
export default Dep
