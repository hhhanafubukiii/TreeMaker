// Elements
const codeButton = document.getElementById("code-btn");
const AIButton = document.getElementById("ai-btn");
const visualizeButton = document.getElementById("visualize-btn");
const input = document.getElementById("input");
const canvas = document.getElementById("canvas-tree");
const ctx = canvas.getContext("2d");
const canvasParent = document.getElementById("canvas-parent");

// Variables
let inputMode = "code";
let treeRoot = null;
let nodePositions = new Map();

// Scaling and dragging
const zoomIntensity = 0.1;
let scale = 1;
let originX = 0;
let originY = 0;
// Mouse
let isDragging = false;
let lastDragX = 0;
let lastDragY = 0;

// Touch
let isTouchDragging = false;
let lastTouchX = 0;
let lastTouchY = 0;
let lastDistance = 0;

// OpenAI API key
API_KEY = null

async function getKey() {
    const headers = new Headers();
    headers.append("ngrok-skip-browser-warning", "true");

    const response = await fetch(
      "https://ab3e851032ea.ngrok-free.app/api/key",
      {
        method: "GET",
        headers: headers,
      }
    );

    console.log(response)
    const data = await response.json();
    API_KEY = data.key
}
getKey()

// Tree node class
class TreeNode {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
    }
}

document.addEventListener("DOMContentLoaded", () => {
  codeButton.addEventListener("click", () => loadInputMode(codeButton, AIButton));
  AIButton.addEventListener("click", () => loadInputMode(AIButton, codeButton));
  visualizeButton.addEventListener("click", () => startProcess());

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  canvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    lastDragX = e.clientX;
    lastDragY = e.clientY;
  });
  canvas.addEventListener("mouseup", (e) => {
    isDragging = false;
  });
  canvas.addEventListener("mouseleave", (e) => {
    isDragging = false;
  });
  canvas.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastDragX;
    const dy = e.clientY - lastDragY;
    originX += dx;
    originY += dy;
    lastDragX = e.clientX;
    lastDragY = e.clientY;
    draw();
  });
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const wheelDirection = e.deltaY < 0 ? 1 : -1;
    const zoom = Math.exp(wheelDirection * zoomIntensity);

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    originX = mouseX - (mouseX - originX) * zoom;
    originY = mouseY - (mouseY - originY) * zoom;

    scale *= zoom;
    scale = Math.min(scale, 5)
    scale = Math.max(scale, 0.1)
    draw();
  });
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      isTouchDragging = true;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    }
  });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault()
    if (isTouchDragging && e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastTouchX;
      const dy = e.touches[0].clientY - lastTouchY;
      originX += dx;
      originY += dy;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      draw();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (lastDistance) {
        const zoom = distance / lastDistance;
        scale *= zoom;
        scale = Math.max(0.1, Math.min(5, scale));
        draw();
      } else {
          lastDistance = distance;
      }
    }
  });

  canvas.addEventListener("touchend", (e) => {
    isTouchDragging = false;
    lastDistance = 0;
  });
});

async function startProcess() {
  if (inputMode === "code") {
    try {
      const parsedArray = JSON.parse(input.value);
      if (!Array.isArray(parsedArray)) throw new Error("Not an array");
      const numbers = parsedArray.map(Number).filter((n) => !isNaN(n));
      if (numbers.length === 0) {
        alert("Массив пустой или некорректный!");
        return;
      }
      renderTree(numbers);
    } catch (e) {
      alert("Введите валидный массив чисел, например [10, 5, 15]");
    }
  } else {
    try {
      const description = input.value;
      const numbers = await getArrayFromDescription(description);
      renderTree(numbers);
    } catch (err) {
      alert(err);
    }
  }
}

function renderTree(data) {
  treeRoot = buildTree(data);
  if (!treeRoot) {
    draw();
    return;
  }
  calculateNodePositions(treeRoot);

  const rootPos = nodePositions.get(treeRoot);
  originX = canvas.width / 2 - rootPos.x * scale;
  originY = canvas.height / 4 - rootPos.y * scale;

  draw();
}

function buildTree(arr) {
    if (!arr || arr.length === 0) return null;
    let root = new TreeNode(arr[0]);
    for (let i = 1; i < arr.length; i++) {
        insertNode(root, arr[i]);
    }
    return root;
}

function insertNode(root, value) {
    if (root === null) return new TreeNode(value);
    if (value < root.value) {
        root.left = insertNode(root.left, value);
    } else if (value > root.value) {
        root.right = insertNode(root.right, value);
    }
    return root;
}

function calculateNodePositions(root) {
    nodePositions.clear();
    const levelHeight = 80;
    let x = 0;

    function dfs(node, depth = 0) {
        if (!node) return;
        dfs(node.left, depth + 1);

        nodePositions.set(node, { x: x * 50, y: depth * levelHeight });
        x++;

        dfs(node.right, depth + 1);
    }

    dfs(root);

    const allX = Array.from(nodePositions.values()).map((p) => p.x);
    const centerX = (Math.min(...allX) + Math.max(...allX)) / 2;
    nodePositions.forEach((pos) => (pos.x -= centerX));
}

function draw() {
    if (!treeRoot) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.translate(originX, originY);
    ctx.scale(scale, scale);

    drawRecursive(treeRoot);

    ctx.restore();
}

function drawRecursive(node) {
  if (!node) return;
  const pos = nodePositions.get(node);

  if (node.left) {
    const childPos = nodePositions.get(node.left);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(childPos.x, childPos.y);
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 2 / scale;
    ctx.stroke();
    drawRecursive(node.left);
  }
  if (node.right) {
    const childPos = nodePositions.get(node.right);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(childPos.x, childPos.y);
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 2 / scale;
    ctx.stroke();
    drawRecursive(node.right);
  }

  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI);
  ctx.fillStyle = "#0d6efd";
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = `bold 16px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(node.value, pos.x, pos.y);
}

function resizeCanvas() {
    canvas.width = canvasParent.clientWidth;
    canvas.height = canvasParent.clientHeight;
    originX = canvas.width / 2;
    originY = canvas.height / 4;
    draw();
}

function loadInputMode(activeBtn, inactiveBtn) {
    input.value = '';
    inputMode = activeBtn === codeButton ? "code" : "ai";
    activeBtn.classList.add("btn-primary");
    activeBtn.classList.remove("btn-outline-primary");

    inactiveBtn.classList.add("btn-outline-primary");
    inactiveBtn.classList.remove("btn-primary");

    input.placeholder =
        inputMode === "code"
            ? "Введите массив, например [10, 5, 15]"
            : "Введите описание дерева";
}

async function getArrayFromDescription(description) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + API_KEY,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "Ты помощник, который получает текстовое описание бинарного дерева и возвращает массив чисел JSON.",
                },
                { role: "user", content: description },
            ],
            temperature: 0,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "array_of_numbers",
                    schema: {
                        type: "object",
                        properties: {
                            array: {
                                type: "array",
                                items: { type: "number" },
                            },
                        },
                        required: ["array"],
                    },
                },
            },
        }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content
    const arr = JSON.parse(content).array
    return arr
}
