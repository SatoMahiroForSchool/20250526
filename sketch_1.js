let video;
let predictions = [];
let facemesh;
let handpose;
let hands = [];

// 初始化 facemesh 與 handpose
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
    hands = results;
  });
}

// 主要繪圖函式
function draw() {
  image(video, 0, 0, width, height); // 顯示攝影機畫面
  noFill();
  strokeWeight(3);

  // 臉部偵測與圓圈移動
  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;
    const forehead = keypoints[10];
    const leftCheek = keypoints[234];
    const rightCheek = keypoints[454];
    const noseTip = keypoints[1];
    let circlePos = noseTip;

    // 手勢辨識（剪刀石頭布）
    if (hands.length > 0) {
      for (let hand of hands) {
        if (hand.landmarks) {
          const gesture = detectGesture(hand.landmarks);
          if (gesture === "rock") {
            circlePos = forehead;
          } else if (gesture === "scissors") {
            circlePos = leftCheek ? leftCheek : noseTip;
          } else if (gesture === "paper") {
            circlePos = rightCheek ? rightCheek : noseTip;
          }
        }
      }
    }

    // 畫圓圈
    if (circlePos) {
      noFill();
      stroke(255, 255, 0);
      ellipse(circlePos[0], circlePos[1], 50, 50);
    }
  }

  // 手部關鍵點標記
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.landmarks) {
        for (let i = 0; i < hand.landmarks.length; i++) {
          let keypoint = hand.landmarks[i];
          fill(255, 255, 0);
          noStroke();
          circle(keypoint[0], keypoint[1], 10);
        }
      }
    }
  }
}

// 手勢辨識函式（剪刀石頭布）
function detectGesture(landmarks) {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const wrist = landmarks[0];

  function dist(a, b) {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
  }
  const indexDist = dist(indexTip, wrist);
  const middleDist = dist(middleTip, wrist);
  const ringDist = dist(ringTip, wrist);
  const pinkyDist = dist(pinkyTip, wrist);

  // 石頭：五指都彎曲
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
