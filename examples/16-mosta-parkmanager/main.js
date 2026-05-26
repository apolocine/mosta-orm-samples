const { app, BrowserWindow, dialog, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const selfsigned = require('selfsigned');

// Configuration
const APP_NAME = 'Mosta ParkManager';
const SERVER_PORT = 4567;

let mainWindow;
let nextServer = null;
let serverUrl = `http://localhost:${SERVER_PORT}`;

// Detecter l'IP LAN de la machine
function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

// Generer ou reutiliser un certificat auto-signe
function getOrGenerateCert() {
  const certsDir = path.join(app.getPath('userData'), 'certs');
  const keyPath = path.join(certsDir, 'key.pem');
  const certPath = path.join(certsDir, 'cert.pem');
  const ipPath = path.join(certsDir, 'ip.txt');

  const lanIp = getLanIp();
  console.log(`[MAIN] LAN IP detectee: ${lanIp || 'aucune'}`);

  // Verifier si un certificat existe deja pour cette IP
  if (fs.existsSync(keyPath) && fs.existsSync(certPath) && fs.existsSync(ipPath)) {
    const savedIp = fs.readFileSync(ipPath, 'utf8').trim();
    if (savedIp === (lanIp || '')) {
      console.log('[MAIN] Certificat existant reutilise');
      return { keyPath, certPath, lanIp };
    }
    console.log(`[MAIN] IP changee (${savedIp} -> ${lanIp}), regeneration du certificat...`);
  }

  // Generer un nouveau certificat
  console.log('[MAIN] Generation d\'un nouveau certificat auto-signe...');
  const altNames = [
    { type: 2, value: 'localhost' },
    { type: 7, ip: '127.0.0.1' }
  ];
  if (lanIp) {
    altNames.push({ type: 7, ip: lanIp });
  }

  const pems = selfsigned.generate(
    [{ name: 'commonName', value: 'MostaParkManager' }],
    {
      keySize: 2048,
      days: 365,
      algorithm: 'sha256',
      extensions: [
        { name: 'subjectAltName', altNames }
      ]
    }
  );

  // Sauvegarder
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }
  fs.writeFileSync(keyPath, pems.private);
  fs.writeFileSync(certPath, pems.cert);
  fs.writeFileSync(ipPath, lanIp || '');

  console.log('[MAIN] Certificat genere et sauvegarde');
  return { keyPath, certPath, lanIp };
}

// Determiner les chemins selon l'environnement
function getAppPath() {
  // En production (packaged): le standalone est dans resources/app
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app');
  }
  // En dev: le standalone est dans .next/standalone
  return path.join(__dirname, '.next', 'standalone');
}

// Lancer le serveur Next.js standalone
function startServer() {
  return new Promise((resolve, reject) => {
    const appPath = getAppPath();
    const serverJs = path.join(appPath, 'server.js');

    if (!fs.existsSync(serverJs)) {
      reject(new Error(`server.js introuvable: ${serverJs}\nLancez d'abord: npm run build`));
      return;
    }

    // Generer/reutiliser le certificat HTTPS
    const { keyPath, certPath, lanIp } = getOrGenerateCert();
    const host = lanIp || 'localhost';
    serverUrl = `https://${host}:${SERVER_PORT}`;
    console.log(`[MAIN] Server URL: ${serverUrl}`);

    const env = Object.assign({}, process.env, {
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      PORT: String(SERVER_PORT),
      HOSTNAME: '0.0.0.0',
      HTTPS_KEY_PATH: keyPath,
      HTTPS_CERT_PATH: certPath
    });

    // Charger .env.local si present dans le dossier app
    const envLocalPath = path.join(appPath, '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const envContent = fs.readFileSync(envLocalPath, 'utf8');
      envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          const eqIdx = line.indexOf('=');
          if (eqIdx > 0) {
            const key = line.substring(0, eqIdx).trim();
            const value = line.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            if (!env[key]) {
              env[key] = value;
            }
          }
        }
      });
    }

    console.log(`[MAIN] Starting Next.js server from: ${serverJs}`);
    console.log(`[MAIN] Port: ${SERVER_PORT}`);

    nextServer = spawn(process.execPath, [serverJs], {
      cwd: appPath,
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let started = false;

    nextServer.stdout.on('data', (data) => {
      const msg = data.toString();
      console.log('[NEXT]', msg.trim());
      if (!started && (msg.includes('Ready') || msg.includes('ready') || msg.includes(String(SERVER_PORT)) || msg.includes('listening'))) {
        started = true;
        resolve();
      }
    });

    nextServer.stderr.on('data', (data) => {
      console.error('[NEXT ERR]', data.toString().trim());
    });

    nextServer.on('error', (err) => {
      console.error('[MAIN] Failed to start Next.js:', err);
      reject(err);
    });

    nextServer.on('exit', (code) => {
      console.log(`[MAIN] Next.js exited with code ${code}`);
      nextServer = null;
    });

    // Timeout: si le serveur ne demarre pas en 20s, on essaie quand meme
    setTimeout(() => {
      if (!started) {
        console.log('[MAIN] Timeout atteint, tentative de chargement...');
        started = true;
        resolve();
      }
    }, 20000);
  });
}

function stopServer() {
  if (nextServer) {
    console.log('[MAIN] Stopping Next.js server...');
    nextServer.kill('SIGTERM');
    nextServer = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
    backgroundColor: '#0f172a',
    title: APP_NAME
  });

  // Menu
  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Recharger',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow && mainWindow.reload()
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        {
          label: 'Outils de developpement',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow && mainWindow.webContents.toggleDevTools()
        },
        {
          label: 'Plein ecran',
          accelerator: 'F11',
          click: () => mainWindow && mainWindow.setFullScreen(!mainWindow.isFullScreen())
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  // Charger le serveur avec retry
  const loadServer = () => {
    mainWindow.loadURL(serverUrl).catch(() => {
      setTimeout(loadServer, 2000);
    });
  };

  loadServer();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    event.preventDefault();
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['Oui', 'Non'],
      defaultId: 1,
      title: `Fermer ${APP_NAME}`,
      message: `Voulez-vous fermer ${APP_NAME} ?`,
      detail: 'Le serveur sera arrete.'
    });
    if (choice === 0) {
      mainWindow.destroy();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Accepter le certificat auto-signe dans Electron
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true);
});

// App lifecycle
app.whenReady().then(async () => {
  console.log(`[MAIN] Starting ${APP_NAME}...`);

  try {
    await startServer();
    console.log('[MAIN] Server started, opening window...');
  } catch (err) {
    console.error('[MAIN] Server start error:', err.message);
    dialog.showErrorBox(
      `${APP_NAME} - Erreur de demarrage`,
      `Impossible de demarrer le serveur:\n${err.message}`
    );
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopServer();
  app.quit();
});

app.on('before-quit', () => {
  stopServer();
});
