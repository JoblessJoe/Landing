const http = require("http");

const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>joblessjoe</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 2rem;
      background: #0a0e14;
      color: #ffffff;
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
      overflow: hidden;
    }
    canvas {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 0;
    }
    .content {
      position: relative;
      z-index: 1;
    }
    .logo {
      width: 80vw;
      max-width: 900px;
      height: auto;
      filter: brightness(2.7) drop-shadow(0 7px 12px rgba(255, 255, 255, 0.223));
      overflow: visible;
      margin-top: 80px;
      margin-bottom: clamp(1rem, 3vw, 2rem);
    }
    h1 {
      font-size: clamp(2rem, 5vw, 4rem);
      margin-bottom: 0.5rem;
      margin-top: 200px;
    }
    p {
      opacity: 0.8;
      font-size: clamp(1rem, 2.5vw, 1.8rem);
    }
    .etsy-link {
      margin-top: 2.5rem;
    }
    .etsy-link a {
      display: inline-block;
      padding: 0.8rem 2rem;
      font-size: clamp(1rem, 2.5vw, 1.3rem);
      font-weight: bold;
      color: #fff;
      background: linear-gradient(135deg, #f56400, #f0a040);
      border-radius: 50px;
      text-decoration: none;
      box-shadow: 0 4px 18px rgba(245, 100, 0, 0.35);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .etsy-link a:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(245, 100, 0, 0.5);
    }
  </style>
</head>
<body>
  <canvas id="bg"></canvas>
  <div class="content">
    <svg class="logo" xmlns="http://www.w3.org/2000/svg" viewBox="30 520 530 170">
      <defs>
        <style>
          .cls-1 { fill: #354f7b; }
          .cls-1, .cls-2 { stroke: #19233d; stroke-miterlimit: 10; stroke-width: 4px; }
          .cls-2 { fill: none; }
          .cls-3 { fill: #19233d; font-family: ArialRoundedMTBold, 'Arial Rounded MT Bold'; font-size: 90px; letter-spacing: -.04em; }
        </style>
      </defs>
      <path class="cls-1" d="M170.89,657.71l-11.84-3.94c-8.94-2.97-17.64,5.06-15.4,14.21l2.97,12.11-9.43-8.17c-7.12-6.16-18.24-2.07-19.67,7.23l-1.89,12.33-5.59-11.15c-4.22-8.42-16.06-8.9-20.94-.84l-6.46,10.67-.89-12.44c-.67-9.39-11.43-14.36-19.02-8.79l-10.05,7.38,3.94-11.84c2.97-8.94-5.06-17.64-14.21-15.4l-12.11,2.97,8.17-9.43c6.16-7.12,2.07-18.24-7.23-19.67l-12.33-1.89,11.15-5.59c8.42-4.22,8.9-16.06.84-20.94l-10.67-6.46,12.44-.89c9.39-.67,14.36-11.43,8.79-19.02l-7.38-10.05,11.84,3.94c8.94,2.97,17.64-5.06,15.4-14.21l-2.97-12.11,9.43,8.17c7.12,6.16,18.24,2.07,19.67-7.23l1.89-12.33,5.59,11.15c4.22,8.42,16.06,8.9,20.94.84l6.46-10.67,1.01,14.15c1.07,5.45,7.59,6.89,10.82,2.37l6.45-9.35.54,11.56c.39,2.72,3.79,3.6,5.59,1.35l3.55-4.52.18,12.25c-11.88-3.25-14.54,4.74-14.54,4.74l-2.42,8.96-3.15-5.57-1.69,13.85-3.88-6.1c-14.26-5.39-18.85-2.9-19.86.24-1.95,5.23,6.51,10.13,13.9,13.29l10.56,3.9-22.25,2.85,21.49,3.84-22.55,10.17,22.74-4.32-13.72,12.41,15.91-7.47-9.33,15.55,11.78-10.98-.88,9.85s3.48-7.18,6.2-12.54c2.42,4.36,21.69,8.77,21.69,8.77,0,0-7.02,1.86-7.88,1.95-4.28,1.53-2.98,6.08.52,6.55l27,5.39-8.95,1.25c-12.08,2.01-13.2,10-7.63,17.6l7.38,10.05Z"/>
      <g>
        <ellipse class="cls-2" cx="168.14" cy="593.87" rx="4.81" ry="4.95"/>
        <path class="cls-2" d="M150.29,552.95c1.36,7.54,4.59,22.03,11.64,31.36,1.59,2.1,3.15,3.66,4.61,4.81"/>
        <path class="cls-2" d="M143.48,609.45c-7.99-3.25-2.22-7.73-1.42-8.22,3.39-2.1,9.03-4.81,24.33-2.78"/>
        <path class="cls-2" d="M138.5,576.38c.04-.15.92-3.42,3.48-4.16,2.23-.65,4.75.9,5.8,3.81"/>
      </g>
      <text class="cls-3" transform="translate(178.75 606.79)"><tspan x="0" y="0">JOBLESS</tspan><tspan x="0" y="68">JOE</tspan></text>
    </svg>
    <h1>🚧Under Construction </h1>
    <p>Sales Software, Tools & Automationen.<br/>Coming soon 🚀</p>
    <p class="etsy-link"><a href="https://itsjoblessjoe.etsy.com" target="_blank">🛒 Zu meinem Etsy Shop</a></p>
 </div>
  <script>
    const c = document.getElementById('bg');
    const ctx = c.getContext('2d');
    let w, h;
    function resize() { w = c.width = innerWidth; h = c.height = innerHeight; }
    resize();
    addEventListener('resize', resize);

    // Swirl particles
    const N = 90;
    const particles = [];
    for (let i = 0; i < N; i++) {
      particles.push({
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        r: Math.random() * 120 + 40,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.003 + 0.001,
      });
    }

    function draw(t) {
      ctx.fillStyle = '#0a0e14';
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        p.phase += p.speed;
        p.x += p.dx + Math.sin(p.phase) * 0.5;
        p.y += p.dy + Math.cos(p.phase * 0.7) * 0.5;

        // wrap around
        if (p.x < -p.r) p.x = w + p.r;
        if (p.x > w + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = h + p.r;
        if (p.y > h + p.r) p.y = -p.r;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grad.addColorStop(0, 'rgba(20,70,90,0.18)');
        grad.addColorStop(0.5, 'rgba(15,55,75,0.08)');
        grad.addColorStop(1, 'rgba(10,14,20,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Large slow swirling blobs for depth
      for (let i = 0; i < 4; i++) {
        const x = w * 0.5 + Math.sin(t * 0.0003 + i * 1.5) * w * 0.35;
        const y = h * 0.5 + Math.cos(t * 0.00025 + i * 2) * h * 0.35;
        const r = Math.min(w, h) * (0.2 + 0.05 * Math.sin(t * 0.0004 + i));
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(18,80,100,0.12)');
        grad.addColorStop(0.6, 'rgba(12,50,70,0.06)');
        grad.addColorStop(1, 'rgba(10,14,20,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  </script>
</body>
</html>
`;

const server = http.createServer((_, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(html);
});

server.listen(3000, "127.0.0.1", () => {
  console.log("Landingpage läuft auf http://127.0.0.1:3000");
});

