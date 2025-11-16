Reddit Thread 3D Ecosystem – Claude Friendly Spec
1️⃣ High-level Architecture

Chrome extension with:

/extension
  ├── manifest.json
  ├── content-script.js
  ├── popup.html
  ├── popup.js (or bundle with React)
  ├── popup.css
  ├── thread-parser.js
  ├── data.json (optional cache)
  └── /assets


Core idea:

Content Script

➡ 從 Reddit 頁面 DOM 擷取 recursive comment tree
➡ 傳回 popup（via chrome.runtime.sendMessage）

Popup (React + Three.js)

➡ 接收 comment tree
➡ 轉換成 3D node-link ecosystem
➡ 設定互動：click → scroll to comment（content script 也支援）

2️⃣ Data Structure (Claude-friendly JSON Schema)

這是最重要的。Claude 用這個 schema 可以一次生出 90% 程式。

{
  "postId": "string",
  "title": "string",
  "url": "string",
  "root": {
    "id": "string",
    "depth": 0,
    "text": "string",
    "author": "string",
    "score": number,
    "timestamp": number,
    "children": [
      {
        "id": "string",
        "depth": 1,
        "text": "string",
        "author": "string",
        "score": number,
        "timestamp": number,
        "children": [ ... ]
      }
    ]
  }
}


細部欄位說明：

欄位	用途
id	用來 scroll-to 或 pointer linking
depth	生態系的「層級」決定 Z 軸 or Y 軸位置
score	決定節點能量（光亮度）
children	遞迴表示法（最重要）
text	點擊後右側內容顯示用
3️⃣ Ecosystem Node Rendering Logic (Claude friendly rules)

讓 Claude 知道怎麼把資料轉成 3D entity。

Node Positioning
x = parent.x + random(-0.5, 0.5)
y = -depth * 0.8
z = random(-0.3, 0.3)

Node Appearance
size = clamp(1 + log(childrenCount + 1), 1, 4)
color = depth < 2 ? "#6bbaff" : depth < 5 ? "#a4e86f" : "#ffda8e"
opacity = map(score, 0, maxScore, 0.4, 1)

Edges
lineWidth = 0.01 * (1 + childrenCount)
color = "#ffffff33"

4️⃣ Event Types (for visual changes)

給 Claude 做 conditional styling：

{
  "isDeepNode": depth >= 5,            // 深海知識
  "isBranch": childrenCount > 3,       // 分岐
  "isInactive": recentReplies == 0,    // decay
  "isResurgence": revived == true,     // 復活
  "isSolution": text contains “solve/fix/replaced/cable”
}


Visual mapping (Claude 能用這些作動畫)：

if isDeepNode → glow = blue
if isBranch → nodePulse animation
if isSolution → color = green
if isResurgence → yellow flash
if isInactive → dim opacity

5️⃣ Popup UI Structure

Claude 可直接依照這個組件結構寫 React：

<Popup>
    <Header>Thread Ecosystem</Header>
    <Canvas3D>
        <Nodes />
        <Edges />
        <InteractionHandlers />
    </Canvas3D>
    <SidePanel>
        <CommentDetail />
    </SidePanel>
</Popup>

6️⃣ Core TODO Functions (Claude-friendly)

這部分是 你要交給 Claude 實作的功能清單。

🍀 A. Content Script Functions
1. parseThread()

Input: DOM

Output: JSON tree (the schema above)

Tasks:

找到所有 comment containers

解析 depth（依 class 或 indent）

抓 author / text / score / timestamp

用 stack-based reconstruction 建立 recursive tree

2. sendThreadToPopup(tree)

chrome.runtime.sendMessage(tree)

3. scrollToComment(id)

Find element by id

element.scrollIntoView({ behavior: "smooth" })

🌿 B. Popup Script / React Functions
1. fetchThreadFromContentScript()

接收 thread JSON。

2. transformTreeTo3DGraph(tree)

create nodes[]

create edges[]

assign random offsets

compute depth-based y positions

3. renderEcosystem(nodes, edges)

用 Three.js or react-three-fiber

4. onNodeClick(node)

setSelectedNode(node)

chrome.runtime.sendMessage({ action: "scroll", id: node.id })

5. CommentDetail component

顯示：

author
score
timestamp
text (multi-line)
button: "Jump to comment"

🌱 C. Utility Functions (Claude-friendly)
1. extractKeywords(text)

(optional) For highlighting "fix/solve" nodes.

2. computeNodeEnergy(score, depth, childrenCount)
3. detectResurgence(node)

(如果 timestamp 跟 parent 差距大，視為復活)

7️⃣ Minimum Viable Demo (8 hours)

告訴 Claude：這是 deliverable 最低要求。

✔ parse 30–50 comments
✔ 建立 recursive tree
✔ 3D points + lines
✔ hover = show small info
✔ click = scroll to comment
✔ highlight deep nodes / solution nodes

完成度會超高。

8️⃣ Claude Prompt Example（你可直接貼給 Claude）
You are building a Chrome extension that renders a Reddit thread as a 3D "Ecosystem Map" using react-three-fiber.

Here is the required data structure:
[貼上上方 JSON Schema]

Here are the rendering rules:
[貼上 Node Appearance, Positioning, Event Rules]

Here are the TODO functions:
[貼上全部 TODO functions]

Please:
1. Generate all code files needed for the Chrome extension.
2. Include manifest.json, content-script.js, popup.html, popup.js (React), and styling.
3. Implement the 3D ecosystem using react-three-fiber or plain Three.js.
4. Implement scroll-to-comment behavior.
5. Make sure the code is modular and readable.
6. Use minimal external dependencies.


Claude 就會一次寫出：

extension folder

content script

popup React project

3D ecosystem code
