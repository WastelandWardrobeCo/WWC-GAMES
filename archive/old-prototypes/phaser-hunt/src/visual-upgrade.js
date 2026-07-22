(() => {
  if (!window.Phaser?.GameObjects?.Graphics) return;

  const proto = Phaser.GameObjects.Graphics.prototype;
  const originalGenerateTexture = proto.generateTexture;

  function drawCorruptedHound(g) {
    g.clear();
    g.fillStyle(0x171515, 1);
    g.fillEllipse(27, 29, 34, 22);
    g.fillEllipse(40, 23, 21, 19);
    g.fillTriangle(40, 14, 45, 4, 49, 17);
    g.fillTriangle(31, 16, 33, 5, 39, 18);
    g.fillTriangle(12, 27, 2, 20, 10, 36);
    g.fillStyle(0x3a1a18, 1);
    g.fillEllipse(27, 31, 25, 13);
    g.fillStyle(0xd94b35, 1);
    g.fillCircle(44, 21, 2.5);
    g.fillStyle(0xe4d2ab, 1);
    g.fillTriangle(47, 27, 53, 29, 48, 31);
    g.fillTriangle(43, 28, 47, 32, 42, 32);
    g.lineStyle(4, 0x0a0909, 1);
    g.beginPath();
    g.moveTo(19, 37); g.lineTo(15, 49);
    g.moveTo(31, 38); g.lineTo(32, 50);
    g.moveTo(39, 35); g.lineTo(44, 47);
    g.strokePath();
  }

  function drawHornedRevenant(g) {
    g.clear();
    g.fillStyle(0x1a1516, 1);
    g.fillEllipse(34, 39, 40, 35);
    g.fillStyle(0x34252a, 1);
    g.fillEllipse(34, 31, 27, 29);
    g.fillStyle(0xb7aa8b, 1);
    g.fillEllipse(34, 22, 19, 17);
    g.fillStyle(0x090808, 1);
    g.fillCircle(30, 21, 2.5);
    g.fillCircle(38, 21, 2.5);
    g.fillStyle(0xd13a2f, 1);
    g.fillCircle(30, 21, 1.2);
    g.fillCircle(38, 21, 1.2);
    g.fillStyle(0x6e5a42, 1);
    g.fillTriangle(25, 17, 13, 3, 29, 12);
    g.fillTriangle(43, 17, 55, 3, 39, 12);
    g.lineStyle(5, 0x100c0d, 1);
    g.beginPath();
    g.moveTo(23, 47); g.lineTo(17, 62);
    g.moveTo(45, 47); g.lineTo(51, 62);
    g.strokePath();
    g.lineStyle(4, 0x7a2020, 1);
    g.strokeCircle(34, 37, 15);
  }

  function drawLady(g) {
    g.clear();
    g.fillStyle(0x111214, 1);
    g.fillEllipse(43, 48, 62, 34);
    g.fillEllipse(70, 39, 31, 28);
    g.fillTriangle(67, 26, 72, 8, 79, 29);
    g.fillTriangle(55, 29, 57, 12, 68, 31);
    g.fillTriangle(17, 46, 2, 35, 10, 56);
    g.fillStyle(0x24272b, 1);
    g.fillEllipse(43, 50, 49, 22);
    g.fillStyle(0xd6d9dc, 1);
    g.fillCircle(75, 37, 2.4);
    g.fillStyle(0x0a0a0a, 1);
    g.fillEllipse(84, 44, 8, 5);
    g.lineStyle(7, 0x0b0c0d, 1);
    g.beginPath();
    g.moveTo(27, 59); g.lineTo(22, 78);
    g.moveTo(44, 61); g.lineTo(45, 80);
    g.moveTo(58, 58); g.lineTo(64, 76);
    g.strokePath();
    g.lineStyle(2, 0x4c5055, 1);
    g.beginPath();
    g.moveTo(58, 47); g.lineTo(82, 48);
    g.strokePath();
  }

  function drawDelilah(g) {
    g.clear();
    g.fillStyle(0x0a0a0b, 1);
    g.fillTriangle(7, 58, 20, 20, 35, 58);
    g.fillStyle(0x1a1a1c, 1);
    g.fillRoundedRect(12, 23, 17, 27, 5);
    g.fillStyle(0xa52b26, 1);
    g.fillCircle(20, 15, 10);
    g.fillStyle(0xd64a3a, 1);
    g.fillTriangle(11, 15, 20, 3, 29, 15);
    g.fillStyle(0xe9d6c0, 1);
    g.fillCircle(20, 15, 5.5);
    g.fillStyle(0x0a0a0a, 1);
    g.fillRect(18, 36, 4, 26);
    g.lineStyle(4, 0x050505, 1);
    g.beginPath();
    g.moveTo(30, 42); g.lineTo(39, 5);
    g.strokePath();
    g.fillStyle(0x050505, 1);
    g.fillTriangle(36, 7, 40, 0, 41, 10);
  }

  proto.generateTexture = function patchedGenerateTexture(key, width, height) {
    if (key === "enemy") {
      drawCorruptedHound(this);
      return originalGenerateTexture.call(this, key, 56, 56);
    }
    if (key === "enemyElite") {
      drawHornedRevenant(this);
      return originalGenerateTexture.call(this, key, 68, 68);
    }
    if (key === "lady") {
      drawLady(this);
      return originalGenerateTexture.call(this, key, 88, 88);
    }
    if (key === "delilah") {
      drawDelilah(this);
      return originalGenerateTexture.call(this, key, 40, 64);
    }
    return originalGenerateTexture.call(this, key, width, height);
  };
})();
