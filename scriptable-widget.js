// 盐的工作台 · iOS 主屏幕小组件
// 从 Firebase Realtime Database 读取今日任务与阅读进度
// 用法：复制全文 → Scriptable → 新建脚本 → 粘贴 → 保存
// 然后在主屏幕添加 Scriptable 小组件，编辑小组件时选择这个脚本

const DB_URL = "https://yan-workbench-default-rtdb.asia-southeast1.firebasedatabase.app/workbench/data.json";

const COLORS = {
  bg: "#f4f3f0",
  surface: "#fcfbf8",
  text: "#232220",
  text2: "#6b665d",
  text3: "#8c877c",
  accent: "#2f2e2b",
  fitness: "#bd8a4e",
  study: "#5f7a99",
  read: "#6f8f6a"
};

const data = await fetchData();
const widget = buildWidget(data);
Script.setWidget(widget);
Script.complete();

async function fetchData() {
  try {
    const req = new Request(DB_URL);
    req.timeoutInterval = 12;
    req.method = "GET";
    const json = await req.loadJSON();
    return json;
  } catch (e) {
    return null;
  }
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildWidget(data) {
  const widget = new ListWidget();
  widget.backgroundColor = new Color(COLORS.bg);
  widget.setPadding(16, 16, 16, 16);
  widget.spacing = 8;

  const now = new Date();
  const weekday = "日一二三四五六"[now.getDay()];

  // 顶部：日期 + 问候
  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();

  const dayNum = header.addText(String(now.getDate()));
  dayNum.font = Font.boldSystemFont(34);
  dayNum.textColor = new Color(COLORS.accent);

  header.addSpacer(10);

  const metaStack = header.addStack();
  metaStack.layoutVertically();
  const dateLine = metaStack.addText(`${now.getMonth() + 1}月 · 周${weekday}`);
  dateLine.font = Font.boldSystemFont(13);
  dateLine.textColor = new Color(COLORS.text2);

  const h = now.getHours();
  let greet = "早安";
  if (h >= 11) greet = "上午好";
  if (h >= 13) greet = "下午好";
  if (h >= 18) greet = "晚上好";
  const greetLine = metaStack.addText(greet);
  greetLine.font = Font.systemFont(11);
  greetLine.textColor = new Color(COLORS.text3);

  widget.addSpacer(10);

  if (!data) {
    const err = widget.addText("数据加载失败，请检查网络或 Firebase 规则");
    err.font = Font.systemFont(12);
    err.textColor = new Color(COLORS.text3);
    err.lineLimit = 2;
    return widget;
  }

  // 今日任务
  const schedule = Array.isArray(data.schedule) ? data.schedule : [];
  const today = todayStr();
  const todays = schedule
    .filter(i => i.date === today)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  if (todays.length === 0) {
    const empty = widget.addText("今天暂无安排");
    empty.font = Font.systemFont(13);
    empty.textColor = new Color(COLORS.text3);
  } else {
    const maxTasks = config.widgetFamily === "small" ? 2 : (config.widgetFamily === "large" ? 6 : 3);
    todays.slice(0, maxTasks).forEach(item => {
      addTaskRow(widget, item);
    });
    if (todays.length > maxTasks) {
      const more = widget.addText(`+${todays.length - maxTasks} 项`);
      more.font = Font.systemFont(10);
      more.textColor = new Color(COLORS.text3);
      more.rightAlignText();
    }
  }

  widget.addSpacer();

  // 阅读进度
  const reads = Array.isArray(data.read) ? data.read : [];
  if (reads.length > 0 && config.widgetFamily !== "small") {
    const item = reads[0];
    const pct = Math.min(100, Math.round((item.current || 0) / (item.target || 1) * 100));
    const readStack = widget.addStack();
    readStack.layoutVertically();
    readStack.spacing = 4;

    const readTitle = readStack.addStack();
    readTitle.layoutHorizontally();
    const readName = readTitle.addText(item.title || "阅读");
    readName.font = Font.boldSystemFont(11);
    readName.textColor = new Color(COLORS.text2);
    readTitle.addSpacer();
    const readPct = readTitle.addText(`${pct}%`);
    readPct.font = Font.boldSystemFont(11);
    readPct.textColor = new Color(COLORS.read);

    const barMax = config.widgetFamily === "large" ? 340 : 260;
    const barStack = readStack.addStack();
    barStack.size = new Size(0, 5);
    barStack.cornerRadius = 3;
    barStack.backgroundColor = new Color("#e0ded6");
    const fill = barStack.addStack();
    fill.size = new Size(Math.round(pct / 100 * barMax), 5);
    fill.backgroundColor = new Color(COLORS.read);
    fill.cornerRadius = 3;
  }

  // 点击小组件打开今日聚焦页
  widget.url = "https://jiangxin20051231-svg.github.io/yan-workbench/daily-focus.html";

  // 每 15 分钟刷新一次
  widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 15);

  return widget;
}

function addTaskRow(widget, item) {
  const row = widget.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  row.spacing = 8;

  const timeColor = item.cat === "健身" ? COLORS.fitness : (item.cat === "学习" ? COLORS.study : COLORS.text3);
  const time = row.addText(item.time || "--:--");
  time.font = Font.boldSystemFont(12);
  time.textColor = new Color(timeColor);
  time.minimumScaleFactor = 0.8;

  const body = row.addStack();
  body.layoutVertically();
  const title = body.addText(item.title || "事项");
  title.font = Font.boldSystemFont(13);
  title.textColor = new Color(COLORS.text);
  title.lineLimit = 1;

  if (item.content) {
    const desc = body.addText(item.content);
    desc.font = Font.systemFont(10);
    desc.textColor = new Color(COLORS.text3);
    desc.lineLimit = 1;
  }

  row.addSpacer();

  const tagColor = item.cat === "健身" ? COLORS.fitness : (item.cat === "学习" ? COLORS.study : COLORS.accent);
  const tagBg = row.addStack();
  tagBg.backgroundColor = new Color(tagColor);
  tagBg.cornerRadius = 8;
  tagBg.setPadding(3, 6, 3, 6);
  const tagText = tagBg.addText(item.cat || "事项");
  tagText.font = Font.boldSystemFont(9);
  tagText.textColor = Color.white();
}
