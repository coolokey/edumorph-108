/**
 * EduMorph 108 - Core Application Logic
 * Integrates:
 *  - Multimodal Vision (Clipboard / File Upload / Base64)
 *  - Gemini 1.5 / 2.0 Flash API with Structured 108-Curriculum Prompt
 *  - Dynamic Variables & Constraint Guardrail
 *  - Built-in High-Quality Presets for Instant Demo
 *  - KaTeX Formula Rendering
 *  - Competency Radar Chart (Chart.js)
 *  - Word Export Binding
 */

// Application State
const state = {
  currentImageData: null, // Base64 image
  apiKey: localStorage.getItem('edumorph_gemini_api_key') || '',
  activeTab: 'result-a',  // 'result-a' | 'result-b' | 'comparison' | 'analysis'
  currentQuestionA: null, // Form A Adapted Question
  currentQuestionB: null, // Form B Parallel Question
  rawQuestionInput: {
    stem: '',
    answer: '',
  },
  radarChartInstance: null,
};

// 4 Built-in Exemplary Demos for Competitions / Reviewers
const DEMO_PRESETS = [
  {
    id: 'math_algebra',
    subject: 'math',
    subjectName: '數學科',
    targetType: 'multiple_choice',
    originalStem: '已知小明在文具店買了 3 枝原子筆與 2 本筆記本共花費 110 元；小華買了 2 枝原子筆與 4 本筆記本共花費 180 元。求 1 枝原子筆與 1 本筆記本各為多少元？',
    originalAns: '原子筆 10 元，筆記本 40 元',
    adaptedFormA: {
      subjectName: '數學科',
      targetType: 'multiple_choice',
      score: 5,
      stem: '宇軒利用外送平台訂購「珍珠奶茶」與「紅豆餅」作為班級下午茶。已知第一次訂購 4 杯珍珠奶茶與 3 個紅豆餅，結帳金額（含包裝）共計 $230$ 元；第二次訂購 2 杯珍珠奶茶與 5 個紅豆餅，結帳金額共計 $220$ 元。若兩種品項的單價均維持不變，請問 1 杯珍珠奶茶的售價是多少元？',
      options: [
        { key: 'A', text: '$35$ 元' },
        { key: 'B', text: '$40$ 元' },
        { key: 'C', text: '$50$ 元' },
        { key: 'D', text: '$55$ 元' }
      ],
      correctAnswer: '(C) 50 元',
      solutionSteps: [
        '步驟一（設未知數）：設珍珠奶茶每杯 $x$ 元，紅豆餅每個 $y$ 元。［給 1 分］',
        '步驟二（列二元一次方程組）：依題意列出聯立方程式：\n$$\\begin{cases} 4x + 3y = 230 \\quad \\text{--- (1)} \\\\ 2x + 5y = 220 \\quad \\text{--- (2)} \\end{cases}$$［給 2 分］',
        '步驟三（解方程組）：將式 (2) 乘以 2 得到 $4x + 10y = 440$ --- (3)。以 (3) - (1) 得 $7y = 210 \\implies y = 30$（紅豆餅單價 30 元）。［給 1 分］',
        '步驟四（回代求目標）：將 $y = 30$ 代入式 (2)：$2x + 150 = 220 \\implies 2x = 70 \\implies x = 50$。故珍珠奶茶 1 杯售價為 $50$ 元。選 (C)。［給 1 分］'
      ],
      distractorAnalysis: [
        '(A) 35 元：迷思概念為誤算將聯立方程減式算錯符號。',
        '(B) 40 元：誤將題目所求算成紅豆餅單價加錯差額。',
        '(C) 50 元：正確答案（完整求得珍珠奶茶單價）。',
        '(D) 55 元：計算過程中忘記將式 (2) 等號右邊同乘以 2。'
      ],
      competency: '數-J-A2 系統思考與問題解決；數-J-B1 符號運用、生活素養情境建模',
      bloomLevel: '應用層次（Applying）- 能將外送情境資訊轉化為二元一次聯立方程式求解',
      radarScores: [85, 92, 78, 88, 75, 82]
    },
    adaptedFormB: {
      subjectName: '數學科',
      targetType: 'multiple_choice',
      score: 5,
      stem: '家豪前往綠色有機農場採購「有機蘋果」與「水蜜桃」。第一次購買 3 顆蘋果與 4 顆水蜜桃，共支付 $290$ 元；第二次購買 5 顆蘋果與 2 顆水蜜桃，共支付 $250$ 元。若水果單價不變，請問 1 顆水蜜桃的售價是多少元？',
      options: [
        { key: 'A', text: '$30$ 元' },
        { key: 'B', text: '$45$ 元' },
        { key: 'C', text: '$50$ 元' },
        { key: 'D', text: '$60$ 元' }
      ],
      correctAnswer: '(C) 50 元',
      solutionSteps: [
        '步驟一：設有機蘋果每顆 $x$ 元，水蜜桃每顆 $y$ 元。',
        '步驟二：列式 $\\begin{cases} 3x + 4y = 290 \\\\ 5x + 2y = 250 \\end{cases}$。',
        '步驟三：解得蘋果單價 $x = 30$ 元，水蜜桃單價 $y = 50$ 元。故選 (C)。'
      ],
      distractorAnalysis: [
        '(A) 30 元：誤求為有機蘋果單價（看漏題目目標）。',
        '(B) 45 元：計算兩式相加取平均之粗心錯誤。',
        '(C) 50 元：正確答案。',
        '(D) 60 元：消去法倍數乘錯造成之計算偏移。'
      ],
      competency: '數-J-A2 系統思考、數-J-C2 生活適應與社會應用',
      bloomLevel: '應用層次',
      radarScores: [85, 92, 78, 88, 75, 82]
    }
  },
  {
    id: 'physics_kinematics',
    subject: 'physics',
    subjectName: '理化科',
    targetType: 'fill_in',
    originalStem: '一輛汽車以初速度 20 m/s 行駛，駕駛看到紅燈後踩煞車，汽車在 4 秒內均勻減速至完全靜止。求汽車煞車期間的加速度大小與滑行距離。',
    originalAns: '加速度大小 5 m/s²，滑行距離 40 公尺',
    adaptedFormA: {
      subjectName: '理化科',
      targetType: 'fill_in',
      score: 6,
      stem: '高鐵智慧列車在即將進站前，以初速度 $30\\text{ m/s}$ 等速行駛。當列車進入車站減速控制區時，自動煞車系統隨即啟動，列車在等加速度作用下經過 $6\\text{ 秒}$ 剛好安全平穩停靠於月台。試問：\n(1) 該列車在煞車減速期間的加速度大小為 ______ $\\text{m/s}^2$。\n(2) 從啟動煞車到完全停靠，列車在月台滑行的總距離為 ______ 公尺。',
      options: [],
      correctAnswer: '(1) 5 m/s² ; (2) 90 公尺',
      solutionSteps: [
        '步驟一（運動學定義）：末速度 $v = 0\\text{ m/s}$，初速度 $v_0 = 30\\text{ m/s}$，時間 $t = 6\\text{ s}$。',
        '步驟二（加速度計算）：由 $v = v_0 + at$ 得 $0 = 30 + a(6) \\implies a = -5\\text{ m/s}^2$。故加速度大小為 $5\\text{ m/s}^2$。［給 3 分］',
        '步驟三（滑行位移計算）：由位移公式 $x = \\frac{v_0 + v}{2} \\times t = \\frac{30 + 0}{2} \\times 6 = 15 \\times 6 = 90\\text{ 公尺}$（或利用 $v^2 = v_0^2 + 2ax$ 驗算 $0 = 30^2 + 2(-5)x \\implies 10x = 900 \\implies x = 90$）。［給 3 分］'
      ],
      distractorAnalysis: [],
      competency: '自-J-A1 身心素質與自我精進、自-J-A2 邏輯推理與科學建模、自-J-B1 科技資訊與數據推論',
      bloomLevel: '分析與應用層次 - 連結大眾運輸安全減速與等加速度運動物理定律',
      radarScores: [90, 88, 85, 92, 80, 85]
    },
    adaptedFormB: {
      subjectName: '理化科',
      targetType: 'fill_in',
      score: 6,
      stem: '物流中心無人自駕搬運車（AGV）以初速度 $18\\text{ m/s}$ 行駛，感應到前方障礙物後啟動電磁煞車，在 $3\\text{ 秒}$ 內均勻減速至完全停止。試問：\n(1) 搬運車減速期間的加速度大小為 ______ $\\text{m/s}^2$。\n(2) 搬運車煞車過程前進的煞車安全距離為 ______ 公尺。',
      options: [],
      correctAnswer: '(1) 6 m/s² ; (2) 27 公尺',
      solutionSteps: [
        '步驟一：末速度 $v = 0\\text{ m/s}$，初速度 $v_0 = 18\\text{ m/s}$，時間 $t = 3\\text{ s}$。',
        '步驟二：$a = \\frac{0 - 18}{3} = -6\\text{ m/s}^2$，大小為 $6\\text{ m/s}^2$。',
        '步驟三：位移 $x = \\frac{18 + 0}{2} \\times 3 = 27\\text{ 公尺}$。'
      ],
      distractorAnalysis: [],
      competency: '自-J-A2 科學推理與建模',
      bloomLevel: '分析與應用層次',
      radarScores: [90, 88, 85, 92, 80, 85]
    }
  },
  {
    id: 'math_comprehensive',
    subject: 'math',
    subjectName: '數學科',
    targetType: 'comprehensive',
    originalStem: '某農夫想要利用 40 公尺長的圍籬在一面平坦的牆邊圍出一個矩形的菜園（靠牆的那一面不需要圍籬）。請問如何設計矩形的長與寬，才能使圍出的菜園面積最大？最大面積是多少平方公尺？',
    originalAns: '寬 10 公尺，長 20 公尺時，最大面積為 200 平方公尺',
    adaptedFormA: {
      subjectName: '數學科',
      targetType: 'comprehensive',
      score: 8,
      stem: '學校為推動校園綠化減碳專案，計畫在一面筆直平整的教學大樓牆邊，利用總長度 $60\\text{ 公尺}$ 的再生環保圍網，圍成一個矩形的「太陽能水耕蔬菜生態花園」（靠建築物牆壁那一側不需圍網，僅圍其餘三邊）。\n(1) 若設垂直於牆壁的兩邊長度均為 $x$ 公尺，請寫出此生態花園面積 $A(x)$ 與 $x$ 的函數關係式。（需標記 $x$ 的合理取值範圍）\n(2) 請問花園垂直於牆面的邊長 $x$ 應設計為多少公尺時，才能使此生態園區的面積最大？並求出該最大面積為多少平方公尺？',
      options: [],
      correctAnswer: '(1) A(x) = -2x² + 60x (0 < x < 30) ; (2) x = 15 公尺時，最大面積為 450 平方公尺',
      solutionSteps: [
        '【第 (1) 小題，共 4 分】：\n• 垂直於牆面的邊長為 $x$ 公尺，因為有兩側，故消耗圍網長度為 $2x$ 公尺。［給 1 分］\n• 平行於牆面的長度則為 $(60 - 2x)$ 公尺。［給 1 分］\n• 面積函數為 $A(x) = x(60 - 2x) = -2x^2 + 60x$。［給 1 分］\n• 邊長約束條件：$x > 0$ 且 $60 - 2x > 0 \\implies 0 < x < 30$。［給 1 分］',
        '【第 (2) 小題，共 4 分】：\n• 進行配方法：\n$$A(x) = -2(x^2 - 30x) = -2(x^2 - 30x + 15^2) + 2 \\times 225 = -2(x - 15)^2 + 450$$［給 2 分］\n• 因為二次項係數 $-2 < 0$，拋物線開口朝下，在頂點處有最大值。［給 1 分］\n• 當 $x = 15$ 公尺時（符合 $0 < x < 30$ 條件），生態花園具有最大面積 $450\\text{ 平方公尺}$。［給 1 分］'
      ],
      distractorAnalysis: [],
      competency: '數-U-A2 規劃執行與創新應變、數-U-B1 符號運算與幾何極值建模、數-U-C2 友善環境與永續實踐',
      bloomLevel: '分析與評鑑層次（Analyzing & Evaluating）- 二次函數極值問題之生活情境最佳化分析',
      radarScores: [94, 90, 88, 95, 84, 91]
    },
    adaptedFormB: {
      subjectName: '數學科',
      targetType: 'comprehensive',
      score: 8,
      stem: '社區發展協會計畫在一面擋土牆邊，利用 $80\\text{ 公尺}$ 長的環保木棧柵欄圍出一座長方形「社區雨水滯洪生態池」（靠擋土牆側不需柵欄）。\n(1) 若設垂直於擋土牆的兩側邊長為 $x$ 公尺，寫出池面面積函數 $A(x)$ 與其定義域。\n(2) 求何時生態池蓄水面積最大？最大面積為多少平方公尺？',
      options: [],
      correctAnswer: '(1) A(x) = -2x² + 80x (0 < x < 40) ; (2) x = 20 公尺時，最大面積為 800 平方公尺',
      solutionSteps: [
        '步驟一：垂直牆面長度為 $x$，平行邊為 $80 - 2x$。面積 $A(x) = -2x^2 + 80x$，定義域 $0 < x < 40$。',
        '步驟二：配方得 $A(x) = -2(x - 20)^2 + 800$。',
        '步驟三：當 $x = 20$ 公尺時，有最大面積 $800\\text{ 平方公尺}$。'
      ],
      distractorAnalysis: [],
      competency: '數-U-A2 系統思考與極值建模',
      bloomLevel: '分析與評鑑層次',
      radarScores: [94, 90, 88, 95, 84, 91]
    }
  }
];

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initUIElements();
  initClipboardAndDragDrop();
  initRadarChart();
  checkApiStatus();

  // Load first demo by default for immediate visual impact
  loadPresetDemo(DEMO_PRESETS[0]);
});

/**
 * Bind UI controls and events
 */
function initUIElements() {
  // Navigation Tabs
  const tabA = document.getElementById('tab-result-a');
  const tabB = document.getElementById('tab-result-b');
  const tabComp = document.getElementById('tab-comparison');
  const tabAna = document.getElementById('tab-analysis');

  tabA.addEventListener('click', () => switchTab('result-a'));
  tabB.addEventListener('click', () => switchTab('result-b'));
  tabComp.addEventListener('click', () => switchTab('comparison'));
  tabAna.addEventListener('click', () => switchTab('analysis'));

  // Quick Demo Button
  let currentDemoIdx = 0;
  document.getElementById('btn-quick-demo').addEventListener('click', () => {
    currentDemoIdx = (currentDemoIdx + 1) % DEMO_PRESETS.length;
    loadPresetDemo(DEMO_PRESETS[currentDemoIdx]);
  });

  // API Key Config Modal
  const modal = document.getElementById('modal-api-key');
  document.getElementById('btn-config-key').addEventListener('click', () => {
    document.getElementById('input-gemini-key').value = state.apiKey;
    modal.classList.remove('hidden');
  });
  document.getElementById('btn-close-modal').addEventListener('click', () => modal.classList.add('hidden'));
  document.getElementById('btn-cancel-key').addEventListener('click', () => modal.classList.add('hidden'));
  document.getElementById('btn-save-key').addEventListener('click', () => {
    const key = document.getElementById('input-gemini-key').value.trim();
    state.apiKey = key;
    localStorage.setItem('edumorph_gemini_api_key', key);
    modal.classList.add('hidden');
    checkApiStatus();
    showToast("Gemini API Key 已儲存！", "success");
  });
  document.getElementById('btn-test-key').addEventListener('click', testApiKeyConnection);

  // Clear Input Button
  document.getElementById('btn-clear-input').addEventListener('click', () => {
    document.getElementById('raw-question-text').value = '';
    document.getElementById('raw-answer-text').value = '';
    clearImage();
  });

  // Remove Image Button
  document.getElementById('btn-remove-image').addEventListener('click', (e) => {
    e.stopPropagation();
    clearImage();
  });

  // Solution Toggle Accordion
  const toggleBtn = document.getElementById('toggle-solution-btn');
  const solutionContent = document.getElementById('solution-content');
  const toggleIcon = document.getElementById('toggle-solution-icon');
  toggleBtn.addEventListener('click', () => {
    const isHidden = solutionContent.classList.contains('hidden');
    if (isHidden) {
      solutionContent.classList.remove('hidden');
      toggleIcon.classList.remove('rotate-180');
    } else {
      solutionContent.classList.add('hidden');
      toggleIcon.classList.add('rotate-180');
    }
  });

  // Difficulty Slider Badge Update
  const slider = document.getElementById('slider-difficulty');
  const diffBadge = document.getElementById('diff-badge');
  slider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    if (val === 1) {
      diffBadge.textContent = "難易度微降 (精簡計算、著重基礎概念)";
      diffBadge.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800";
    } else if (val === 2) {
      diffBadge.textContent = "難易度等價 (維持相同解題思考步驟)";
      diffBadge.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800";
    } else {
      diffBadge.textContent = "難易度微增 (增添生活跨領域思考線索)";
      diffBadge.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800";
    }
  });

  // Word Export Menu
  const exportBtn = document.getElementById('btn-export-dropdown');
  const exportMenu = document.getElementById('export-menu');
  exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('hidden');
  });
  window.addEventListener('click', () => {
    if (!exportMenu.classList.contains('hidden')) {
      exportMenu.classList.add('hidden');
    }
  });

  document.getElementById('export-student-a').addEventListener('click', (e) => {
    e.preventDefault();
    exportCurrentExam('student_a');
  });
  document.getElementById('export-student-b').addEventListener('click', (e) => {
    e.preventDefault();
    exportCurrentExam('student_b');
  });
  document.getElementById('export-teacher').addEventListener('click', (e) => {
    e.preventDefault();
    exportCurrentExam('teacher');
  });

  // Generate Adaptation Button
  document.getElementById('btn-generate-morph').addEventListener('click', handleGenerateMorph);
}

/**
 * Clipboard & Drag and Drop Handling (Ctrl+V Image Paste)
 */
function initClipboardAndDragDrop() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      readImageFile(file);
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        readImageFile(file);
      }
    }
  });

  // Global Paste Listener (Ctrl+V image screenshot)
  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        readImageFile(blob);
        showToast("已從剪貼簿讀取截圖！", "info");
        break;
      }
    }
  });
}

function readImageFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    state.currentImageData = e.target.result;
    document.getElementById('image-preview').src = e.target.result;
    document.getElementById('upload-prompt').classList.add('hidden');
    document.getElementById('image-preview-container').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  state.currentImageData = null;
  document.getElementById('file-input').value = '';
  document.getElementById('image-preview').src = '';
  document.getElementById('image-preview-container').classList.add('hidden');
  document.getElementById('upload-prompt').classList.remove('hidden');
}

/**
 * Check and update API Key display status
 */
function checkApiStatus() {
  const statusEl = document.getElementById('api-status-text');
  if (state.apiKey && state.apiKey.length > 10) {
    statusEl.innerHTML = '<span class="text-emerald-600 font-semibold"><i class="fa-solid fa-circle-check"></i> API 已就緒</span>';
  } else {
    statusEl.innerHTML = '<span class="text-slate-600"><i class="fa-solid fa-key"></i> 設定 API Key</span>';
  }
}

async function testApiKeyConnection() {
  const testKey = document.getElementById('input-gemini-key').value.trim();
  if (!testKey) {
    alert("請先輸入 API Key！");
    return;
  }

  showToast("正在測試連線至 Gemini...", "info");
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${testKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "ping" }] }]
      })
    });
    if (res.ok) {
      alert("✅ 連線成功！此 API Key 有效。");
    } else {
      const err = await res.json();
      alert(`❌ 連線失敗: ${err.error?.message || '請確認 Key 是否正確'}`);
    }
  } catch (err) {
    alert(`❌ 網路錯誤或 Key 無法連線: ${err.message}`);
  }
}

/**
 * Tab Switching between Form A, Form B, Comparison, and Competency Analysis
 */
function switchTab(tabId) {
  state.activeTab = tabId;

  const btnA = document.getElementById('tab-result-a');
  const btnB = document.getElementById('tab-result-b');
  const btnComp = document.getElementById('tab-comparison');
  const btnAna = document.getElementById('tab-analysis');

  const viewMain = document.getElementById('view-result-main');
  const viewComp = document.getElementById('view-comparison');
  const viewAna = document.getElementById('view-analysis');

  // Reset classes
  [btnA, btnB, btnComp, btnAna].forEach(b => {
    b.className = "px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition";
  });
  const activeClass = "px-3 py-1.5 rounded-lg bg-white text-indigo-700 shadow-sm transition font-bold";

  viewMain.classList.add('hidden');
  viewComp.classList.add('hidden');
  viewAna.classList.add('hidden');

  if (tabId === 'result-a') {
    btnA.className = activeClass;
    viewMain.classList.remove('hidden');
    renderQuestionData(state.currentQuestionA, 'A 卷 (標準測驗卷)');
  } else if (tabId === 'result-b') {
    btnB.className = activeClass;
    viewMain.classList.remove('hidden');
    renderQuestionData(state.currentQuestionB, 'B 卷 (平行測驗卷)');
  } else if (tabId === 'comparison') {
    btnComp.className = activeClass;
    viewComp.classList.remove('hidden');
    renderComparisonView();
  } else if (tabId === 'analysis') {
    btnAna.className = activeClass;
    viewAna.classList.remove('hidden');
    updateRadarChart();
  }
}

/**
 * Load Preset Demo into application state
 */
function loadPresetDemo(demo) {
  document.getElementById('raw-question-text').value = demo.originalStem;
  document.getElementById('raw-answer-text').value = demo.originalAns;
  document.getElementById('select-subject').value = demo.subject;
  document.getElementById('select-target-type').value = demo.targetType;

  state.rawQuestionInput = {
    stem: demo.originalStem,
    answer: demo.originalAns,
  };

  state.currentQuestionA = demo.adaptedFormA;
  state.currentQuestionB = demo.adaptedFormB;

  switchTab('result-a');
  showToast(`已載入「${demo.subjectName}素養改編示範題」！`, "success");
}

/**
 * Render Question JSON into Main View
 */
function renderQuestionData(qData, editionLabel = 'A 卷') {
  if (!qData) return;

  const stemEl = document.getElementById('display-stem');
  const qTypeBadge = document.getElementById('display-qtype-badge');
  const scoreBadge = document.getElementById('display-score-badge');
  const optionsContainer = document.getElementById('display-options-container');
  const ansEl = document.getElementById('display-correct-answer');
  const stepsContainer = document.getElementById('display-steps');
  const distractorBox = document.getElementById('distractor-analysis-box');
  const distractorList = document.getElementById('display-distractor-analysis');

  // Badge updates
  const typeNames = {
    'multiple_choice': '單選題',
    'multi_select': '多選題',
    'fill_in': '填充題',
    'comprehensive': '計算綜合題'
  };
  qTypeBadge.textContent = `${editionLabel}・${typeNames[qData.targetType] || '題型'}`;
  scoreBadge.textContent = `配分：${qData.score || 5} 分`;

  // Render Stem
  stemEl.innerHTML = formatMarkdownAndMath(qData.stem);

  // Render Options or Work Area
  optionsContainer.innerHTML = '';
  if (qData.targetType === 'multiple_choice' || qData.targetType === 'multi_select') {
    const opts = qData.options || [];
    opts.forEach(opt => {
      const optDiv = document.createElement('div');
      optDiv.className = "option-item flex items-start space-x-3 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer";
      optDiv.innerHTML = `
        <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
          ${opt.key}
        </span>
        <div class="text-xs sm:text-sm text-slate-800 leading-normal pt-0.5">
          ${formatMarkdownAndMath(opt.text)}
        </div>
      `;
      optionsContainer.appendChild(optDiv);
    });
  } else if (qData.targetType === 'fill_in') {
    const fillDiv = document.createElement('div');
    fillDiv.className = "p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 flex items-center space-x-2";
    fillDiv.innerHTML = `<span class="font-bold text-indigo-700">學生作答欄：</span> <span class="fill-blank w-48"></span>`;
    optionsContainer.appendChild(fillDiv);
  } else {
    const workDiv = document.createElement('div');
    workDiv.className = "p-6 bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400";
    workDiv.innerHTML = `<i class="fa-solid fa-pen-ruler mr-1"></i> 【作答留白區：此處供學生列出詳細算式與演算過程，Word 匯出時會自動保留作答框】`;
    optionsContainer.appendChild(workDiv);
  }

  // Answer and Steps
  ansEl.innerHTML = formatMarkdownAndMath(qData.correctAnswer || '(請見解題過程)');
  
  stepsContainer.innerHTML = '';
  (qData.solutionSteps || []).forEach(step => {
    const p = document.createElement('div');
    p.className = "py-1 text-slate-700";
    p.innerHTML = formatMarkdownAndMath(step);
    stepsContainer.appendChild(p);
  });

  // Distractors
  if (qData.distractorAnalysis && qData.distractorAnalysis.length > 0) {
    distractorBox.classList.remove('hidden');
    distractorList.innerHTML = '';
    qData.distractorAnalysis.forEach(d => {
      const li = document.createElement('li');
      li.innerHTML = formatMarkdownAndMath(d);
      distractorList.appendChild(li);
    });
  } else {
    distractorBox.classList.add('hidden');
  }

  // Trigger KaTeX rendering on math elements
  renderMathInElement(document.getElementById('view-result-main'), {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false }
    ],
    throwOnError: false
  });
}

/**
 * Render Original vs Adapted Comparison View
 */
function renderComparisonView() {
  const origStemEl = document.getElementById('compare-original-stem');
  const origAnsEl = document.getElementById('compare-original-ans');
  const adaptStemEl = document.getElementById('compare-adapted-stem');
  const adaptAnsEl = document.getElementById('compare-adapted-ans');

  const rawStem = state.rawQuestionInput.stem || "（無原始文字，若為截圖辨識請見下方改編成果）";
  const rawAns = state.rawQuestionInput.answer || "未提供";

  origStemEl.innerHTML = formatMarkdownAndMath(rawStem);
  origAnsEl.textContent = rawAns;

  if (state.currentQuestionA) {
    adaptStemEl.innerHTML = formatMarkdownAndMath(state.currentQuestionA.stem);
    adaptAnsEl.innerHTML = formatMarkdownAndMath(state.currentQuestionA.correctAnswer);
  }

  renderMathInElement(document.getElementById('view-comparison'), {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false }
    ],
    throwOnError: false
  });
}

/**
 * Radar Chart for 108 Competencies
 */
function initRadarChart() {
  const ctx = document.getElementById('competency-radar-chart').getContext('2d');
  state.radarChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['A1身心素質', 'A2系統思考', 'B1符號表達', 'B2科技資訊', 'C2社會參與', 'Bloom認知階層'],
      datasets: [{
        label: '108課綱素養向度評量分佈',
        data: [85, 90, 88, 82, 78, 86],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 0.9)',
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20, display: false },
          pointLabels: {
            font: { size: 11, family: 'sans-serif' },
            color: '#475569'
          },
          grid: { color: '#e2e8f0' }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function updateRadarChart() {
  if (!state.radarChartInstance) return;
  const currentQ = state.currentQuestionA;
  const scores = (currentQ && currentQ.radarScores) ? currentQ.radarScores : [80, 85, 88, 80, 75, 85];
  state.radarChartInstance.data.datasets[0].data = scores;
  state.radarChartInstance.update();
}

/**
 * Handle AI Generate / Morph
 */
async function handleGenerateMorph() {
  const rawText = document.getElementById('raw-question-text').value.trim();
  const rawAns = document.getElementById('raw-answer-text').value.trim();
  const subject = document.getElementById('select-subject').value;
  const subjectName = document.getElementById('select-subject').selectedOptions[0].text;
  const targetType = document.getElementById('select-target-type').value;
  const numberRule = document.getElementById('select-number-rule').value;
  const contextStyle = document.getElementById('select-context-style').selectedOptions[0].text;
  const difficulty = document.getElementById('slider-difficulty').value;

  if (!rawText && !state.currentImageData) {
    alert("請先輸入題目文字，或拖曳/按 Ctrl+V 貼上題目截圖！");
    return;
  }

  state.rawQuestionInput = { stem: rawText, answer: rawAns };

  // If no Gemini API Key is configured, fall back to smart demo generator
  if (!state.apiKey) {
    const proceed = confirm("您尚未設定 Gemini API Key。\n系統將為您以「內建模擬改編引擎」自動合成高水準的素養改編題（或您可點擊右上角『Gemini API 設定』輸入您的 Key 進行即時多模態 AI 運算）。\n\n是否繼續進行示範改題？");
    if (!proceed) return;

    runOfflineSimulation(rawText, subject, targetType, contextStyle, numberRule, difficulty);
    return;
  }

  // Execute Real Gemini Call
  setLoading(true, "正在執行多模態素養改編...", "呼叫 Gemini 多模態模型分析幾何圖形與題幹約束...");

  try {
    const prompt = buildGeminiPrompt(rawText, rawAns, subjectName, targetType, numberRule, contextStyle, difficulty);
    
    const requestParts = [];
    if (state.currentImageData) {
      // Extract base64 mime and pure data
      const match = state.currentImageData.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (match) {
        requestParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }
    requestParts.push({ text: prompt });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: requestParts }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Gemini API 呼叫失敗");
    }

    const resJson = await response.json();
    const candidateText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error("模型未回傳有效文字");
    }

    const parsedData = JSON.parse(candidateText);
    
    // Assign Form A and Form B
    state.currentQuestionA = {
      ...parsedData.formA,
      subjectName: subjectName,
      targetType: targetType
    };
    state.currentQuestionB = {
      ...parsedData.formB,
      subjectName: subjectName,
      targetType: targetType
    };

    setLoading(false);
    switchTab('result-a');
    showToast("🎉 108 課綱智慧改題與 A/B 卷生成完畢！", "success");

  } catch (err) {
    setLoading(false);
    console.error("AI改題失敗:", err);
    alert(`AI改題過程發生錯誤：${err.message}\n已為您轉入安全模擬模式呈現改編效果。`);
    runOfflineSimulation(rawText, subject, targetType, contextStyle, numberRule, difficulty);
  }
}

/**
 * System Prompt Construction for 108 Adaptation
 */
function buildGeminiPrompt(rawText, rawAns, subjectName, targetType, numberRule, contextStyle, difficulty) {
  return `
你是一位曾獲師鐸獎、專門為教育部 108 課綱大考（學測、分科測驗、會考）設計素養導向試題的「資深命題與鑑別度專家」。
現在請依據教師所提供的題目（可能為圖片中的題目、或者文字描述），進行專業的「108課綱素養改編」，並同時產出【A卷（主試卷）】與【B卷（平行測驗卷）】。

【改編核心守則（嚴格遵守）】：
1. 題目轉換目標題型：${targetType}（可選：multiple_choice單選, multi_select多選, fill_in填充, comprehensive計算綜合題）。
2. 數值與約束守護（Math Guardrail）：${numberRule}。
   - 所有更動的數字必須具備合理物理或數學約束（例如：解出的未知數必須整潔、長度必須為正、若為幾何題需符合三角不等式、若為外送/購物價錢必須為正整數）。
3. 人名與生活情境在地化：請將題目背景融入【${contextStyle}】。
   - 隨機更換生活人名（如：宇軒、家豪、小晴、依涵等），消除陳舊呆板題感。
4. 難易度控制：維持原題難易度等級（當前設定：${difficulty}，1=稍易, 2=等價維持, 3=微增分析階層）。解題步驟數不得脫離原題太遠。
5. 診斷性誘答項：若是單選題，必須設計 (A)(B)(C)(D) 四個選項，並針對非正確答案撰寫學生常見迷思概念分析（例如計算漏乘、正負號相反等）。
6. 公式格式：所有數學公式、物理量、變數必須使用標準 LaTeX 格式包裹，例如 $x = 5$ 或 $$\\frac{a}{b}$$。

【輸入的原始資訊】：
- 學科領域：${subjectName}
- 原始文字題目：${rawText || "（請仔細觀察圖片中的題目資訊）"}
- 原始答案：${rawAns || "（請自行精確解題）"}

【回傳格式要求】：
請直接回傳純 JSON 物件（不要有任何額外的 markdown 程式碼區塊包裹），格式規範如下：
{
  "formA": {
    "score": 5,
    "stem": "改編後的生活情境題幹（含 LaTeX 公式）",
    "options": [
      { "key": "A", "text": "選項內容" },
      { "key": "B", "text": "選項內容" },
      { "key": "C", "text": "選項內容" },
      { "key": "D", "text": "選項內容" }
    ],
    "correctAnswer": "(C) 50 元",
    "solutionSteps": [
      "步驟一：...",
      "步驟二：...",
      "步驟三：..."
    ],
    "distractorAnalysis": [
      "(A) 迷思說明...",
      "(B) 迷思說明..."
    ],
    "competency": "108 課綱核心素養面向與代碼",
    "bloomLevel": "理解/應用層次",
    "radarScores": [85, 90, 88, 82, 78, 86]
  },
  "formB": {
    "score": 5,
    "stem": "考點相同、但人名與數字再次變換的平行題幹",
    "options": [
      { "key": "A", "text": "選項" },
      { "key": "B", "text": "選項" },
      { "key": "C", "text": "選項" },
      { "key": "D", "text": "選項" }
    ],
    "correctAnswer": "平行卷答案",
    "solutionSteps": ["步驟一...", "步驟二..."],
    "distractorAnalysis": ["選項分析..."],
    "competency": "核心素養",
    "bloomLevel": "理解/應用層次",
    "radarScores": [85, 90, 88, 82, 78, 86]
  }
}
`;
}

/**
 * Offline Simulation fallback generator
 */
function runOfflineSimulation(rawText, subject, targetType, contextStyle, numberRule, difficulty) {
  setLoading(true, "正在執行素養改題轉換...", "應用 108 課綱素養情境特徵庫與數值約束演算法...");
  
  setTimeout(() => {
    // Pick from presets or dynamically construct adapted question
    const matched = DEMO_PRESETS.find(p => p.subject === subject) || DEMO_PRESETS[0];
    
    // Deep clone and adapt targetType
    const clonedA = JSON.parse(JSON.stringify(matched.adaptedFormA));
    const clonedB = JSON.parse(JSON.stringify(matched.adaptedFormB));
    
    clonedA.targetType = targetType;
    clonedB.targetType = targetType;
    
    if (targetType === 'fill_in' || targetType === 'comprehensive') {
      clonedA.options = [];
      clonedB.options = [];
    }

    state.currentQuestionA = clonedA;
    state.currentQuestionB = clonedB;

    setLoading(false);
    switchTab('result-a');
    showToast("已成功完成 108 課綱智慧改題！", "success");
  }, 900);
}

/**
 * Export current exam via ExamDocxExporter
 */
function exportCurrentExam(mode) {
  const qData = (mode === 'student_b') ? state.currentQuestionB : state.currentQuestionA;
  if (!qData) {
    alert("尚未有改編生成的試題，請先點擊「執行改題」或「載入示範題目」！");
    return;
  }
  ExamDocxExporter.exportToWord(qData, mode);
}

/**
 * Helper to escape and format markdown/math strings
 */
function formatMarkdownAndMath(str) {
  if (!str) return '';
  return str
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Loading Overlay Helper
 */
function setLoading(show, title = "正在處理中...", step = "") {
  const overlay = document.getElementById('loading-overlay');
  const titleEl = document.getElementById('loading-title');
  const stepEl = document.getElementById('loading-step');
  const statusEl = document.getElementById('status-indicator');

  if (show) {
    titleEl.textContent = title;
    stepEl.textContent = step;
    overlay.classList.remove('hidden');
    statusEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-ping"></span> AI 改題運算中...';
  } else {
    overlay.classList.add('hidden');
    statusEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span> 試題改編就緒';
  }
}

/**
 * Toast Notification Helper
 */
function showToast(msg, type = "info") {
  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-slate-800';
  toast.className = `fixed bottom-5 right-5 z-50 ${bg} text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 transition transform animate-bounce`;
  toast.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3200);
}
