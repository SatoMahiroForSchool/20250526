let video;
let predictions = [];
let handPredictions = [];
let facemesh;
let handpose;

function setup() {
  createCanvas(640, 480);

  // 啟用攝影機
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // 啟用 facemesh
  facemesh = ml5.facemesh(video, () => {
    console.log("Facemesh model loaded!");
  });
  facemesh.on("predict", results => {
    predictions = results;
  });

  // 啟用 handpose
  handpose = ml5.handpose(video, () => {
    console.log("Handpose model loaded!");
  });
  handpose.on("predict", results => {
    handPredictions = results;
  });
}
// 主要繪圖函式
function draw() {
  if (!video) return; // 如果攝影機尚未啟用則不執行

  image(video, 0, 0, width, height); // 顯示攝影機畫面

  noFill();
  strokeWeight(3); // 設定線條粗細

  // 預設圓圈位置為鼻頭
  let circlePos = null;

  // 臉部偵測
  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh; // 取得臉部關鍵點座標

    // 額頭（以10號點為例）、左眼（33）、右眼（263）、左臉頰（234）、右臉頰（454）
    const forehead = keypoints[10];
    const leftEye = keypoints[33];
    const rightEye = keypoints[263];
    const leftCheek = keypoints[234];
    const rightCheek = keypoints[454];
    const noseTip = keypoints[1];

    // 預設為鼻頭
    circlePos = noseTip;

    // 手勢辨識（剪刀石頭布）
    if (handPredictions.length > 0) {
      for (let i = 0; i < handPredictions.length; i++) {
        const landmarks = handPredictions[i].landmarks;

        // 判斷手勢
        const gesture = detectGesture(landmarks);

        // 根據手勢決定圓圈位置
        if (gesture === "rock") {
          circlePos = forehead; // 石頭：額頭
        } else if (gesture === "scissors") {
          circlePos = leftEye && rightEye
            ? [(leftEye[0] + rightEye[0]) / 2, (leftEye[1] + rightEye[1]) / 2]
            : noseTip; // 剪刀：兩眼中間
        } else if (gesture === "paper") {
          circlePos = leftCheek && rightCheek
            ? [(leftCheek[0] + rightCheek[0]) / 2, (leftCheek[1] + rightCheek[1]) / 2]
            : noseTip; // 布：兩臉頰中間
        }
      }
    }

    // 畫圓圈
    if (circlePos) {
      noFill();
      stroke(255, 255, 0); // 黃色
      ellipse(circlePos[0], circlePos[1], 50, 50);
    }
  }

  // 手部偵測（標記食指指尖）
  if (handPredictions.length > 0) {
    for (let i = 0; i < handPredictions.length; i++) {
      const landmarks = handPredictions[i].landmarks; // 取得手部關鍵點
      const indexFingerTip = landmarks[8]; // 食指指尖座標（index 8）
      fill(255); // 白色
      noStroke();
      ellipse(indexFingerTip[0], indexFingerTip[1], 10, 10); // 畫圓標記食指指尖
    }
  }
}

// 手勢辨識函式（簡易版，僅供剪刀石頭布）
function detectGesture(landmarks) {
  // 取得五指指尖座標
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const wrist = landmarks[0];

  // 計算每個指尖與手腕的距離
  function dist(a, b) {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
  }
  const thumbDist = dist(thumbTip, wrist);
  const indexDist = dist(indexTip, wrist);
  const middleDist = dist(middleTip, wrist);
  const ringDist = dist(ringTip, wrist);
  const pinkyDist = dist(pinkyTip, wrist);

  // 判斷規則（可依實際需求調整閾值）
  // 石頭：五指都彎曲（指尖靠近手腕）
  if (
    indexDist < 60 &&
    middleDist < 60 &&
    ringDist < 60 &&
    pinkyDist < 60
  ) {
    return "rock";
  }
  // 剪刀：食指與中指伸直，其餘彎曲
  if (
    indexDist > 80 &&
    middleDist > 80 &&
    ringDist < 60 &&
    pinkyDist < 60
  ) {
    return "scissors";
  }
  // 布：四指伸直
  if (
    indexDist > 80 &&
    middleDist > 80 &&
    ringDist > 80 &&
    pinkyDist > 80
  ) {
    return "paper";
  }
  return null;
}
