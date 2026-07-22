const canvas = document.getElementById("cardCanvas");
const ctx = canvas.getContext("2d");

const fields = {
  title: document.getElementById("cardTitle"),
  typeSelect: document.getElementById("cardTypeSelect"),
  customType: document.getElementById("customCardType"),
  customTypeLabel: document.getElementById("customTypeLabel"),
  number: document.getElementById("cardNumber"),
  quote: document.getElementById("quoteText"),
  lore: document.getElementById("loreText"),
  footer: document.getElementById("footerText"),
  titleFontSize: document.getElementById("titleFontSize"),
  typeFontSize: document.getElementById("typeFontSize"),
  quoteFontSize: document.getElementById("quoteFontSize"),
  loreFontSize: document.getElementById("loreFontSize"),
  footerFontSize: document.getElementById("footerFontSize"),
  rarity: document.getElementById("raritySymbol"),
  template: document.getElementById("templateSelect"),
  zoom: document.getElementById("zoomRange"),
  artworkWidthOffset: document.getElementById("artworkWidthOffset"),
  artworkHeightOffset: document.getElementById("artworkHeightOffset"),
  finishStyle: document.getElementById("finishStyle"),
  finishIntensity: document.getElementById("finishIntensity"),
  holoBorderEnabled: document.getElementById("holoBorderEnabled"),
  holoIntensity: document.getElementById("holoIntensity"),
  borderSparkle: document.getElementById("borderSparkle"),
  printMargin: document.getElementById("printMargin"),
  cutGuides: document.getElementById("cutGuides"),
  cardBleed: document.getElementById("cardBleed"),
  exportProfile: document.getElementById("exportProfile"),
};

const controls = {
  imageInput: document.getElementById("imageInput"),
  projectFileInput: document.getElementById("projectFileInput"),
  dropZone: document.getElementById("dropZone"),
  frontTab: document.getElementById("frontTab"),
  backTab: document.getElementById("backTab"),
  libraryTab: document.getElementById("libraryTab"),
  packBuilderTab: document.getElementById("packBuilderTab"),
  settingsTab: document.getElementById("settingsTab"),
  frontPanel: document.getElementById("frontPanel"),
  backPanel: document.getElementById("backPanel"),
  libraryPanel: document.getElementById("libraryPanel"),
  packBuilderPanel: document.getElementById("packBuilderPanel"),
  settingsPanel: document.getElementById("settingsPanel"),
  backCardNumberMirror: document.getElementById("backCardNumberMirror"),
  previewSideLabel: document.getElementById("previewSideLabel"),
  quoteLabel: document.getElementById("quoteLabel"),
  loreLabel: document.getElementById("loreLabel"),
  quoteCounter: document.getElementById("quoteCounter"),
  loreCounter: document.getElementById("loreCounter"),
  zoomValue: document.getElementById("zoomValue"),
  artworkWidthOffsetValue: document.getElementById("artworkWidthOffsetValue"),
  artworkHeightOffsetValue: document.getElementById("artworkHeightOffsetValue"),
  finishIntensityValue: document.getElementById("finishIntensityValue"),
  holoIntensityValue: document.getElementById("holoIntensityValue"),
  borderSparkleValue: document.getElementById("borderSparkleValue"),
  exportProfileLabel: document.getElementById("exportProfileLabel"),
  fitImage: document.getElementById("fitImage"),
  fillFrame: document.getElementById("fillFrame"),
  resetImage: document.getElementById("resetImage"),
  duplicateCard: document.getElementById("duplicateCard"),
  saveProject: document.getElementById("saveProject"),
  loadProjectButton: document.getElementById("loadProjectButton"),
  exportPng: document.getElementById("exportPng"),
  exportPdf: document.getElementById("exportPdf"),
  exportBackPng: document.getElementById("exportBackPng"),
  exportBackPdf: document.getElementById("exportBackPdf"),
  exportSheet: document.getElementById("exportSheet"),
  exportSheetPdf: document.getElementById("exportSheetPdf"),
  exportCalibrationSheet: document.getElementById("exportCalibrationSheet"),
  libraryAddStatus: document.getElementById("libraryAddStatus"),
};

const packControls = {
  input: document.getElementById("packCardInput"),
  loadedCount: document.getElementById("packLoadedCount"),
  size: document.getElementById("packSize"),
  allowDuplicates: document.getElementById("allowPackDuplicates"),
  balancedMode: document.getElementById("balancedPackMode"),
  generate: document.getElementById("generatePack"),
  preview: document.getElementById("packPreview"),
  previewCount: document.getElementById("packPreviewCount"),
  exportZip: document.getElementById("exportPackZip"),
  exportPdf: document.getElementById("exportPackPdf"),
  exportCsv: document.getElementById("exportPackCsv"),
};

const libraryControls = {
  count: document.getElementById("libraryCount"),
  add: document.getElementById("addCurrentCardToLibrary"),
  preview: document.getElementById("libraryPreview"),
  exportPdf: document.getElementById("exportLibraryPdf"),
  exportPng: document.getElementById("exportLibraryPng"),
};

// Card geometry stays centralized so future templates can change layout safely.
const card = {
  width: 750,
  height: 1050,
  trimInches: { width: 2.5, height: 3.5 },
  content: { x: 58, y: 58, w: 634, bottom: 992 },
  title: { h: 76 },
  art: { h: 458 },
  type: { h: 46 },
  quote: { h: 104 },
  footer: { h: 44 },
};

const fontSizes = {
  title: { small: 30, medium: 34, large: 38, xlarge: 42 },
  type: { small: 18, medium: 22, large: 26, xlarge: 30 },
  quote: { small: 30, medium: 35, large: 40, xlarge: 46 },
  lore: { small: 28, medium: 33, large: 38, xlarge: 44 },
  footer: { small: 18, medium: 23, large: 27, xlarge: 31 },
};

const artworkOffsetBase = -10;

function getLayout() {
  const widthOffset = getArtworkOffset(fields.artworkWidthOffset.value);
  const heightOffset = getArtworkOffset(fields.artworkHeightOffset.value);
  const content = card.content;
  const artW = content.w + widthOffset;
  const artX = content.x + (content.w - artW) / 2;

  const title = { x: content.x, y: content.y, w: content.w, h: card.title.h };
  const art = { x: artX, y: title.y + title.h, w: artW, h: card.art.h + heightOffset };
  const type = { x: content.x, y: art.y + art.h, w: content.w, h: card.type.h };
  const quote = { x: content.x, y: type.y + type.h, w: content.w, h: card.quote.h };
  const footer = { x: content.x, y: content.bottom - card.footer.h, w: content.w, h: card.footer.h };
  const lore = { x: content.x, y: quote.y + quote.h, w: content.w, h: footer.y - (quote.y + quote.h) };

  return { title, art, type, quote, lore, footer };
}

function getArtworkOffset(fineTuneValue) {
  return artworkOffsetBase + (Number(fineTuneValue) || 0);
}

const templates = {
  default: {
    quoteLabel: "Quote",
    loreLabel: "Lore",
    typeHint: "Character",
  },
  character: {
    quoteLabel: "Voice Line",
    loreLabel: "Character Lore",
    typeHint: "Character",
  },
  weapon: {
    quoteLabel: "Inscription",
    loreLabel: "Weapon History",
    typeHint: "Weapon",
  },
  location: {
    quoteLabel: "Local Saying",
    loreLabel: "Location Lore",
    typeHint: "Location",
  },
  creature: {
    quoteLabel: "Field Note",
    loreLabel: "Creature Lore",
    typeHint: "Creature",
  },
  artifact: {
    quoteLabel: "Recovered Fragment",
    loreLabel: "Artifact Lore",
    typeHint: "Artifact",
  },
};

// Rarity definitions are intentionally data-first; custom SVG paths can be added here later.
const rarities = {
  none: { label: "None", color: "", shape: "none" },
  common: { label: "Common", color: "#b9ad91", shape: "ring" },
  uncommon: { label: "Uncommon", color: "#9fc28d", shape: "leaf" },
  rare: { label: "Rare", color: "#8db7d4", shape: "diamond" },
  epic: { label: "Epic", color: "#b68be0", shape: "moon" },
  legendary: { label: "Legendary", color: "#e0b34f", shape: "star" },
  promo: { label: "Promo", color: "#d04836", shape: "banner" },
  foil: { label: "Foil", color: "#d9f2ef", shape: "foil" },
};

const exportProfiles = {
  screen: {
    label: "Screen Preview",
    brightness: 0,
    shadowLift: 0,
    contrast: 0,
    saturation: 0,
    gamma: 0,
  },
  home: {
    label: "Home Print",
    brightness: 0.12,
    shadowLift: 0.2,
    contrast: 0.06,
    saturation: 0.08,
    gamma: 0.05,
  },
  bright: {
    label: "Bright Print",
    brightness: 0.18,
    shadowLift: 0.28,
    contrast: 0.08,
    saturation: 0.12,
    gamma: 0.08,
  },
  maximum: {
    label: "Maximum Recovery",
    brightness: 0.24,
    shadowLift: 0.36,
    contrast: 0.1,
    saturation: 0.15,
    gamma: 0.1,
  },
};

const imageState = {
  image: null,
  dataUrl: "",
  x: 0,
  y: 0,
  zoom: 1,
  baseScale: 1,
  scaleMode: "fill",
};

let activeDrag = null;
let currentSide = "front";
let drawQueued = false;
let packPool = [];
let currentPack = [];
let cardLibrary = [];
let artworkDropActive = false;

function scheduleDraw() {
  if (drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(() => {
    drawQueued = false;
    drawCurrentSide();
  });
}

function drawCurrentSide(targetCtx = ctx, x = 0, y = 0, scale = 1) {
  if (currentSide === "back") {
    drawCardBack(targetCtx, x, y, scale);
  } else {
    drawCardFront(targetCtx, x, y, scale);
  }
}

function drawCardFront(targetCtx = ctx, x = 0, y = 0, scale = 1) {
  targetCtx.save();
  targetCtx.translate(x, y);
  targetCtx.scale(scale, scale);

  drawCardFrame(targetCtx);
  drawHoloBorder(targetCtx);
  drawTitle(targetCtx);
  drawArtwork(targetCtx);
  drawTypeStrip(targetCtx);
  drawQuoteBox(targetCtx);
  drawLoreBox(targetCtx);
  drawFooter(targetCtx);
  drawRarity(targetCtx);
  drawWear(targetCtx);
  drawFinishOverlay(targetCtx);

  targetCtx.restore();
}

function drawCardBack(targetCtx = ctx, x = 0, y = 0, scale = 1) {
  targetCtx.save();
  targetCtx.translate(x, y);
  targetCtx.scale(scale, scale);

  drawCardFrame(targetCtx);
  drawHoloBorder(targetCtx);

  targetCtx.strokeStyle = "#8e241e";
  targetCtx.lineWidth = 4;
  roundedRect(targetCtx, 94, 112, 562, 826, 20, false);

  targetCtx.fillStyle = "#120f0d";
  roundedRect(targetCtx, 126, 144, 498, 758, 14, true);
  targetCtx.strokeStyle = "#74684f";
  targetCtx.lineWidth = 2;
  roundedRect(targetCtx, 126, 144, 498, 758, 14, false);

  drawWolfEmblem(targetCtx, 375, 378, 178);

  targetCtx.fillStyle = "#f3ead7";
  targetCtx.font = fitFont(targetCtx, "Lady & Delilah", 50, 30, 430, "Georgia", "700");
  targetCtx.textAlign = "center";
  targetCtx.textBaseline = "middle";
  targetCtx.fillText("Lady & Delilah", 375, 214);

  targetCtx.fillStyle = "#b8a77d";
  targetCtx.font = "700 21px Arial";
  targetCtx.fillText("WASTELAND ARCHIVE", 375, 264);

  drawPanel(targetCtx, 216, 606, 318, 70, "#1a1714", "#8f815f");
  targetCtx.fillStyle = "#efe8d5";
  targetCtx.font = "700 26px Arial";
  targetCtx.fillText(fields.number.value || "C-001", 375, 642);

  drawQrPlaceholder(targetCtx, 294, 710, 162);

  targetCtx.fillStyle = "#a89a7c";
  targetCtx.font = "13px Arial";
  targetCtx.fillText("Copyright Lady & Delilah. Local prototype card back.", 375, 958);
  drawWear(targetCtx);
  drawFinishOverlay(targetCtx);
  targetCtx.restore();
}

function drawCardFrame(targetCtx) {
  const bg = targetCtx.createLinearGradient(0, 0, card.width, card.height);
  bg.addColorStop(0, "#11100f");
  bg.addColorStop(0.42, "#24211d");
  bg.addColorStop(1, "#060606");
  targetCtx.fillStyle = bg;
  targetCtx.fillRect(0, 0, card.width, card.height);

  targetCtx.fillStyle = "#070707";
  roundedRect(targetCtx, 26, 24, 698, 1002, 24, true);

  const inner = targetCtx.createLinearGradient(32, 36, 720, 1016);
  inner.addColorStop(0, "#2c2923");
  inner.addColorStop(0.5, "#12110f");
  inner.addColorStop(1, "#2b2722");
  targetCtx.fillStyle = inner;
  roundedRect(targetCtx, 42, 42, 666, 966, 18, true);

  targetCtx.strokeStyle = "#a62a22";
  targetCtx.lineWidth = 5;
  roundedRect(targetCtx, 42, 42, 666, 966, 18, false);

  targetCtx.strokeStyle = "#6b604e";
  targetCtx.lineWidth = 2;
  roundedRect(targetCtx, 58, 58, 634, 934, 12, false);
}

function drawHoloBorder(targetCtx) {
  if (!fields.holoBorderEnabled.checked) return;

  const intensity = Number(fields.holoIntensity.value);
  const sparkle = Number(fields.borderSparkle.value);
  if (intensity <= 0) return;

  targetCtx.save();

  // Restrict the chase-card shine to the border/frame zones.
  applyFrameEffectClip(targetCtx);

  targetCtx.globalCompositeOperation = "screen";
  targetCtx.globalAlpha = 0.46 * intensity;
  const rainbow = targetCtx.createLinearGradient(28, 1012, 722, 38);
  rainbow.addColorStop(0, "rgba(255,154,43,0.88)");
  rainbow.addColorStop(0.16, "rgba(255,212,74,0.86)");
  rainbow.addColorStop(0.32, "rgba(45,238,255,0.82)");
  rainbow.addColorStop(0.5, "rgba(64,116,255,0.78)");
  rainbow.addColorStop(0.68, "rgba(174,75,255,0.84)");
  rainbow.addColorStop(0.84, "rgba(255,66,190,0.82)");
  rainbow.addColorStop(1, "rgba(255,138,49,0.88)");
  targetCtx.fillStyle = rainbow;
  targetCtx.fillRect(34, 34, 682, 982);

  targetCtx.globalAlpha = 0.28 * intensity;
  targetCtx.lineWidth = 10;
  for (let i = -680; i < 960; i += 88) {
    const line = targetCtx.createLinearGradient(i, 1040, i + 680, 0);
    line.addColorStop(0, "rgba(255,255,255,0)");
    line.addColorStop(0.5, "rgba(255,255,255,0.78)");
    line.addColorStop(1, "rgba(255,255,255,0)");
    targetCtx.strokeStyle = line;
    targetCtx.beginPath();
    targetCtx.moveTo(i, 1040);
    targetCtx.lineTo(i + 680, 0);
    targetCtx.stroke();
  }

  targetCtx.globalCompositeOperation = "source-over";
  targetCtx.globalAlpha = 0.72 * intensity;
  targetCtx.strokeStyle = "rgba(255,236,166,0.72)";
  targetCtx.lineWidth = 2;
  roundedRect(targetCtx, 50, 50, 650, 950, 16, false);
  targetCtx.strokeStyle = "rgba(87,232,255,0.42)";
  targetCtx.lineWidth = 3;
  roundedRect(targetCtx, 62, 62, 626, 926, 12, false);

  targetCtx.globalCompositeOperation = "screen";
  targetCtx.globalAlpha = 0.78 * intensity * sparkle;
  for (let i = 0; i < 120; i += 1) {
    const point = borderSparklePoint(i);
    targetCtx.fillStyle = i % 3 === 0 ? "#fff3ad" : i % 3 === 1 ? "#7ff4ff" : "#ff79d8";
    targetCtx.beginPath();
    targetCtx.arc(point.x, point.y, 0.8 + pseudoRandom(3400 + i) * 2.2, 0, Math.PI * 2);
    targetCtx.fill();
  }

  targetCtx.restore();
}

function roundedPath(targetCtx, x, y, width, height, radius) {
  targetCtx.moveTo(x + radius, y);
  targetCtx.lineTo(x + width - radius, y);
  targetCtx.quadraticCurveTo(x + width, y, x + width, y + radius);
  targetCtx.lineTo(x + width, y + height - radius);
  targetCtx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  targetCtx.lineTo(x + radius, y + height);
  targetCtx.quadraticCurveTo(x, y + height, x, y + height - radius);
  targetCtx.lineTo(x, y + radius);
  targetCtx.quadraticCurveTo(x, y, x + radius, y);
  targetCtx.closePath();
}

function borderSparklePoint(index) {
  const side = Math.floor(pseudoRandom(3100 + index * 11) * 4);
  const t = pseudoRandom(3200 + index * 17);
  if (side === 0) return { x: 52 + t * 646, y: 48 + pseudoRandom(index * 23) * 82 };
  if (side === 1) return { x: 620 + pseudoRandom(index * 29) * 82, y: 52 + t * 946 };
  if (side === 2) return { x: 52 + t * 646, y: 920 + pseudoRandom(index * 31) * 82 };
  return { x: 48 + pseudoRandom(index * 37) * 82, y: 52 + t * 946 };
}

function applyFrameEffectClip(targetCtx) {
  const layout = getLayout();
  targetCtx.beginPath();

  addRoundedRingPath(targetCtx, 32, 32, 686, 986, 22, 72, 72, 606, 906, 12);
  addRoundedRingPath(targetCtx, 42, 42, 666, 966, 18, 58, 58, 634, 934, 12);
  addPanelFramePath(targetCtx, layout.title, 10, 7);
  addPanelFramePath(targetCtx, layout.art, 9, 8);
  addPanelFramePath(targetCtx, layout.type, 8, 5);
  addPanelFramePath(targetCtx, layout.quote, 8, 5);
  addPanelFramePath(targetCtx, layout.lore, 8, 5);
  addPanelFramePath(targetCtx, layout.footer, 8, 5);

  targetCtx.clip("evenodd");
}

function addPanelFramePath(targetCtx, rect, thickness, radius) {
  const inset = Math.max(1, thickness);
  addRoundedRingPath(
    targetCtx,
    rect.x - 2,
    rect.y - 2,
    rect.w + 4,
    rect.h + 4,
    radius,
    rect.x + inset,
    rect.y + inset,
    Math.max(1, rect.w - inset * 2),
    Math.max(1, rect.h - inset * 2),
    Math.max(1, radius - 3),
  );
}

function addRoundedRingPath(targetCtx, outerX, outerY, outerW, outerH, outerR, innerX, innerY, innerW, innerH, innerR) {
  roundedPath(targetCtx, outerX, outerY, outerW, outerH, outerR);
  roundedPath(targetCtx, innerX, innerY, innerW, innerH, innerR);
}

function drawTitle(targetCtx) {
  const title = getLayout().title;
  drawPanel(targetCtx, title.x, title.y, title.w, title.h, "#1a1714", "#9e8d68");
  targetCtx.fillStyle = "#f3ead7";
  targetCtx.font = fitFont(targetCtx, fields.title.value, fontSize("title"), 20, 468, "Georgia", "700");
  targetCtx.textAlign = "left";
  targetCtx.textBaseline = "middle";
  targetCtx.fillText(fields.title.value || "Untitled Card", title.x + 28, title.y + title.h / 2);
}

function drawArtwork(targetCtx) {
  const art = getLayout().art;
  targetCtx.save();
  roundedRect(targetCtx, art.x, art.y, art.w, art.h, 8, false);
  targetCtx.clip();

  if (imageState.image) {
    const drawW = imageState.image.width * imageState.baseScale * imageState.zoom;
    const drawH = imageState.image.height * imageState.baseScale * imageState.zoom;
    const drawX = art.x + art.w / 2 - drawW / 2 + imageState.x;
    const drawY = art.y + art.h / 2 - drawH / 2 + imageState.y;
    targetCtx.imageSmoothingEnabled = true;
    targetCtx.imageSmoothingQuality = "high";
    targetCtx.drawImage(imageState.image, drawX, drawY, drawW, drawH);
  } else {
    drawPlaceholderArt(targetCtx, art);
  }

  const shade = targetCtx.createLinearGradient(art.x, art.y, art.x, art.y + art.h);
  shade.addColorStop(0, "rgba(0,0,0,0.08)");
  shade.addColorStop(1, "rgba(0,0,0,0.32)");
  targetCtx.fillStyle = shade;
  targetCtx.fillRect(art.x, art.y, art.w, art.h);
  targetCtx.restore();

  targetCtx.strokeStyle = "#b21f19";
  targetCtx.lineWidth = 4;
  roundedRect(targetCtx, art.x, art.y, art.w, art.h, 8, false);

  if (artworkDropActive && currentSide === "front") {
    targetCtx.save();
    targetCtx.strokeStyle = "#f0c06d";
    targetCtx.lineWidth = 6;
    targetCtx.shadowColor = "rgba(240, 192, 109, 0.7)";
    targetCtx.shadowBlur = 16;
    roundedRect(targetCtx, art.x + 4, art.y + 4, art.w - 8, art.h - 8, 6, false);
    targetCtx.restore();
  }
}

function drawPlaceholderArt(targetCtx, art) {
  const sky = targetCtx.createLinearGradient(0, art.y, 0, art.y + art.h);
  sky.addColorStop(0, "#26231f");
  sky.addColorStop(0.55, "#4a3128");
  sky.addColorStop(1, "#090909");
  targetCtx.fillStyle = sky;
  targetCtx.fillRect(art.x, art.y, art.w, art.h);

  targetCtx.fillStyle = "rgba(185, 54, 43, 0.46)";
  targetCtx.beginPath();
  targetCtx.arc(art.x + 508, art.y + 90, 58, 0, Math.PI * 2);
  targetCtx.fill();

  targetCtx.fillStyle = "#11100f";
  targetCtx.beginPath();
  targetCtx.moveTo(art.x, art.y + art.h);
  targetCtx.lineTo(art.x + 82, art.y + 298);
  targetCtx.lineTo(art.x + 190, art.y + 344);
  targetCtx.lineTo(art.x + 318, art.y + 252);
  targetCtx.lineTo(art.x + 488, art.y + 356);
  targetCtx.lineTo(art.x + art.w, art.y + 292);
  targetCtx.lineTo(art.x + art.w, art.y + art.h);
  targetCtx.closePath();
  targetCtx.fill();

  targetCtx.fillStyle = "#050505";
  targetCtx.fillRect(art.x + 128, art.y + 254, 34, 190);
  targetCtx.fillRect(art.x + 420, art.y + 224, 46, 224);
  targetCtx.fillRect(art.x + 505, art.y + 278, 26, 170);

  targetCtx.fillStyle = "rgba(238, 224, 190, 0.82)";
  targetCtx.font = "700 24px Arial";
  targetCtx.textAlign = "center";
  targetCtx.textBaseline = "middle";
  targetCtx.fillText("Drop artwork here", art.x + art.w / 2, art.y + art.h / 2);
}

function drawTypeStrip(targetCtx) {
  const type = getLayout().type;
  drawPanel(targetCtx, type.x, type.y, type.w, type.h, "#262119", "#8f815f");
  targetCtx.fillStyle = "#efe8d5";
  targetCtx.font = fitFont(targetCtx, getCardType(), fontSize("type"), 14, 478, "Arial", "700");
  targetCtx.textAlign = "left";
  targetCtx.textBaseline = "middle";
  targetCtx.fillText(getCardType(), type.x + 28, type.y + type.h / 2);

  targetCtx.fillStyle = "#a89a7c";
  targetCtx.font = `700 ${Math.max(15, Math.round(fontSize("type") * 0.72))}px Arial`;
  targetCtx.textAlign = "right";
  targetCtx.fillText(fields.number.value || "C-001", type.x + type.w - 28, type.y + type.h / 2);
}

function drawQuoteBox(targetCtx) {
  const quote = getLayout().quote;
  drawPanel(targetCtx, quote.x, quote.y, quote.w, quote.h, "#171512", "#75684f");
  targetCtx.fillStyle = "#dacfae";
  targetCtx.textAlign = "center";
  targetCtx.textBaseline = "top";
  const font = fitWrappedFont(targetCtx, fields.quote.value, fontSize("quote"), 24, quote.w - 78, quote.h - 26, "Georgia", "italic", 1.1);
  targetCtx.font = font.css;
  const lines = getWrappedLines(targetCtx, fields.quote.value, quote.w - 78, font.maxLines);
  const textHeight = lines.length * font.lineHeight;
  const y = quote.y + Math.max(16, (quote.h - textHeight) / 2 + 2);
  drawWrappedLines(targetCtx, lines, quote.x + quote.w / 2, y, quote.w - 78, font.lineHeight);
}

function drawLoreBox(targetCtx) {
  const lore = getLayout().lore;
  drawPanel(targetCtx, lore.x, lore.y, lore.w, lore.h, "#c7b98d", "#4d4234");
  targetCtx.fillStyle = "#17130f";
  targetCtx.textAlign = "left";
  targetCtx.textBaseline = "top";
  const font = fitWrappedFont(targetCtx, fields.lore.value, fontSize("lore"), 24, lore.w - 56, lore.h - 22, "Georgia", "normal", 1.04);
  targetCtx.font = font.css;
  const lines = getWrappedLines(targetCtx, fields.lore.value, lore.w - 56, font.maxLines);
  const textHeight = lines.length * font.lineHeight;
  const y = lore.y + Math.max(13, (lore.h - textHeight) / 2 + 1);
  drawWrappedLines(targetCtx, lines, lore.x + 28, y, lore.w - 56, font.lineHeight);
}

function drawFooter(targetCtx) {
  const footer = `LADY & DELILAH(TM) • ${fields.footer.value || "WASTELAND RELIC"} • ${fields.number.value || "C-001"}`;
  const footerBox = getLayout().footer;
  drawPanel(targetCtx, footerBox.x, footerBox.y, footerBox.w, footerBox.h, "#11100f", "#75684f");
  targetCtx.fillStyle = "#d7c69b";
  targetCtx.font = fitFont(targetCtx, footer, fontSize("footer"), 17, footerBox.w - 46, "Arial", "700");
  targetCtx.textAlign = "center";
  targetCtx.textBaseline = "middle";
  targetCtx.fillText(footer, 375, footerBox.y + footerBox.h / 2 + 1);
}

function drawRarity(targetCtx) {
  if (fields.rarity.value === "none") return;
  const rarity = rarities[fields.rarity.value] || rarities.common;
  const cx = 642;
  const cy = 99;
  targetCtx.save();
  targetCtx.fillStyle = "#120f0d";
  targetCtx.strokeStyle = "#b42d24";
  targetCtx.lineWidth = 3;
  targetCtx.beginPath();
  targetCtx.arc(cx, cy, 31, 0, Math.PI * 2);
  targetCtx.fill();
  targetCtx.stroke();

  targetCtx.fillStyle = rarity.color;
  targetCtx.strokeStyle = "#681913";
  targetCtx.lineWidth = 2;
  drawRarityShape(targetCtx, rarity.shape, cx, cy);
  targetCtx.restore();
}

function drawRarityShape(targetCtx, shape, cx, cy) {
  const customSvgPath = null;
  if (customSvgPath) {
    return;
  }

  if (shape === "diamond") {
    targetCtx.beginPath();
    targetCtx.moveTo(cx, cy - 23);
    targetCtx.lineTo(cx + 18, cy);
    targetCtx.lineTo(cx, cy + 23);
    targetCtx.lineTo(cx - 18, cy);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.stroke();
    return;
  }

  if (shape === "moon") {
    targetCtx.beginPath();
    targetCtx.arc(cx + 2, cy, 21, Math.PI * 0.5, Math.PI * 1.5);
    targetCtx.arc(cx + 8, cy, 16, Math.PI * 1.5, Math.PI * 0.5, true);
    targetCtx.closePath();
    targetCtx.fill();
    return;
  }

  if (shape === "leaf") {
    targetCtx.beginPath();
    targetCtx.ellipse(cx, cy, 13, 25, Math.PI / 4, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.stroke();
    targetCtx.beginPath();
    targetCtx.moveTo(cx - 12, cy + 12);
    targetCtx.lineTo(cx + 13, cy - 13);
    targetCtx.stroke();
    return;
  }

  if (shape === "banner") {
    targetCtx.beginPath();
    targetCtx.moveTo(cx - 22, cy - 18);
    targetCtx.lineTo(cx + 22, cy - 18);
    targetCtx.lineTo(cx + 14, cy);
    targetCtx.lineTo(cx + 22, cy + 18);
    targetCtx.lineTo(cx - 22, cy + 18);
    targetCtx.lineTo(cx - 14, cy);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.stroke();
    return;
  }

  if (shape === "foil") {
    for (let i = 0; i < 6; i += 1) {
      targetCtx.beginPath();
      targetCtx.arc(cx, cy, 5 + i * 4, 0, Math.PI * 2);
      targetCtx.globalAlpha = 0.28;
      targetCtx.stroke();
    }
    targetCtx.globalAlpha = 1;
    targetCtx.beginPath();
    targetCtx.arc(cx, cy, 8, 0, Math.PI * 2);
    targetCtx.fill();
    return;
  }

  if (shape === "ring") {
    targetCtx.beginPath();
    targetCtx.arc(cx, cy, 18, 0, Math.PI * 2);
    targetCtx.stroke();
    targetCtx.beginPath();
    targetCtx.arc(cx, cy, 7, 0, Math.PI * 2);
    targetCtx.fill();
    return;
  }

  targetCtx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? 23 : 9;
    const angle = Math.PI / 5 * i - Math.PI / 2;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    if (i === 0) targetCtx.moveTo(px, py);
    else targetCtx.lineTo(px, py);
  }
  targetCtx.closePath();
  targetCtx.fill();
  targetCtx.stroke();
}

function drawWolfEmblem(targetCtx, cx, cy, size) {
  targetCtx.save();
  targetCtx.translate(cx, cy);
  targetCtx.fillStyle = "#211d19";
  targetCtx.strokeStyle = "#8f815f";
  targetCtx.lineWidth = 5;
  targetCtx.beginPath();
  targetCtx.arc(0, 0, size, 0, Math.PI * 2);
  targetCtx.fill();
  targetCtx.stroke();

  targetCtx.fillStyle = "#b8a77d";
  targetCtx.beginPath();
  targetCtx.moveTo(-92, -58);
  targetCtx.lineTo(-46, -96);
  targetCtx.lineTo(-18, -42);
  targetCtx.lineTo(0, -72);
  targetCtx.lineTo(18, -42);
  targetCtx.lineTo(46, -96);
  targetCtx.lineTo(92, -58);
  targetCtx.lineTo(58, 48);
  targetCtx.lineTo(18, 92);
  targetCtx.lineTo(0, 54);
  targetCtx.lineTo(-18, 92);
  targetCtx.lineTo(-58, 48);
  targetCtx.closePath();
  targetCtx.fill();

  targetCtx.fillStyle = "#120f0d";
  targetCtx.beginPath();
  targetCtx.arc(-32, -12, 8, 0, Math.PI * 2);
  targetCtx.arc(32, -12, 8, 0, Math.PI * 2);
  targetCtx.fill();
  targetCtx.restore();
}

function drawQrPlaceholder(targetCtx, x, y, size) {
  targetCtx.fillStyle = "#d8c797";
  targetCtx.fillRect(x, y, size, size);
  targetCtx.fillStyle = "#15120f";
  const cell = size / 9;
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if ((row + col) % 3 === 0 || (row === 1 && col < 3) || (col === 7 && row > 4)) {
        targetCtx.fillRect(x + col * cell, y + row * cell, cell * 0.82, cell * 0.82);
      }
    }
  }
  targetCtx.strokeStyle = "#8f815f";
  targetCtx.lineWidth = 3;
  targetCtx.strokeRect(x, y, size, size);
}

function drawPanel(targetCtx, x, y, w, h, fill, stroke) {
  targetCtx.fillStyle = fill;
  roundedRect(targetCtx, x, y, w, h, 8, true);
  targetCtx.strokeStyle = stroke;
  targetCtx.lineWidth = 2;
  roundedRect(targetCtx, x, y, w, h, 8, false);

  targetCtx.fillStyle = "rgba(255, 255, 255, 0.035)";
  targetCtx.fillRect(x + 7, y + 7, w - 14, 1);
  targetCtx.fillStyle = "rgba(0, 0, 0, 0.18)";
  targetCtx.fillRect(x + 7, y + h - 8, w - 14, 1);
}

function drawWear(targetCtx) {
  targetCtx.save();
  targetCtx.globalAlpha = 0.08;
  targetCtx.fillStyle = "#f4e5be";
  for (let i = 0; i < 150; i += 1) {
    const x = pseudoRandom(i * 17) * card.width;
    const y = pseudoRandom(i * 29) * card.height;
    const w = 1 + pseudoRandom(i * 41) * 9;
    targetCtx.fillRect(x, y, w, 1);
  }
  targetCtx.globalAlpha = 0.12;
  targetCtx.strokeStyle = "#000";
  for (let i = 0; i < 22; i += 1) {
    const x = pseudoRandom(i * 71) * card.width;
    targetCtx.beginPath();
    targetCtx.moveTo(x, pseudoRandom(i * 83) * card.height);
    targetCtx.lineTo(x + pseudoRandom(i * 97) * 42 - 21, pseudoRandom(i * 109) * card.height);
    targetCtx.stroke();
  }
  targetCtx.restore();
}

function drawFinishOverlay(targetCtx) {
  const style = fields.finishStyle.value;
  const intensity = Number(fields.finishIntensity.value);
  if (style === "standard" || intensity <= 0) return;

  targetCtx.save();
  applyFrameEffectClip(targetCtx);
  if (style === "foil") {
    drawFoilFinish(targetCtx, intensity);
  } else if (style === "holographic") {
    drawHolographicFinish(targetCtx, intensity);
  } else if (style === "relic") {
    drawRelicFinish(targetCtx, intensity);
  } else if (style === "darkMatte") {
    drawDarkMatteFinish(targetCtx, intensity);
  }
  targetCtx.restore();
}

function drawFoilFinish(targetCtx, intensity) {
  targetCtx.save();
  targetCtx.globalCompositeOperation = "screen";
  targetCtx.globalAlpha = 0.11 * intensity;

  const shine = targetCtx.createLinearGradient(0, 980, 750, 40);
  shine.addColorStop(0, "rgba(255,255,255,0)");
  shine.addColorStop(0.42, "rgba(255,235,180,0.15)");
  shine.addColorStop(0.5, "rgba(255,255,255,0.7)");
  shine.addColorStop(0.58, "rgba(255,235,180,0.15)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  targetCtx.fillStyle = shine;
  targetCtx.fillRect(0, 0, card.width, card.height);

  targetCtx.globalAlpha = 0.06 * intensity;
  targetCtx.strokeStyle = "#fff4c4";
  targetCtx.lineWidth = 10;
  for (let i = -420; i < 760; i += 96) {
    targetCtx.beginPath();
    targetCtx.moveTo(i, 1050);
    targetCtx.lineTo(i + 560, 0);
    targetCtx.stroke();
  }
  targetCtx.restore();
}

function drawHolographicFinish(targetCtx, intensity) {
  targetCtx.save();
  targetCtx.globalCompositeOperation = "screen";
  targetCtx.globalAlpha = 0.08 * intensity;

  const rainbow = targetCtx.createLinearGradient(0, 0, card.width, card.height);
  rainbow.addColorStop(0, "rgba(255,68,68,0.7)");
  rainbow.addColorStop(0.18, "rgba(255,190,70,0.65)");
  rainbow.addColorStop(0.34, "rgba(255,246,100,0.55)");
  rainbow.addColorStop(0.5, "rgba(88,220,140,0.6)");
  rainbow.addColorStop(0.68, "rgba(80,180,255,0.65)");
  rainbow.addColorStop(0.84, "rgba(166,100,255,0.62)");
  rainbow.addColorStop(1, "rgba(255,92,190,0.62)");
  targetCtx.fillStyle = rainbow;
  targetCtx.fillRect(0, 0, card.width, card.height);

  targetCtx.globalAlpha = 0.1 * intensity;
  targetCtx.strokeStyle = "#ffffff";
  targetCtx.lineWidth = 2;
  for (let i = 0; i < 42; i += 1) {
    const y = pseudoRandom(500 + i * 13) * card.height;
    targetCtx.beginPath();
    targetCtx.moveTo(48, y);
    targetCtx.bezierCurveTo(220, y - 36, 480, y + 42, 702, y - 18);
    targetCtx.stroke();
  }

  targetCtx.globalCompositeOperation = "source-over";
  targetCtx.globalAlpha = 0.12 * intensity;
  targetCtx.strokeStyle = "#d9f2ef";
  targetCtx.lineWidth = 5;
  roundedRect(targetCtx, 50, 50, 650, 950, 16, false);
  targetCtx.restore();
}

function drawRelicFinish(targetCtx, intensity) {
  targetCtx.save();
  targetCtx.globalAlpha = 0.18 * intensity;
  targetCtx.fillStyle = "#6d5b42";
  for (let i = 0; i < 190; i += 1) {
    const x = pseudoRandom(900 + i * 19) * card.width;
    const y = pseudoRandom(900 + i * 31) * card.height;
    const radius = 1 + pseudoRandom(900 + i * 43) * 4;
    targetCtx.beginPath();
    targetCtx.arc(x, y, radius, 0, Math.PI * 2);
    targetCtx.fill();
  }

  targetCtx.globalAlpha = 0.28 * intensity;
  targetCtx.strokeStyle = "#d1c09b";
  targetCtx.lineWidth = 1;
  for (let i = 0; i < 42; i += 1) {
    const x = pseudoRandom(1200 + i * 23) * card.width;
    const y = pseudoRandom(1200 + i * 37) * card.height;
    targetCtx.beginPath();
    targetCtx.moveTo(x, y);
    targetCtx.lineTo(x + pseudoRandom(i * 71) * 95 - 45, y + pseudoRandom(i * 83) * 95 - 45);
    targetCtx.stroke();
  }

  targetCtx.globalAlpha = 0.16 * intensity;
  targetCtx.fillStyle = "#000000";
  targetCtx.fillRect(0, 0, card.width, card.height);
  targetCtx.restore();
}

function drawDarkMatteFinish(targetCtx, intensity) {
  targetCtx.save();
  targetCtx.globalAlpha = 0.2 * intensity;
  targetCtx.fillStyle = "#000000";
  targetCtx.fillRect(0, 0, card.width, card.height);

  const vignette = targetCtx.createRadialGradient(375, 520, 120, 375, 520, 610);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.75)");
  targetCtx.globalAlpha = 0.35 * intensity;
  targetCtx.fillStyle = vignette;
  targetCtx.fillRect(0, 0, card.width, card.height);

  targetCtx.globalAlpha = 0.07 * intensity;
  targetCtx.strokeStyle = "#d8c797";
  targetCtx.lineWidth = 1;
  for (let y = 80; y < card.height; y += 36) {
    targetCtx.beginPath();
    targetCtx.moveTo(58, y);
    targetCtx.lineTo(692, y);
    targetCtx.stroke();
  }
  targetCtx.restore();
}

function roundedRect(targetCtx, x, y, width, height, radius, fill) {
  targetCtx.beginPath();
  targetCtx.moveTo(x + radius, y);
  targetCtx.lineTo(x + width - radius, y);
  targetCtx.quadraticCurveTo(x + width, y, x + width, y + radius);
  targetCtx.lineTo(x + width, y + height - radius);
  targetCtx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  targetCtx.lineTo(x + radius, y + height);
  targetCtx.quadraticCurveTo(x, y + height, x, y + height - radius);
  targetCtx.lineTo(x, y + radius);
  targetCtx.quadraticCurveTo(x, y, x + radius, y);
  if (fill) targetCtx.fill();
  else targetCtx.stroke();
}

function wrapText(targetCtx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (targetCtx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  });

  if (line) lines.push(line);
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines && visible.length) {
    visible[visible.length - 1] = `${visible[visible.length - 1].replace(/[.,;:!?]*$/, "")}...`;
  }

  visible.forEach((lineText, index) => {
    targetCtx.fillText(lineText, x, y + index * lineHeight, maxWidth);
  });
}

function fitFont(targetCtx, text, maxSize, minSize, maxWidth, family, weight = "700") {
  let size = maxSize;
  const sample = text || "Untitled Card";
  do {
    targetCtx.font = `${weight} ${size}px ${family}`;
    if (targetCtx.measureText(sample).width <= maxWidth) break;
    size -= 1;
  } while (size > minSize);
  return `${weight} ${size}px ${family}`;
}

function fitWrappedFont(targetCtx, text, maxSize, minSize, maxWidth, maxHeight, family, style, lineScale = 1.22) {
  for (let size = maxSize; size >= minSize; size -= 1) {
    const lineHeight = Math.round(size * lineScale);
    const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight));
    targetCtx.font = `${style} ${size}px ${family}`;
    if (countWrappedLines(targetCtx, text, maxWidth) <= maxLines) {
      return { css: `${style} ${size}px ${family}`, lineHeight, maxLines };
    }
  }
  const lineHeight = Math.round(minSize * lineScale);
  return { css: `${style} ${minSize}px ${family}`, lineHeight, maxLines: Math.max(1, Math.floor(maxHeight / lineHeight)) };
}

function getWrappedLines(targetCtx, text, maxWidth, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (targetCtx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  });

  if (line) lines.push(line);
  if (!lines.length) lines.push("");

  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines && visible.length) {
    visible[visible.length - 1] = `${visible[visible.length - 1].replace(/[.,;:!?]*$/, "")}...`;
  }
  return visible;
}

function drawWrappedLines(targetCtx, lines, x, y, maxWidth, lineHeight) {
  lines.forEach((lineText, index) => {
    targetCtx.fillText(lineText, x, y + index * lineHeight, maxWidth);
  });
}

function countWrappedLines(targetCtx, text, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return 1;
  let lines = 1;
  let line = "";
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (targetCtx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      lines += 1;
      line = word;
    }
  });
  return lines;
}

function pseudoRandom(seed) {
  const value = Math.sin(seed * 999) * 10000;
  return value - Math.floor(value);
}

function getCardType() {
  return fields.typeSelect.value === "Custom"
    ? fields.customType.value || "Custom"
    : fields.typeSelect.value;
}

function fontSize(role) {
  const field = fields[`${role}FontSize`];
  const selected = field ? field.value : "medium";
  return fontSizes[role][selected] || fontSizes[role].medium;
}

function updateTemplateLabels() {
  const template = templates[fields.template.value] || templates.default;
  controls.quoteLabel.querySelector(".range-label").firstChild.nodeValue = `${template.quoteLabel}\n              `;
  controls.loreLabel.querySelector(".range-label").firstChild.nodeValue = `${template.loreLabel}\n              `;
  if (fields.typeSelect.value !== "Custom" && fields.typeSelect.value !== template.typeHint) {
    fields.typeSelect.value = template.typeHint;
  }
  updateCustomTypeVisibility();
}

function enforceTextLimits() {
  if (fields.quote.value.length > 90) fields.quote.value = fields.quote.value.slice(0, 90);
  if (fields.lore.value.length > 160) fields.lore.value = fields.lore.value.slice(0, 160);
}

function updateTextCounters() {
  controls.quoteCounter.textContent = `${fields.quote.value.length} / 90`;
  controls.loreCounter.textContent = `${fields.lore.value.length} / 160`;
}

function refreshImageScaleForLayout() {
  if (!imageState.image) return;
  imageState.baseScale = getBaseScale(imageState.scaleMode);
  constrainImageTransform();
}

function updateCustomTypeVisibility() {
  fields.customTypeLabel.classList.toggle("is-hidden", fields.typeSelect.value !== "Custom");
}

function loadImageFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => loadImageDataUrl(reader.result);
  reader.readAsDataURL(file);
}

function loadImageDataUrl(dataUrl) {
  const image = new Image();
  image.onload = () => {
    imageState.image = image;
    imageState.dataUrl = dataUrl;
    resetImageTransform();
    scheduleDraw();
  };
  image.src = dataUrl;
}

function resetImageTransform() {
  setImageScaleMode("fill");
}

function setImageScaleMode(mode) {
  imageState.scaleMode = mode;
  imageState.x = 0;
  imageState.y = 0;
  imageState.zoom = 1;
  fields.zoom.value = "1";
  if (imageState.image) {
    imageState.baseScale = getBaseScale(mode);
  }
  constrainImageTransform();
  updateZoomDisplay();
}

function getBaseScale(mode) {
  if (!imageState.image) return 1;
  const art = getLayout().art;
  const scaleX = art.w / imageState.image.width;
  const scaleY = art.h / imageState.image.height;
  return mode === "fit" ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);
}

function clearArtwork() {
  imageState.image = null;
  imageState.dataUrl = "";
  imageState.x = 0;
  imageState.y = 0;
  imageState.zoom = 1;
  imageState.baseScale = 1;
  imageState.scaleMode = "fill";
  fields.zoom.value = "1";
  updateZoomDisplay();
}

function constrainImageTransform() {
  if (!imageState.image) return;

  const art = getLayout().art;
  const drawW = imageState.image.width * imageState.baseScale * imageState.zoom;
  const drawH = imageState.image.height * imageState.baseScale * imageState.zoom;
  const overflowX = Math.max(0, (drawW - art.w) / 2);
  const overflowY = Math.max(0, (drawH - art.h) / 2);

  imageState.x = Math.min(overflowX, Math.max(-overflowX, imageState.x));
  imageState.y = Math.min(overflowY, Math.max(-overflowY, imageState.y));
}

function zoomArtwork(nextZoom, anchorPoint = null) {
  if (!imageState.image) return;
  const previousZoom = imageState.zoom;
  imageState.zoom = Math.min(Number(fields.zoom.max), Math.max(Number(fields.zoom.min), nextZoom));
  fields.zoom.value = imageState.zoom.toFixed(2);

  if (anchorPoint && previousZoom !== imageState.zoom) {
    const art = getLayout().art;
    const artCenterX = art.x + art.w / 2;
    const artCenterY = art.y + art.h / 2;
    imageState.x = anchorPoint.x - artCenterX - ((anchorPoint.x - artCenterX - imageState.x) * imageState.zoom / previousZoom);
    imageState.y = anchorPoint.y - artCenterY - ((anchorPoint.y - artCenterY - imageState.y) * imageState.zoom / previousZoom);
  }

  constrainImageTransform();
  updateZoomDisplay();
  scheduleDraw();
}

function updateZoomDisplay() {
  controls.zoomValue.textContent = `${Number(fields.zoom.value).toFixed(2)}x`;
  controls.artworkWidthOffsetValue.textContent = formatFineTuneValue(fields.artworkWidthOffset.value);
  controls.artworkHeightOffsetValue.textContent = formatFineTuneValue(fields.artworkHeightOffset.value);
}

function formatFineTuneValue(value) {
  const amount = Number(value) || 0;
  if (amount === 0) return "Default";
  return `${amount > 0 ? "+" : ""}${amount}px`;
}

function normalizeArtworkFineTune(savedValue, fineTuneVersion) {
  if (savedValue === undefined || savedValue === null || savedValue === "") return "0";
  const numeric = Number(savedValue) || 0;
  if (fineTuneVersion >= 2) return String(Math.max(-10, Math.min(10, numeric)));
  return String(Math.max(-10, Math.min(10, numeric - artworkOffsetBase)));
}

function updateFinishDisplay() {
  controls.finishIntensityValue.textContent = `${Math.round(Number(fields.finishIntensity.value) * 100)}%`;
  controls.holoIntensityValue.textContent = `${Math.round(Number(fields.holoIntensity.value) * 100)}%`;
  controls.borderSparkleValue.textContent = `${Math.round(Number(fields.borderSparkle.value) * 100)}%`;
  updateExportProfileLabel();
}

function updateExportProfileLabel() {
  const profile = exportProfiles[fields.exportProfile.value] || exportProfiles.home;
  controls.exportProfileLabel.textContent = `Current Export Profile: ${profile.label}`;
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function isInsideArt(point) {
  const art = getLayout().art;
  return point.x >= art.x &&
    point.x <= art.x + art.w &&
    point.y >= art.y &&
    point.y <= art.y + art.h;
}

function makeRenderCanvas(side = currentSide, profileKey = fields.exportProfile.value) {
  const output = document.createElement("canvas");
  output.width = card.width;
  output.height = card.height;
  const outputCtx = output.getContext("2d");
  if (side === "back") drawCardBack(outputCtx);
  else drawCardFront(outputCtx);
  applyExportProfile(output, profileKey, side);
  return output;
}

function makeSheetCanvas(side = currentSide, includePdfOptions = false, profileKey = fields.exportProfile.value) {
  const sheet = document.createElement("canvas");
  sheet.width = 2550;
  sheet.height = 3300;
  const sheetCtx = sheet.getContext("2d");
  sheetCtx.fillStyle = "#ffffff";
  sheetCtx.fillRect(0, 0, sheet.width, sheet.height);

  const marginX = 150;
  const marginY = 75;
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const x = marginX + col * card.width;
      const y = marginY + row * card.height;
      const cardCanvas = makeRenderCanvas(side, profileKey);
      sheetCtx.drawImage(cardCanvas, x, y, card.width, card.height);
      if (includePdfOptions && fields.cutGuides.checked) {
        drawCropMarks(sheetCtx, x, y, card.width, card.height, 28, "#111111");
      }
    }
  }

  return sheet;
}

function drawCardBySide(targetCtx, side, x, y, scale) {
  if (side === "back") drawCardBack(targetCtx, x, y, scale);
  else drawCardFront(targetCtx, x, y, scale);
}

function applyExportProfile(targetCanvas, profileKey, side = currentSide, protectText = true) {
  const profile = exportProfiles[profileKey] || exportProfiles.home;
  if (profileKey === "screen") return;

  const targetCtx = targetCanvas.getContext("2d");
  const imageData = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
  const data = imageData.data;

  const brightness = 1 + profile.brightness;
  const contrast = 1 + profile.contrast;
  const saturation = 1 + profile.saturation;
  const shadowLift = 72 * profile.shadowLift;
  const gammaPower = 1 / (1 + profile.gamma);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // Preserve ink-rich borders and line art so blacks stay black on export.
    if (luma < 24) continue;

    const shadowFactor = luma < 132 ? (1 - luma / 132) : 0;
    r += shadowLift * shadowFactor;
    g += shadowLift * shadowFactor;
    b += shadowLift * shadowFactor;

    r = 255 * Math.pow(Math.max(0, Math.min(255, r)) / 255, gammaPower);
    g = 255 * Math.pow(Math.max(0, Math.min(255, g)) / 255, gammaPower);
    b = 255 * Math.pow(Math.max(0, Math.min(255, b)) / 255, gammaPower);

    r *= brightness;
    g *= brightness;
    b *= brightness;

    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = gray + (r - gray) * saturation;
    g = gray + (g - gray) * saturation;
    b = gray + (b - gray) * saturation;

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  targetCtx.putImageData(imageData, 0, 0);
  if (protectText) {
    redrawExportSharpDetails(targetCtx, side);
  }
}

function redrawExportSharpDetails(targetCtx, side) {
  if (side === "back") {
    redrawBackSharpDetails(targetCtx);
    return;
  }

  drawTitle(targetCtx);
  drawTypeStrip(targetCtx);
  drawQuoteBox(targetCtx);
  drawLoreBox(targetCtx);
  drawFooter(targetCtx);
  drawRarity(targetCtx);
}

function redrawBackSharpDetails(targetCtx) {
  targetCtx.fillStyle = "#f3ead7";
  targetCtx.font = fitFont(targetCtx, "Lady & Delilah", 50, 30, 430, "Georgia", "700");
  targetCtx.textAlign = "center";
  targetCtx.textBaseline = "middle";
  targetCtx.fillText("Lady & Delilah", 375, 214);

  targetCtx.fillStyle = "#b8a77d";
  targetCtx.font = "700 21px Arial";
  targetCtx.fillText("WASTELAND ARCHIVE", 375, 264);

  drawPanel(targetCtx, 216, 606, 318, 70, "#1a1714", "#8f815f");
  targetCtx.fillStyle = "#efe8d5";
  targetCtx.font = "700 26px Arial";
  targetCtx.fillText(fields.number.value || "C-001", 375, 642);

  drawQrPlaceholder(targetCtx, 294, 710, 162);
  targetCtx.fillStyle = "#a89a7c";
  targetCtx.font = "13px Arial";
  targetCtx.fillText("Copyright Lady & Delilah. Local prototype card back.", 375, 958);
}

function downloadCanvas(sourceCanvas, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = sourceCanvas.toDataURL("image/png");
  link.click();
}

function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function exportPrintSheetPng() {
  downloadCanvas(makeSheetCanvas(currentSide, false), `lady-delilah-${currentSide}-9-card-sheet.png`);
}

function exportCardPdf(side = currentSide) {
  const cardCanvas = makeRenderCanvas(side);
  const imageBytes = canvasToJpegBytes(cardCanvas, 0.94);
  const cardW = 180;
  const cardH = 252;
  const bleed = fields.cardBleed.checked ? 9 : 0;
  const pageW = fields.printMargin.checked ? 612 : cardW + bleed * 2;
  const pageH = fields.printMargin.checked ? 792 : cardH + bleed * 2;
  const x = (pageW - cardW) / 2;
  const y = (pageH - cardH) / 2;
  const draw = {
    x: x - bleed,
    y: y - bleed,
    w: cardW + bleed * 2,
    h: cardH + bleed * 2,
  };
  const commands = [
    `q ${draw.w.toFixed(2)} 0 0 ${draw.h.toFixed(2)} ${draw.x.toFixed(2)} ${draw.y.toFixed(2)} cm /Im1 Do Q`,
  ];
  if (fields.cutGuides.checked) {
    commands.push(pdfCropMarks(x, y, cardW, cardH, 8));
  }
  const pdf = buildPdf({
    pageWidth: pageW,
    pageHeight: pageH,
    image: { name: "Im1", width: cardCanvas.width, height: cardCanvas.height, bytes: imageBytes },
    content: commands.join("\n"),
  });
  downloadBlob(pdf, `lady-delilah-${side}-card.pdf`);
}

function exportSheetPdf() {
  const sheetCanvas = makeSheetCanvas(currentSide, true);
  const imageBytes = canvasToJpegBytes(sheetCanvas, 0.94);
  const pdf = buildPdf({
    pageWidth: 612,
    pageHeight: 792,
    image: { name: "Im1", width: sheetCanvas.width, height: sheetCanvas.height, bytes: imageBytes },
    content: "q 612 0 0 792 0 0 cm /Im1 Do Q",
  });
  downloadBlob(pdf, `lady-delilah-${currentSide}-9-card-sheet.pdf`);
}

function exportCalibrationSheet() {
  const sheet = document.createElement("canvas");
  sheet.width = 2550;
  sheet.height = 3300;
  const sheetCtx = sheet.getContext("2d");
  sheetCtx.fillStyle = "#ffffff";
  sheetCtx.fillRect(0, 0, sheet.width, sheet.height);

  const profiles = ["screen", "home", "bright", "maximum"];
  const cardW = 750;
  const cardH = 1050;
  const positions = [
    { x: 290, y: 260 },
    { x: 1510, y: 260 },
    { x: 290, y: 1840 },
    { x: 1510, y: 1840 },
  ];

  profiles.forEach((profileKey, index) => {
    const profile = exportProfiles[profileKey];
    const position = positions[index];
    const cardCanvas = makeRenderCanvas(currentSide, profileKey);

    sheetCtx.fillStyle = "#111111";
    sheetCtx.font = "700 48px Arial";
    sheetCtx.textAlign = "center";
    sheetCtx.textBaseline = "middle";
    sheetCtx.fillText(profile.label, position.x + cardW / 2, position.y - 68);

    sheetCtx.drawImage(cardCanvas, position.x, position.y, cardW, cardH);
    if (fields.cutGuides.checked) {
      drawCropMarks(sheetCtx, position.x, position.y, cardW, cardH, 32, "#111111");
    }
  });

  const imageBytes = canvasToJpegBytes(sheet, 0.94);
  const pdf = buildPdf({
    pageWidth: 612,
    pageHeight: 792,
    image: { name: "Im1", width: sheet.width, height: sheet.height, bytes: imageBytes },
    content: "q 612 0 0 792 0 0 cm /Im1 Do Q",
  });
  downloadBlob(pdf, "lady-delilah-print-calibration-sheet.pdf");
}

function drawCropMarks(targetCtx, x, y, w, h, length, color) {
  targetCtx.save();
  targetCtx.strokeStyle = color;
  targetCtx.lineWidth = 2;
  [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([cx, cy]) => {
    const sx = cx === x ? -1 : 1;
    const sy = cy === y ? -1 : 1;
    targetCtx.beginPath();
    targetCtx.moveTo(cx + sx * 7, cy);
    targetCtx.lineTo(cx + sx * length, cy);
    targetCtx.moveTo(cx, cy + sy * 7);
    targetCtx.lineTo(cx, cy + sy * length);
    targetCtx.stroke();
  });
  targetCtx.restore();
}

function pdfCropMarks(x, y, w, h, length) {
  const top = y + h;
  const right = x + w;
  return [
    "0 0 0 RG 0.5 w",
    `${(x - length).toFixed(2)} ${y.toFixed(2)} m ${(x - 2).toFixed(2)} ${y.toFixed(2)} l S`,
    `${x.toFixed(2)} ${(y - length).toFixed(2)} m ${x.toFixed(2)} ${(y - 2).toFixed(2)} l S`,
    `${(right + 2).toFixed(2)} ${y.toFixed(2)} m ${(right + length).toFixed(2)} ${y.toFixed(2)} l S`,
    `${right.toFixed(2)} ${(y - length).toFixed(2)} m ${right.toFixed(2)} ${(y - 2).toFixed(2)} l S`,
    `${(x - length).toFixed(2)} ${top.toFixed(2)} m ${(x - 2).toFixed(2)} ${top.toFixed(2)} l S`,
    `${x.toFixed(2)} ${(top + 2).toFixed(2)} m ${x.toFixed(2)} ${(top + length).toFixed(2)} l S`,
    `${(right + 2).toFixed(2)} ${top.toFixed(2)} m ${(right + length).toFixed(2)} ${top.toFixed(2)} l S`,
    `${right.toFixed(2)} ${(top + 2).toFixed(2)} m ${right.toFixed(2)} ${(top + length).toFixed(2)} l S`,
  ].join("\n");
}

function canvasToJpegBytes(sourceCanvas, quality) {
  const dataUrl = sourceCanvas.toDataURL("image/jpeg", quality);
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function buildPdf({ pageWidth, pageHeight, image, content }) {
  const encoder = new TextEncoder();
  const objects = [];

  objects.push({ text: "<< /Type /Catalog /Pages 2 0 R >>" });
  objects.push({ text: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" });
  objects.push({
    text: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /${image.name} 4 0 R >> >> /Contents 5 0 R >>`,
  });
  objects.push({
    before: `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`,
    binary: image.bytes,
    after: "\nendstream",
  });
  const contentBytes = encoder.encode(content);
  objects.push({
    before: `<< /Length ${contentBytes.length} >>\nstream\n`,
    binary: contentBytes,
    after: "\nendstream",
  });

  const parts = ["%PDF-1.4\n%CardMaker\n"];
  const offsets = [0];
  let byteLength = encoder.encode(parts[0]).length;

  objects.forEach((object, index) => {
    offsets.push(byteLength);
    const head = `${index + 1} 0 obj\n`;
    parts.push(head);
    byteLength += encoder.encode(head).length;

    if (object.text) {
      parts.push(`${object.text}\n`);
      byteLength += encoder.encode(`${object.text}\n`).length;
    } else {
      parts.push(object.before);
      parts.push(object.binary);
      parts.push(object.after);
      byteLength += encoder.encode(object.before).length + object.binary.length + encoder.encode(object.after).length;
    }

    const tail = "\nendobj\n";
    parts.push(tail);
    byteLength += encoder.encode(tail).length;
  });

  const xrefOffset = byteLength;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  parts.push(xref);

  return new Blob(parts, { type: "application/pdf" });
}

function buildMultiPageImagePdf(pages) {
  const encoder = new TextEncoder();
  const objects = [];
  const pageObjectNumbers = [];
  const imageObjectNumbers = [];
  const contentObjectNumbers = [];

  objects.push({ text: "<< /Type /Catalog /Pages 2 0 R >>" });
  objects.push({ text: "" });

  pages.forEach((page, index) => {
    const pageObj = objects.length + 1;
    const imageObj = pageObj + 1;
    const contentObj = pageObj + 2;
    pageObjectNumbers.push(pageObj);
    imageObjectNumbers.push(imageObj);
    contentObjectNumbers.push(contentObj);

    objects.push({
      text: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im${index + 1} ${imageObj} 0 R >> >> /Contents ${contentObj} 0 R >>`,
    });
    objects.push({
      before: `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`,
      binary: page.bytes,
      after: "\nendstream",
    });
    const content = `q 612 0 0 792 0 0 cm /Im${index + 1} Do Q`;
    const contentBytes = encoder.encode(content);
    objects.push({
      before: `<< /Length ${contentBytes.length} >>\nstream\n`,
      binary: contentBytes,
      after: "\nendstream",
    });
  });

  objects[1] = {
    text: `<< /Type /Pages /Kids [${pageObjectNumbers.map((page) => `${page} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`,
  };

  const parts = ["%PDF-1.4\n%CardMakerPack\n"];
  const offsets = [0];
  let byteLength = encoder.encode(parts[0]).length;

  objects.forEach((object, index) => {
    offsets.push(byteLength);
    const head = `${index + 1} 0 obj\n`;
    parts.push(head);
    byteLength += encoder.encode(head).length;

    if (object.text) {
      parts.push(`${object.text}\n`);
      byteLength += encoder.encode(`${object.text}\n`).length;
    } else {
      parts.push(object.before);
      parts.push(object.binary);
      parts.push(object.after);
      byteLength += encoder.encode(object.before).length + object.binary.length + encoder.encode(object.after).length;
    }

    const tail = "\nendobj\n";
    parts.push(tail);
    byteLength += encoder.encode(tail).length;
  });

  const xrefOffset = byteLength;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  parts.push(xref);

  return new Blob(parts, { type: "application/pdf" });
}

function parsePackCardName(filename) {
  return filename
    .replace(/\.png$/i, "")
    .replace(/_(common|uncommon|rare|epic|legendary|promo)$/i, "")
    .replace(/-/g, " ");
}

function parsePackRarity(filename) {
  const match = filename.match(/_(common|uncommon|rare|epic|legendary|promo)\.png$/i);
  return match ? match[1].toLowerCase() : "";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function loadPackCards(files) {
  const pngs = Array.from(files).filter((file) => file.type === "image/png" || /\.png$/i.test(file.name));
  const loaded = await Promise.all(pngs.map(async (file) => ({
    id: `${file.name}-${file.lastModified}-${file.size}`,
    filename: file.name,
    name: parsePackCardName(file.name),
    rarity: parsePackRarity(file.name),
    dataUrl: await readFileAsDataUrl(file),
  })));
  packPool = loaded;
  currentPack = [];
  updatePackCounts();
  renderPackPreview();
}

function updatePackCounts() {
  packControls.loadedCount.textContent = `${packPool.length} card${packPool.length === 1 ? "" : "s"} loaded`;
  packControls.previewCount.textContent = `${currentPack.length} selected`;
}

function generatePack() {
  const count = Math.max(1, Number(packControls.size.value) || 10);
  if (!packPool.length) {
    currentPack = [];
    renderPackPreview();
    return;
  }

  if (packControls.balancedMode.checked && hasRarityTags(packPool)) {
    currentPack = generateBalancedPack(count);
  } else {
    currentPack = pickRandomCards(packPool, count, packControls.allowDuplicates.checked);
  }

  renderPackPreview();
}

function hasRarityTags(cards) {
  return cards.some((cardItem) => Boolean(cardItem.rarity));
}

function generateBalancedPack(count) {
  if (count !== 10) {
    return pickRandomCards(packPool, count, packControls.allowDuplicates.checked);
  }

  const commons = packPool.filter((cardItem) => cardItem.rarity === "common");
  const mid = packPool.filter((cardItem) => cardItem.rarity === "uncommon" || cardItem.rarity === "rare");
  const high = packPool.filter((cardItem) => ["epic", "legendary", "promo"].includes(cardItem.rarity));
  const allowDuplicates = packControls.allowDuplicates.checked;
  const selected = [
    ...pickRandomCards(commons, 6, allowDuplicates),
    ...pickRandomCards(mid, 3, allowDuplicates),
    ...pickRandomCards(high, 1, allowDuplicates),
  ];

  if (selected.length < 10) {
    const selectedIds = new Set(selected.map((cardItem) => cardItem.id));
    const fallbackPool = allowDuplicates ? packPool : packPool.filter((cardItem) => !selectedIds.has(cardItem.id));
    selected.push(...pickRandomCards(fallbackPool, 10 - selected.length, allowDuplicates));
  }

  return shuffle(selected).slice(0, 10);
}

function pickRandomCards(cards, count, allowDuplicates) {
  if (!cards.length) return [];
  if (allowDuplicates) {
    return Array.from({ length: count }, () => cards[Math.floor(Math.random() * cards.length)]);
  }
  return shuffle(cards).slice(0, Math.min(count, cards.length));
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function renderPackPreview() {
  packControls.preview.innerHTML = "";
  currentPack.forEach((cardItem, index) => {
    const item = document.createElement("div");
    item.className = "pack-card";

    const image = document.createElement("img");
    image.src = cardItem.dataUrl;
    image.alt = cardItem.name;

    const label = document.createElement("span");
    label.textContent = `${index + 1}. ${cardItem.name}${cardItem.rarity ? ` (${cardItem.rarity})` : ""}`;

    item.appendChild(image);
    item.appendChild(label);
    packControls.preview.appendChild(item);
  });
  updatePackCounts();
}

async function exportPackZip() {
  if (!currentPack.length) return;
  const entries = currentPack.map((cardItem, index) => ({
    name: `${String(index + 1).padStart(2, "0")}-${cardItem.filename}`,
    bytes: dataUrlToBytes(cardItem.dataUrl),
  }));
  const zip = buildZip(entries);
  downloadBlob(zip, "lady-delilah-pack.zip");
}

async function exportPackPdf() {
  if (!currentPack.length) return;
  const pages = [];
  for (let i = 0; i < currentPack.length; i += 9) {
    const pageCards = currentPack.slice(i, i + 9);
    const sheet = await makePackSheetCanvas(pageCards);
    pages.push({
      width: sheet.width,
      height: sheet.height,
      bytes: canvasToJpegBytes(sheet, 0.94),
    });
  }
  downloadBlob(buildMultiPageImagePdf(pages), "lady-delilah-pack-print-sheets.pdf");
}

function exportPackCsv() {
  if (!currentPack.length) return;
  const rows = ["Slot,Filename,Name,Rarity"];
  currentPack.forEach((cardItem, index) => {
    rows.push([
      index + 1,
      csvEscape(cardItem.filename),
      csvEscape(cardItem.name),
      csvEscape(cardItem.rarity || "untagged"),
    ].join(","));
  });
  downloadBlob(new Blob([rows.join("\n")], { type: "text/csv" }), "lady-delilah-pack-list.csv");
}

function csvEscape(value) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function makePackSheetCanvas(cards) {
  const sheet = document.createElement("canvas");
  sheet.width = 2550;
  sheet.height = 3300;
  const sheetCtx = sheet.getContext("2d");
  sheetCtx.fillStyle = "#ffffff";
  sheetCtx.fillRect(0, 0, sheet.width, sheet.height);

  const marginX = 150;
  const marginY = 75;
  for (let index = 0; index < cards.length; index += 1) {
    const image = await loadImageElement(cards[index].dataUrl);
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = marginX + col * card.width;
    const y = marginY + row * card.height;
    sheetCtx.drawImage(image, x, y, card.width, card.height);
    drawCropMarks(sheetCtx, x, y, card.width, card.height, 28, "#111111");
  }

  applyExportProfile(sheet, fields.exportProfile.value, currentSide, false);
  return sheet;
}

function loadImageElement(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.src = dataUrl;
  });
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getEditableSnapshot() {
  return JSON.parse(JSON.stringify(getProjectData({ includeLibrary: false })));
}

function addCurrentCardToLibrary() {
  const snapshot = getEditableSnapshot();
  const thumbnailCanvas = makeRenderCanvas("front", "screen");
  const printCanvas = makeRenderCanvas("front", fields.exportProfile.value);
  const entry = {
    id: `library-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: fields.title.value || "Untitled Card",
    number: fields.number.value || "C-001",
    label: `${fields.number.value || "C-001"} ${fields.title.value || "Untitled Card"}`,
    thumbnailDataUrl: thumbnailCanvas.toDataURL("image/png"),
    printReadyDataUrl: printCanvas.toDataURL("image/png"),
    dataUrl: printCanvas.toDataURL("image/png"),
    content: snapshot.fields,
    visualSettings: getLibraryVisualSettings(snapshot),
    printSettings: getLibraryPrintSettings(snapshot),
    snapshot,
  };
  cardLibrary.push(entry);
  renderCardLibrary();
  showLibraryAddedFeedback();
}

function showLibraryAddedFeedback() {
  libraryControls.add.classList.remove("is-success");
  void libraryControls.add.offsetWidth;
  libraryControls.add.classList.add("is-success");
  controls.libraryAddStatus.textContent = "Card added to library";
  controls.libraryAddStatus.classList.add("is-visible");
  window.clearTimeout(showLibraryAddedFeedback.timeoutId);
  showLibraryAddedFeedback.timeoutId = window.setTimeout(() => {
    libraryControls.add.classList.remove("is-success");
    controls.libraryAddStatus.classList.remove("is-visible");
    controls.libraryAddStatus.textContent = "";
  }, 1600);
}

function getLibraryVisualSettings(snapshot) {
  const saved = snapshot.fields || {};
  const transform = snapshot.imageTransform || {};
  const widthFineTune = normalizeArtworkFineTune(saved.artworkWidthOffset, snapshot.layoutFineTuneVersion);
  const heightFineTune = normalizeArtworkFineTune(saved.artworkHeightOffset, snapshot.layoutFineTuneVersion);
  return {
    imagePosition: { x: transform.x || 0, y: transform.y || 0 },
    imageZoom: transform.zoom || 1,
    imageScaleMode: transform.scaleMode || "fill",
    artworkWidthOffset: widthFineTune,
    artworkHeightOffset: heightFineTune,
    actualArtworkWidthOffset: getArtworkOffset(widthFineTune),
    actualArtworkHeightOffset: getArtworkOffset(heightFineTune),
    titleFontSize: saved.titleFontSize || "large",
    typeFontSize: saved.typeFontSize || "medium",
    quoteFontSize: saved.quoteFontSize || "large",
    loreFontSize: saved.loreFontSize || "large",
    footerFontSize: saved.footerFontSize || "medium",
    finishStyle: saved.finishStyle || "standard",
    finishIntensity: saved.finishIntensity || "0.35",
    holoBorderEnabled: Boolean(saved.holoBorderEnabled),
    holoIntensity: saved.holoIntensity || "0.55",
    borderSparkle: saved.borderSparkle || "0.35",
    rarity: saved.rarity || "none",
  };
}

function getLibraryPrintSettings(snapshot) {
  const printOptions = snapshot.printOptions || {};
  const profileKey = printOptions.exportProfile || "home";
  return {
    exportProfile: profileKey,
    exportProfileValues: exportProfiles[profileKey] || exportProfiles.home,
    printMargin: printOptions.printMargin !== false,
    cutGuides: printOptions.cutGuides !== false,
    cardBleed: Boolean(printOptions.cardBleed),
  };
}

function normalizeLibraryEntry(entry) {
  const snapshot = entry.snapshot || {};
  const primaryImage = entry.printReadyDataUrl || entry.dataUrl || entry.thumbnailDataUrl || "";
  const thumbnailImage = entry.thumbnailDataUrl || entry.dataUrl || entry.printReadyDataUrl || "";
  return {
    ...entry,
    thumbnailDataUrl: thumbnailImage,
    printReadyDataUrl: primaryImage,
    dataUrl: entry.dataUrl || primaryImage,
    content: entry.content || snapshot.fields || {},
    visualSettings: entry.visualSettings || getLibraryVisualSettings(snapshot),
    printSettings: entry.printSettings || getLibraryPrintSettings(snapshot),
  };
}

function renderCardLibrary() {
  libraryControls.count.textContent = `Cards in Library: ${cardLibrary.length}`;
  libraryControls.preview.innerHTML = "";

  cardLibrary.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "pack-card library-card";

    const image = document.createElement("img");
    image.src = entry.thumbnailDataUrl || entry.dataUrl;
    image.alt = entry.label;
    image.addEventListener("click", () => loadLibraryCard(entry.id));

    const label = document.createElement("span");
    label.textContent = entry.label;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      removeLibraryCard(entry.id);
    });

    item.appendChild(image);
    item.appendChild(label);
    item.appendChild(remove);
    libraryControls.preview.appendChild(item);
  });
}

function loadLibraryCard(id) {
  const entry = cardLibrary.find((item) => item.id === id);
  if (!entry || !entry.snapshot) return;
  applyProject(entry.snapshot, { preserveLibrary: true });
  setWorkspaceTab("front");
}

function removeLibraryCard(id) {
  cardLibrary = cardLibrary.filter((entry) => entry.id !== id);
  renderCardLibrary();
}

async function exportLibraryPdf() {
  if (!cardLibrary.length) return;
  const pages = [];
  for (let i = 0; i < cardLibrary.length; i += 9) {
    const pageEntries = cardLibrary.slice(i, i + 9);
    const sheet = await makeImageSheetCanvas(pageEntries);
    pages.push({
      width: sheet.width,
      height: sheet.height,
      bytes: canvasToJpegBytes(sheet, 0.94),
    });
  }
  downloadBlob(buildMultiPageImagePdf(pages), "lady-delilah-card-library-sheets.pdf");
}

async function exportLibraryPng() {
  if (!cardLibrary.length) return;
  const sheet = await makeImageSheetCanvas(cardLibrary.slice(0, 9));
  downloadCanvas(sheet, "lady-delilah-card-library-sheet.png");
}

async function makeImageSheetCanvas(entries) {
  const sheet = document.createElement("canvas");
  sheet.width = 2550;
  sheet.height = 3300;
  const sheetCtx = sheet.getContext("2d");
  sheetCtx.fillStyle = "#ffffff";
  sheetCtx.fillRect(0, 0, sheet.width, sheet.height);

  const marginX = 150;
  const marginY = 75;
  for (let index = 0; index < entries.length; index += 1) {
    const image = await loadImageElement(entries[index].printReadyDataUrl || entries[index].dataUrl);
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = marginX + col * card.width;
    const y = marginY + row * card.height;
    sheetCtx.drawImage(image, x, y, card.width, card.height);
    const showCutGuides = entries[index].printSettings ? entries[index].printSettings.cutGuides : fields.cutGuides.checked;
    if (showCutGuides) {
      drawCropMarks(sheetCtx, x, y, card.width, card.height, 28, "#111111");
    }
  }

  return sheet;
}

function buildZip(entries) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  entries.forEach((entry) => {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.bytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, entry.bytes.length, true);
    localView.setUint32(22, entry.bytes.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, entry.bytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, entry.bytes.length, true);
    centralView.setUint32(24, entry.bytes.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + entry.bytes.length;
  });

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function getProjectData(options = {}) {
  const includeLibrary = options.includeLibrary !== false;
  const project = {
    version: 2,
    layoutFineTuneVersion: 2,
    side: currentSide,
    image: imageState.dataUrl,
    imageTransform: {
      x: imageState.x,
      y: imageState.y,
      zoom: imageState.zoom,
      scaleMode: imageState.scaleMode,
    },
    fields: {
      title: fields.title.value,
      cardType: fields.typeSelect.value,
      customCardType: fields.customType.value,
      cardNumber: fields.number.value,
      quote: fields.quote.value,
      lore: fields.lore.value,
      footer: fields.footer.value,
      titleFontSize: fields.titleFontSize.value,
      typeFontSize: fields.typeFontSize.value,
      quoteFontSize: fields.quoteFontSize.value,
      loreFontSize: fields.loreFontSize.value,
      footerFontSize: fields.footerFontSize.value,
      artworkWidthOffset: fields.artworkWidthOffset.value,
      artworkHeightOffset: fields.artworkHeightOffset.value,
      rarity: fields.rarity.value,
      template: fields.template.value,
      finishStyle: fields.finishStyle.value,
      finishIntensity: fields.finishIntensity.value,
      holoBorderEnabled: fields.holoBorderEnabled.checked,
      holoIntensity: fields.holoIntensity.value,
      borderSparkle: fields.borderSparkle.value,
    },
    printOptions: {
      printMargin: fields.printMargin.checked,
      cutGuides: fields.cutGuides.checked,
      cardBleed: fields.cardBleed.checked,
      exportProfile: fields.exportProfile.value,
    },
  };
  if (includeLibrary) {
    project.cardLibrary = cardLibrary;
  }
  return project;
}

function saveProject() {
  const json = JSON.stringify(getProjectData(), null, 2);
  downloadBlob(new Blob([json], { type: "application/json" }), "lady-delilah-card-project.json");
}

function loadProject(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const project = JSON.parse(reader.result);
    applyProject(project);
  };
  reader.readAsText(file);
}

function applyProject(project, options = {}) {
  if (!options.preserveLibrary) {
    cardLibrary = Array.isArray(project.cardLibrary) ? project.cardLibrary.map(normalizeLibraryEntry) : [];
    renderCardLibrary();
  }

  const saved = project.fields || {};
  fields.title.value = saved.title || "";
  fields.typeSelect.value = saved.cardType || "Character";
  fields.customType.value = saved.customCardType || "";
  fields.number.value = saved.cardNumber || "C-001";
  fields.quote.value = saved.quote || "";
  fields.lore.value = saved.lore || "";
  fields.footer.value = saved.footer || "";
  fields.titleFontSize.value = saved.titleFontSize || "large";
  fields.typeFontSize.value = saved.typeFontSize || "medium";
  fields.quoteFontSize.value = saved.quoteFontSize || "large";
  fields.loreFontSize.value = saved.loreFontSize || "large";
  fields.footerFontSize.value = saved.footerFontSize || "medium";
  fields.artworkWidthOffset.value = normalizeArtworkFineTune(saved.artworkWidthOffset, project.layoutFineTuneVersion);
  fields.artworkHeightOffset.value = normalizeArtworkFineTune(saved.artworkHeightOffset, project.layoutFineTuneVersion);
  fields.rarity.value = saved.rarity || "none";
  fields.template.value = saved.template || "default";
  fields.finishStyle.value = saved.finishStyle || "standard";
  fields.finishIntensity.value = saved.finishIntensity || "0.35";
  fields.holoBorderEnabled.checked = Boolean(saved.holoBorderEnabled);
  fields.holoIntensity.value = saved.holoIntensity || "0.55";
  fields.borderSparkle.value = saved.borderSparkle || "0.35";

  const printOptions = project.printOptions || {};
  fields.printMargin.checked = printOptions.printMargin !== false;
  fields.cutGuides.checked = printOptions.cutGuides !== false;
  fields.cardBleed.checked = Boolean(printOptions.cardBleed);
  fields.exportProfile.value = printOptions.exportProfile || "home";

  updateTemplateLabels();
  enforceTextLimits();
  updateTextCounters();
  updateBackMirror();
  setSide(project.side || "front");

  if (project.image) {
    loadImageDataUrl(project.image);
    const transform = project.imageTransform || {};
    setTimeout(() => {
      imageState.x = Number(transform.x) || 0;
      imageState.y = Number(transform.y) || 0;
      imageState.zoom = Number(transform.zoom) || 1;
      imageState.scaleMode = transform.scaleMode || "fill";
      imageState.baseScale = getBaseScale(imageState.scaleMode);
      fields.zoom.value = imageState.zoom.toFixed(2);
      constrainImageTransform();
      updateZoomDisplay();
      updateFinishDisplay();
      scheduleDraw();
    }, 0);
  } else {
    clearArtwork();
    updateFinishDisplay();
    scheduleDraw();
  }
}

function duplicateCard() {
  fields.title.value = "";
  fields.quote.value = "";
  fields.lore.value = "";
  clearArtwork();
  updateTextCounters();
  scheduleDraw();
}

function setSide(side) {
  currentSide = side;
  controls.previewSideLabel.textContent = side === "front" ? "Front Preview" : "Back Preview";
  controls.dropZone.classList.toggle("is-hidden", side === "back");
  scheduleDraw();
}

function setWorkspaceTab(tabName, options = {}) {
  const tabs = {
    front: { button: controls.frontTab, panel: controls.frontPanel },
    back: { button: controls.backTab, panel: controls.backPanel },
    library: { button: controls.libraryTab, panel: controls.libraryPanel },
    pack: { button: controls.packBuilderTab, panel: controls.packBuilderPanel },
    settings: { button: controls.settingsTab, panel: controls.settingsPanel },
  };

  Object.entries(tabs).forEach(([name, tab]) => {
    const active = name === tabName;
    tab.button.classList.toggle("is-active", active);
    tab.button.setAttribute("aria-selected", String(active));
    tab.panel.classList.toggle("is-active", active);
  });

  if (tabName === "front") setSide("front");
  if (tabName === "back") setSide("back");
  if (!options.skipSave) {
    try {
      localStorage.setItem("ladyDelilahWorkspaceTab", tabName);
    } catch (error) {
    }
  }
}

function updateBackMirror() {
  controls.backCardNumberMirror.value = fields.number.value || "C-001";
}

controls.imageInput.addEventListener("change", (event) => {
  loadImageFile(event.target.files[0]);
});

["dragenter", "dragover"].forEach((eventName) => {
  controls.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    controls.dropZone.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  controls.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    controls.dropZone.classList.remove("is-dragging");
  });
});

controls.dropZone.addEventListener("drop", (event) => {
  loadImageFile(event.dataTransfer.files[0]);
});

function hasImageFile(dataTransfer) {
  const items = Array.from(dataTransfer?.items || []);
  const files = Array.from(dataTransfer?.files || []);
  return items.some((item) => item.kind === "file" && item.type.startsWith("image/")) ||
    files.some((file) => file.type.startsWith("image/"));
}

function setArtworkDropActive(active) {
  if (artworkDropActive === active) return;
  artworkDropActive = active;
  scheduleDraw();
}

document.addEventListener("dragover", (event) => {
  if (event.dataTransfer?.types?.includes("Files")) event.preventDefault();
});

document.addEventListener("drop", (event) => {
  if (event.dataTransfer?.types?.includes("Files")) event.preventDefault();
  setArtworkDropActive(false);
});

canvas.addEventListener("dragenter", (event) => {
  if (currentSide !== "front" || !hasImageFile(event.dataTransfer)) return;
  event.preventDefault();
  setArtworkDropActive(isInsideArt(canvasPoint(event)));
});

canvas.addEventListener("dragover", (event) => {
  if (currentSide !== "front" || !hasImageFile(event.dataTransfer)) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
  setArtworkDropActive(isInsideArt(canvasPoint(event)));
});

canvas.addEventListener("dragleave", (event) => {
  if (!canvas.contains(event.relatedTarget)) setArtworkDropActive(false);
});

canvas.addEventListener("drop", (event) => {
  if (currentSide !== "front" || !hasImageFile(event.dataTransfer)) return;
  event.preventDefault();
  const point = canvasPoint(event);
  setArtworkDropActive(false);
  if (isInsideArt(point)) loadImageFile(event.dataTransfer.files[0]);
});

Object.values(fields).forEach((field) => {
  field.addEventListener("input", () => {
    enforceTextLimits();
    updateTextCounters();
    imageState.zoom = Number(fields.zoom.value);
    updateCustomTypeVisibility();
    updateZoomDisplay();
    updateFinishDisplay();
    updateBackMirror();
    refreshImageScaleForLayout();
    constrainImageTransform();
    scheduleDraw();
  });
});

fields.template.addEventListener("change", () => {
  updateTemplateLabels();
  updateTextCounters();
  scheduleDraw();
});

controls.resetImage.addEventListener("click", () => {
  resetImageTransform();
  scheduleDraw();
});

controls.fitImage.addEventListener("click", () => {
  setImageScaleMode("fit");
  scheduleDraw();
});

controls.fillFrame.addEventListener("click", () => {
  setImageScaleMode("fill");
  scheduleDraw();
});

controls.duplicateCard.addEventListener("click", duplicateCard);
controls.saveProject.addEventListener("click", saveProject);
controls.loadProjectButton.addEventListener("click", () => controls.projectFileInput.click());
controls.projectFileInput.addEventListener("change", (event) => loadProject(event.target.files[0]));

controls.exportPng.addEventListener("click", () => {
  downloadCanvas(makeRenderCanvas("front"), "lady-delilah-front-card.png");
});

controls.exportPdf.addEventListener("click", () => exportCardPdf("front"));
controls.exportBackPng.addEventListener("click", () => {
  downloadCanvas(makeRenderCanvas("back"), "lady-delilah-back-card.png");
});
controls.exportBackPdf.addEventListener("click", () => exportCardPdf("back"));
controls.exportSheet.addEventListener("click", exportPrintSheetPng);
controls.exportSheetPdf.addEventListener("click", exportSheetPdf);
controls.exportCalibrationSheet.addEventListener("click", exportCalibrationSheet);
controls.frontTab.addEventListener("click", () => setWorkspaceTab("front"));
controls.backTab.addEventListener("click", () => setWorkspaceTab("back"));
controls.libraryTab.addEventListener("click", () => setWorkspaceTab("library"));
controls.packBuilderTab.addEventListener("click", () => setWorkspaceTab("pack"));
controls.settingsTab.addEventListener("click", () => setWorkspaceTab("settings"));

packControls.input.addEventListener("change", (event) => {
  loadPackCards(event.target.files);
});

packControls.generate.addEventListener("click", generatePack);
packControls.exportZip.addEventListener("click", exportPackZip);
packControls.exportPdf.addEventListener("click", exportPackPdf);
packControls.exportCsv.addEventListener("click", exportPackCsv);

libraryControls.add.addEventListener("click", addCurrentCardToLibrary);
libraryControls.exportPdf.addEventListener("click", exportLibraryPdf);
libraryControls.exportPng.addEventListener("click", exportLibraryPng);

canvas.addEventListener("pointerdown", (event) => {
  if (currentSide !== "front" || !imageState.image) return;
  const point = canvasPoint(event);
  if (!isInsideArt(point)) return;
  activeDrag = {
    pointerId: event.pointerId,
    startX: point.x,
    startY: point.y,
    imageX: imageState.x,
    imageY: imageState.y,
  };
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
  const point = canvasPoint(event);
  imageState.x = activeDrag.imageX + point.x - activeDrag.startX;
  imageState.y = activeDrag.imageY + point.y - activeDrag.startY;
  constrainImageTransform();
  scheduleDraw();
});

canvas.addEventListener("pointerup", () => {
  activeDrag = null;
});

canvas.addEventListener("pointercancel", () => {
  activeDrag = null;
});

canvas.addEventListener("wheel", (event) => {
  if (currentSide !== "front" || !imageState.image) return;
  const point = canvasPoint(event);
  if (!isInsideArt(point)) return;
  event.preventDefault();
  const direction = event.deltaY < 0 ? 1 : -1;
  zoomArtwork(imageState.zoom + direction * 0.08, point);
}, { passive: false });

canvas.addEventListener("dblclick", () => {
  resetImageTransform();
  scheduleDraw();
});

updateTemplateLabels();
enforceTextLimits();
updateTextCounters();
updateBackMirror();
updateZoomDisplay();
updateFinishDisplay();
renderCardLibrary();
try {
  const savedTab = localStorage.getItem("ladyDelilahWorkspaceTab") || "front";
  setWorkspaceTab(["front", "back", "library", "pack", "settings"].includes(savedTab) ? savedTab : "front", { skipSave: true });
} catch (error) {
  setWorkspaceTab("front", { skipSave: true });
}
drawCurrentSide();
