import { app, BrowserWindow, ipcMain, shell, Menu } from "electron";
import path from "path";
import fs from "fs";
import { BOLT_APP_URL, BOLT_PROTOCOL, IPC } from "./constants";
import { hardenSession, hardenWebContents, isTrustedOrigin } from "./security";
import { createPendingAuthState, parseAuthCallback, findDeepLinkInArgv } from "./deepLink";
import { initAutoUpdater, checkForUpdatesSafely, quitAndInstallUpdate } from "./updater";
import logger from "./logger";

const isDev = !app.isPackaged;
const RENDERER_DIR = path.join(__dirname, "renderer");

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

// ---------------------------------------------------------------------------
// Single instance lock + deep link (bolt://auth-callback) handling.
// Windows/Linux deliver a second launch's deep link as an argv entry via
// 'second-instance'; macOS uses the 'open-url' app event instead.
// ---------------------------------------------------------------------------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    const link = findDeepLinkInArgv(argv);
    if (link) handleDeepLink(link);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.on("open-url", (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

function handleDeepLink(rawUrl: string): void {
  const result = parseAuthCallback(rawUrl);
  if (!result) return;
  mainWindow?.webContents.send(IPC.AUTH_TOKEN, result.token);
  mainWindow?.show();
  mainWindow?.focus();
}

// ---------------------------------------------------------------------------
// Window creation
// ---------------------------------------------------------------------------
function createSplashWindow(): void {
  splashWindow = new BrowserWindow({
    width: 380,
    height: 260,
    frame: false,
    resizable: false,
    movable: true,
    show: true,
    backgroundColor: "#0b0f17",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  splashWindow.loadFile(path.join(RENDERER_DIR, "splash.html"));
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: "#0b0f17",
    title: "BOLT",
    icon: path.join(__dirname, "..", "build", "icons", "icon.ico"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      spellcheck: true,
    },
  });

  Menu.setApplicationMenu(null);
  hardenWebContents(mainWindow.webContents);

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, _desc, validatedURL, isMainFrame) => {
    if (!isMainFrame) return;
    const connectivityErrors = new Set([-2, -6, -7, -21, -105, -106, -109, -118]);
    if (connectivityErrors.has(errorCode) || isTrustedOrigin(validatedURL)) {
      loadOfflinePage();
    }
  });

  mainWindow.webContents.on("did-finish-load", () => {
    if (mainWindow?.webContents.getURL().startsWith(BOLT_APP_URL)) {
      splashWindow?.close();
      splashWindow = null;
      mainWindow?.show();
    }
  });

  // The bundled crash page's "Restart BOLT" button navigates to this sentinel
  // URL rather than needing its own preload/IPC wiring.
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url === "bolt-internal://restart") {
      event.preventDefault();
      app.relaunch();
      app.exit(0);
    }
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    logger.error("Renderer process gone:", details.reason);
    loadCrashPage();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadURL(BOLT_APP_URL);
}

function loadOfflinePage(): void {
  mainWindow?.loadFile(path.join(RENDERER_DIR, "offline.html"));
  mainWindow?.show();
  splashWindow?.close();
  splashWindow = null;
}

function loadCrashPage(): void {
  mainWindow?.loadFile(path.join(RENDERER_DIR, "crash.html"));
  mainWindow?.show();
}

// ---------------------------------------------------------------------------
// IPC handlers (the only privileged operations the renderer can trigger —
// see electron/preload.ts for the matching contextBridge surface)
// ---------------------------------------------------------------------------
ipcMain.handle(IPC.AUTH_START_GOOGLE, async () => {
  const state = createPendingAuthState();
  const authUrl = `${BOLT_APP_URL}/desktop-auth.html?state=${encodeURIComponent(state)}`;
  await shell.openExternal(authUrl);
  return state;
});

ipcMain.on(IPC.SHELL_OPEN_EXTERNAL, (_event, url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      shell.openExternal(url);
    }
  } catch {
    // ignore malformed URLs from the renderer
  }
});

ipcMain.handle(IPC.CONNECTIVITY_GET, () => ({ online: true }));

ipcMain.on(IPC.UPDATE_CHECK, () => checkForUpdatesSafely());
ipcMain.on(IPC.UPDATE_INSTALL, () => quitAndInstallUpdate());

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
function registerProtocolClient(): void {
  if (isDev && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(BOLT_PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient(BOLT_PROTOCOL);
  }
}

app.whenReady().then(() => {
  registerProtocolClient();
  hardenSession();
  createSplashWindow();
  createMainWindow();
  initAutoUpdater(() => mainWindow);

  // Cold-start deep link on Windows/Linux (app wasn't already running).
  const coldStartLink = findDeepLinkInArgv(process.argv);
  if (coldStartLink) handleDeepLink(coldStartLink);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

process.on("uncaughtException", (err) => {
  logger.error("uncaughtException:", err.message, err.stack);
  if (mainWindow && !mainWindow.isDestroyed()) loadCrashPage();
});

process.on("unhandledRejection", (reason: any) => {
  logger.error("unhandledRejection:", reason?.message || String(reason));
});

// Diagnostics location, surfaced in Settings → About BOLT in the web app if
// it chooses to read it (not required for this shell to function).
export const logsDirectory = path.join(app.getPath("userData"), "logs");
if (!fs.existsSync(logsDirectory)) {
  try {
    fs.mkdirSync(logsDirectory, { recursive: true });
  } catch {
    /* best-effort */
  }
}
