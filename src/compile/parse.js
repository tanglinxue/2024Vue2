const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;   // 标签名称
const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //<span:xx>
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 标签开头的正则 捕获的内容是标签名
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的 </div>
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的
//<div id="app"></div>
const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的 >
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g // {{}}

export function parseHTML(html) {
  const ELEMENT_TYPE = 1;
  const TEXT_TYPE = 3;
  const stack = [];//用于存放元素的
  let currentParent;//指向的是栈中的最后一个
  let root;

  function createASTElement(tag, attrs) {
    return {
      tag,
      type: ELEMENT_TYPE,
      children: [],
      attrs,
      parent: null
    }
  }

  // 最终需要转化成一颗抽象语法树
  //利用栈形来创造一棵树
  function start(tag, attrs) {
    let node = createASTElement(tag, attrs);//创造一个ast节点
    if (!root) {//看一下是否是空树
      root = node//如果为空则当前是树的根节点
    }
    if (currentParent) {
      node.parent = currentParent;
      currentParent.children.push(node)
    }
    stack.push(node)
    currentParent = node //currentParent为栈中的最后一个
  }
  function chars(text) {//文本直接放到当前指向的节点中
    text = text.replace(/\s/g, '')
    text && currentParent.children.push({
      text,
      type: TEXT_TYPE,
      parent: currentParent
    })
  }
  function end() {
    let node = stack.pop()//弹出最后一个,校验标签是否合法
    currentParent = stack[stack.length - 1]
  }

  function advance(n) {
    html = html.substring(n)
  }
  function parseStartTag() {
    const start = html.match(startTagOpen)
    if (start) {
      const match = {
        tagName: start[1],
        attrs: []
      }
      advance(start[0].length)

      //如果不是开始标签的结束就一直匹配下去
      let attr, end
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        advance(attr[0].length)
        match.attrs.push({ name: attr[1], value: attr[3] || attr[4] || attr[5] })
      }
      if (end) {
        advance(end[0].length)
      }
      return match
    }

    return false; //不是开始标签
  }
  while (html) {

    //如果textEnd为0，说明是一个开始标签或者结束标签
    //如果textEnd>0，说明就是文本的结束位置
    let textEnd = html.indexOf('<') //如果indexOf的索引是0，则说明是个标签
    if (textEnd == 0) {
      const startTagMatch = parseStartTag();
      if (startTagMatch) { //解析到的开始标签
        start(startTagMatch.tagName, startTagMatch.attrs)
        continue
      }

      let endTagMatch = html.match(endTag)
      if (endTagMatch) {
        advance(endTagMatch[0].length);
        end(endTagMatch[1])
        continue
      }

    }
    if (textEnd > 0) {
      let text = html.substring(0, textEnd)
      if (text) {
        chars(text)
        advance(text.length)
      }
    }
  }
  return root
}
