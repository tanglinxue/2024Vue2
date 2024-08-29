import { parseHTML } from './parse'
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g // {{}}

function genProps(attrs) {
  let str = ''
  for (let i = 0; i < attrs.length; i++) {
    let attr = attrs[i];
    //注意;   style："color:red;font-size: 20px
    if (attr.name === 'style') {
      let obj = {}
      attr.value.split(';').forEach(item => {
        let [key, value] = item.split(':')
        obj[key] = value
      })
      attr.value = obj
    }
    //拼接
    str += `${attr.name}:${JSON.stringify(attr.value)},`
  }
  return `{${str.slice(0, -1)}}`
}

function genChildren(el) {
  const children = el.children;
  if (children) {
    return children.map(child => gen(child)).join(',')
  }
}

function gen(node) {
  if (node.type === 1) {
    //递归
    return generate(node)
  } else {
    let text = node.text;
    if (!defaultTagRE.test(text)) {
      return `_v(${JSON.stringify(text)})` // _v(html)  _v('hello'+_s(name))
    }
    //处理特殊的文本
    let tokens = [] //存放每一段的代码  _v('hello',+_s(msg))
    //通过一个正则的案例来演示  在浏览器中 let reg = /a/g   reg.test('ab') reg.lastIndex = 0
    let lastIndex = defaultTagRE.lastIndex = 0; //如果正则是全局模式 需要每次使用前变为0
    let match;

    while (match = defaultTagRE.exec(text)) {
      let index = match.index;
      if (index > lastIndex) {
        tokens.push(JSON.stringify(text.slice(lastIndex, index)))
      }
      tokens.push(`_s(${match[1].trim()})`)
      lastIndex = index + match[0].length
    }

    if (lastIndex < text.length) {
      tokens.push(JSON.stringify(text.slice(lastIndex)))
    }

    return `_v(${tokens.join("+")})`
  }
}

// 语法层面的转移，处理开始的元素
export function generate(el) {
  let children = genChildren(el)
  let code = `_c('${el.tag}',${el.attrs.length ? `${genProps(el.attrs)}` : 'undefined'}${children ? `,${children}` : ''})`
  return code
}


//对模板进行编译处理
//模板引擎的实现原理就是with + new Function
export function compileToFunction(template) {
  //1.就是将template转化成ast语法树
  let ast = parseHTML(template)
  console.log(ast)
  //2 ast 语法树变成 render 函数 ,render方法执行后返回的结果就是虚拟DOM
  let code = generate(ast)
  console.log(code)
  // 3将render 字符串变成 函数
  code = `with(this){return ${code}}`
  let render = new Function(code)//根据代码生成render函数
  return render
}
