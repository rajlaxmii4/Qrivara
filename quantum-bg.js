/**
 * PCB + IC Background — Qrivara
 * Traces and ICs routed to side margins and edges,
 * keeping the center content area clear.
 * Zero dependencies. Static render.
 */
(function () {
  'use strict';

  var canvas, ctx, dpr, W, H;

  // Colors
  var COPPER      = 'rgba(184,115,51,0.25)';
  var COPPER_BOLD = 'rgba(184,115,51,0.35)';
  var TEAL        = 'rgba(234,88,12,0.20)';
  var VIA_RING    = 'rgba(184,115,51,0.32)';
  var VIA_HOLE    = '#ffffff';
  var IC_FILL     = 'rgba(22,22,58,0.07)';
  var IC_STROKE   = 'rgba(184,115,51,0.35)';
  var PAD_FILL    = 'rgba(184,115,51,0.16)';
  var SILK        = 'rgba(100,116,139,0.28)';

  // roundRect polyfill
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
      if (typeof r === 'number') r = [r, r, r, r];
      var tl = r[0] || 0;
      this.moveTo(x + tl, y);
      this.lineTo(x + w - tl, y);
      this.arcTo(x + w, y, x + w, y + tl, tl);
      this.lineTo(x + w, y + h - tl);
      this.arcTo(x + w, y + h, x + w - tl, y + h, tl);
      this.lineTo(x + tl, y + h);
      this.arcTo(x, y + h, x, y + h - tl, tl);
      this.lineTo(x, y + tl);
      this.arcTo(x, y, x + tl, y, tl);
      this.closePath();
    };
  }

  function createCanvas() {
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext('2d');
  }

  function setupCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ── Drawing primitives ──────────────────────────────────────────

  function line(x1, y1, x2, y2, color, width) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function via(x, y, r) {
    r = r || 5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(184,115,51,0.12)';
    ctx.fill();
    ctx.strokeStyle = VIA_RING;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = VIA_HOLE;
    ctx.fill();
    ctx.strokeStyle = VIA_RING;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  // ── IC Package (SOIC) ──────────────────────────────────────────

  function drawIC(cx, cy, w, h, pins, label) {
    var x = cx - w / 2;
    var y = cy - h / 2;

    ctx.fillStyle = IC_FILL;
    ctx.strokeStyle = IC_STROKE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();
    ctx.stroke();

    // Orientation dot
    ctx.beginPath();
    ctx.arc(x + 6, y + 6, 2, 0, Math.PI * 2);
    ctx.fillStyle = IC_STROKE;
    ctx.fill();

    // Pin 1 notch
    ctx.beginPath();
    ctx.arc(x, cy, 3, -Math.PI / 2, Math.PI / 2);
    ctx.strokeStyle = IC_STROKE;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Pins
    var pinSpacing = h / (pins + 1);
    for (var i = 1; i <= pins; i++) {
      var py = y + i * pinSpacing;
      ctx.fillStyle = PAD_FILL;
      ctx.strokeStyle = COPPER;
      ctx.lineWidth = 0.6;
      // Left
      ctx.fillRect(x - 10, py - 2, 10, 4);
      ctx.strokeRect(x - 10, py - 2, 10, 4);
      // Right
      ctx.fillRect(x + w, py - 2, 10, 4);
      ctx.strokeRect(x + w, py - 2, 10, 4);
    }

    if (label) {
      ctx.fillStyle = SILK;
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, cy);
    }
  }

  // ── QFP Package ─────────────────────────────────────────────────

  function drawQFP(cx, cy, size, pinsPerSide, label) {
    var half = size / 2;
    var x = cx - half;
    var y = cy - half;
    var pinLen = 8;
    var pinW = 3;

    ctx.fillStyle = IC_FILL;
    ctx.strokeStyle = IC_STROKE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 5);
    ctx.fill();
    ctx.stroke();

    // Inner die
    var inset = size * 0.22;
    ctx.strokeStyle = 'rgba(184,115,51,0.22)';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(x + inset, y + inset, size - inset * 2, size - inset * 2);

    // Orientation dot
    ctx.beginPath();
    ctx.arc(x + 8, y + 8, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = IC_STROKE;
    ctx.fill();

    // Pins on 4 sides
    var spacing = size / (pinsPerSide + 1);
    for (var i = 1; i <= pinsPerSide; i++) {
      var offset = i * spacing;
      ctx.fillStyle = PAD_FILL;
      ctx.strokeStyle = COPPER;
      ctx.lineWidth = 0.5;
      // Top
      ctx.fillRect(x + offset - pinW / 2, y - pinLen, pinW, pinLen);
      ctx.strokeRect(x + offset - pinW / 2, y - pinLen, pinW, pinLen);
      // Bottom
      ctx.fillRect(x + offset - pinW / 2, y + size, pinW, pinLen);
      ctx.strokeRect(x + offset - pinW / 2, y + size, pinW, pinLen);
      // Left
      ctx.fillRect(x - pinLen, y + offset - pinW / 2, pinLen, pinW);
      ctx.strokeRect(x - pinLen, y + offset - pinW / 2, pinLen, pinW);
      // Right
      ctx.fillRect(x + size, y + offset - pinW / 2, pinLen, pinW);
      ctx.strokeRect(x + size, y + offset - pinW / 2, pinLen, pinW);
    }

    if (label) {
      ctx.fillStyle = SILK;
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, cy);
    }
  }

  // ── SMD Component ───────────────────────────────────────────────

  function drawSMD(cx, cy, isVertical) {
    ctx.fillStyle = PAD_FILL;
    ctx.strokeStyle = COPPER;
    ctx.lineWidth = 0.5;
    if (isVertical) {
      ctx.fillRect(cx - 3, cy - 7, 6, 4);
      ctx.strokeRect(cx - 3, cy - 7, 6, 4);
      ctx.fillRect(cx - 3, cy + 3, 6, 4);
      ctx.strokeRect(cx - 3, cy + 3, 6, 4);
    } else {
      ctx.fillRect(cx - 7, cy - 3, 4, 6);
      ctx.strokeRect(cx - 7, cy - 3, 4, 6);
      ctx.fillRect(cx + 3, cy - 3, 4, 6);
      ctx.strokeRect(cx + 3, cy - 3, 4, 6);
    }
    ctx.strokeStyle = SILK;
    ctx.lineWidth = 0.8;
    if (isVertical) {
      ctx.strokeRect(cx - 2.5, cy - 3, 5, 6);
    } else {
      ctx.strokeRect(cx - 3, cy - 2.5, 6, 5);
    }
  }

  // ── Capacitor ───────────────────────────────────────────────────

  function drawCap(cx, cy) {
    ctx.fillStyle = PAD_FILL;
    ctx.strokeStyle = COPPER;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.arc(cx - 5, cy, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 5, cy, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = SILK;
    ctx.lineWidth = 0.6;
    ctx.strokeRect(cx - 4, cy - 3, 8, 6);
  }

  // ── Render ──────────────────────────────────────────────────────

  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Content area boundaries (1200px max-width centered)
    var contentW = Math.min(1200, W - 48);
    var contentL = (W - contentW) / 2;
    var contentR = contentL + contentW;

    // Hero area height (header 64px + hero ~400px)
    var heroBottom = 460;

    // Gutter widths
    var gutterL = contentL;
    var gutterR = W - contentR;

    var isMobile = W < 768;

    // ── MOBILE: ICs and components along borders ──
    if (isMobile) {
      var mTeal = 'rgba(234,88,12,0.10)';

      // Left border: vertical bus + ICs
      var lEdge = 18;
      line(lEdge, 0, lEdge, H, COPPER, 1.2);
      drawIC(lEdge, H * 0.18, 34, 24, 3, 'DAC');
      drawIC(lEdge, H * 0.48, 34, 24, 3, 'CLK');
      drawIC(lEdge, H * 0.78, 34, 24, 3, 'MEM');
      drawSMD(lEdge, H * 0.33, true);
      drawSMD(lEdge, H * 0.63, true);
      drawCap(lEdge, H * 0.18 + 20);
      drawCap(lEdge, H * 0.48 + 20);
      via(lEdge, H * 0.1, 3);
      via(lEdge, H * 0.38, 3);
      via(lEdge, H * 0.58, 3);
      via(lEdge, H * 0.88, 3);

      // Right border: vertical bus + ICs
      var rEdge = W - 18;
      line(rEdge, 0, rEdge, H, COPPER, 1.2);
      drawIC(rEdge, H * 0.25, 34, 24, 3, 'ADC');
      drawIC(rEdge, H * 0.55, 34, 24, 3, 'MUX');
      drawIC(rEdge, H * 0.85, 34, 24, 3, 'QPU');
      drawSMD(rEdge, H * 0.4, true);
      drawSMD(rEdge, H * 0.7, true);
      drawCap(rEdge, H * 0.25 + 20);
      drawCap(rEdge, H * 0.55 + 20);
      via(rEdge, H * 0.15, 3);
      via(rEdge, H * 0.45, 3);
      via(rEdge, H * 0.65, 3);
      via(rEdge, H * 0.92, 3);

      // Short L-bend traces from ICs toward content (not full-width)
      // Left side
      line(lEdge + 17, H * 0.18, lEdge + 35, H * 0.18, mTeal, 0.8);
      line(lEdge + 35, H * 0.18, lEdge + 35, H * 0.18 + 20, mTeal, 0.8);
      via(lEdge + 35, H * 0.18 + 20, 2.5);
      line(lEdge + 17, H * 0.48, lEdge + 30, H * 0.48, mTeal, 0.8);
      line(lEdge + 30, H * 0.48, lEdge + 30, H * 0.48 - 15, mTeal, 0.8);
      via(lEdge + 30, H * 0.48 - 15, 2.5);
      // Right side
      line(rEdge - 17, H * 0.25, rEdge - 35, H * 0.25, mTeal, 0.8);
      line(rEdge - 35, H * 0.25, rEdge - 35, H * 0.25 + 20, mTeal, 0.8);
      via(rEdge - 35, H * 0.25 + 20, 2.5);
      line(rEdge - 17, H * 0.55, rEdge - 30, H * 0.55, mTeal, 0.8);
      line(rEdge - 30, H * 0.55, rEdge - 30, H * 0.55 - 15, mTeal, 0.8);
      via(rEdge - 30, H * 0.55 - 15, 2.5);
    }

    // ── LEFT GUTTER: Vertical bus + ICs ──
    if (!isMobile && gutterL > 40) {
      var lx = gutterL * 0.5;  // center of left gutter

      // Main vertical bus
      line(lx, 0, lx, H, COPPER_BOLD, 2.5);

      // Horizontal stubs reaching toward content edge
      var stubEnd = Math.min(lx + gutterL * 0.4, contentL - 10);
      var ySpacing = H / 5;

      for (var i = 1; i < 5; i++) {
        var sy = Math.round(ySpacing * i);
        line(lx, sy, stubEnd, sy, COPPER, 1.5);
        via(lx, sy, 5);
        via(stubEnd, sy, 4);
      }

      // ICs in left gutter
      if (gutterL > 80) {
        drawIC(lx, H * 0.2, 50, 34, 4, 'DAC');
        drawIC(lx, H * 0.5, 50, 34, 4, 'CLK');
        drawIC(lx, H * 0.8, 50, 34, 4, 'MEM');

        // SMDs and caps near ICs
        drawSMD(lx, H * 0.35, true);
        drawSMD(lx, H * 0.65, true);
        drawCap(lx + 20, H * 0.2 + 24);
        drawCap(lx + 20, H * 0.5 + 24);
        drawCap(lx - 20, H * 0.8 - 24);

        // L-bend signal traces
        line(lx + 35, H * 0.2, stubEnd, H * 0.2, TEAL, 1);
        line(stubEnd, H * 0.2, stubEnd, H * 0.2 + 30, TEAL, 1);
        via(stubEnd, H * 0.2 + 30, 3);

        line(lx + 35, H * 0.5, stubEnd, H * 0.5, TEAL, 1);
        line(stubEnd, H * 0.5, stubEnd, H * 0.5 - 25, TEAL, 1);
        via(stubEnd, H * 0.5 - 25, 3);

        // Silkscreen labels
        ctx.fillStyle = SILK;
        ctx.font = '500 7px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('R1', lx, H * 0.35 + 16);
        ctx.fillText('R2', lx, H * 0.65 + 16);
        ctx.fillText('C1', lx + 20, H * 0.2 + 36);
      }

      // Secondary vertical trace
      if (gutterL > 60) {
        var lx2 = lx + gutterL * 0.3;
        line(lx2, H * 0.1, lx2, H * 0.9, COPPER, 1);
        via(lx2, H * 0.15, 3.5);
        via(lx2, H * 0.45, 3.5);
        via(lx2, H * 0.75, 3.5);
      }
    }

    // ── RIGHT GUTTER: Vertical bus + ICs ──
    if (!isMobile && gutterR > 40) {
      var rx = contentR + gutterR * 0.5;

      // Main vertical bus
      line(rx, 0, rx, H, COPPER_BOLD, 2.5);

      // Horizontal stubs reaching toward content edge
      var rstubEnd = Math.max(rx - gutterR * 0.4, contentR + 10);

      for (var j = 1; j < 5; j++) {
        var rsy = Math.round(ySpacing * j);
        line(rx, rsy, rstubEnd, rsy, COPPER, 1.5);
        via(rx, rsy, 5);
        via(rstubEnd, rsy, 4);
      }

      // ICs in right gutter
      if (gutterR > 80) {
        drawIC(rx, H * 0.25, 50, 34, 4, 'ADC');
        drawIC(rx, H * 0.55, 50, 34, 4, 'MUX');
        drawQFP(rx, H * 0.82, 55, 4, 'QPU');

        // SMDs and caps
        drawSMD(rx, H * 0.4, true);
        drawSMD(rx, H * 0.68, true);
        drawCap(rx - 20, H * 0.25 + 24);
        drawCap(rx - 20, H * 0.55 + 24);

        // L-bend signal traces
        line(rx - 35, H * 0.25, rstubEnd, H * 0.25, TEAL, 1);
        line(rstubEnd, H * 0.25, rstubEnd, H * 0.25 - 20, TEAL, 1);
        via(rstubEnd, H * 0.25 - 20, 3);

        line(rx - 35, H * 0.55, rstubEnd, H * 0.55, TEAL, 1);
        line(rstubEnd, H * 0.55, rstubEnd, H * 0.55 + 30, TEAL, 1);
        via(rstubEnd, H * 0.55 + 30, 3);

        // Labels
        ctx.fillStyle = SILK;
        ctx.font = '500 7px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('R3', rx, H * 0.4 + 16);
        ctx.fillText('C2', rx - 20, H * 0.25 + 36);
      }

      // Secondary vertical trace
      if (gutterR > 60) {
        var rx2 = rx - gutterR * 0.3;
        line(rx2, H * 0.1, rx2, H * 0.9, COPPER, 1);
        via(rx2, H * 0.2, 3.5);
        via(rx2, H * 0.5, 3.5);
        via(rx2, H * 0.85, 3.5);
      }
    }

    // ── TOP EDGE: Horizontal bus ──
    var topY = 20;
    line(0, topY, W, topY, COPPER_BOLD, 2);
    // Ground stitching vias along top
    var edgeSpX = Math.max(70, W * 0.07);
    for (var ex = edgeSpX; ex < W; ex += edgeSpX) {
      via(ex, topY, 3);
    }

    // ── BOTTOM EDGE: Horizontal bus ──
    var botY = H - 20;
    line(0, botY, W, botY, COPPER_BOLD, 2);
    for (var bx = edgeSpX * 0.5; bx < W; bx += edgeSpX) {
      via(bx, botY, 3);
    }

    // ── Cross-connections between gutters (very top and very bottom only) ──
    // Top: connect left gutter to right gutter above content
    if (!isMobile && gutterL > 40 && gutterR > 40) {
      var crossY1 = 50;
      line(0, crossY1, W, crossY1, COPPER, 1);
      via(gutterL * 0.5, crossY1, 3.5);
      via(contentR + gutterR * 0.5, crossY1, 3.5);
      via(W * 0.35, crossY1, 3);
      via(W * 0.65, crossY1, 3);

      // Bottom cross
      var crossY2 = H - 50;
      line(0, crossY2, W, crossY2, COPPER, 1);
      via(gutterL * 0.5, crossY2, 3.5);
      via(contentR + gutterR * 0.5, crossY2, 3.5);
      via(W * 0.4, crossY2, 3);
      via(W * 0.6, crossY2, 3);
    }

    // ── Edge ground stitching (left and right borders) ──
    var edgeSpY = Math.max(70, H * 0.07);
    for (var ey = edgeSpY; ey < H; ey += edgeSpY) {
      via(12, ey, 3);
      via(W - 12, ey, 3);
    }

    // ── Clear the hero content zone so wireframe sits cleanly ──
    // Fade out traces behind the hero area with a soft gradient mask
    if (!isMobile) {
      var heroGrad = ctx.createLinearGradient(contentL, 0, contentL, heroBottom + 40);
      heroGrad.addColorStop(0, 'rgba(255,255,255,1)');
      heroGrad.addColorStop(0.85, 'rgba(255,255,255,0.95)');
      heroGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = heroGrad;
      ctx.fillRect(contentL - 20, 0, contentW + 40, heroBottom + 40);
    }
  }

  // ── Events ──────────────────────────────────────────────────────
  var resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      setupCanvas();
      render();
    }, 250);
  }

  // ── Init ────────────────────────────────────────────────────────
  function init() {
    createCanvas();
    setupCanvas();
    render();
    window.addEventListener('resize', onResize);
    document.body.classList.add('quantum-bg-active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
