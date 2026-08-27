#!/bin/bash
# ==============================================================================
#  NORMA TORSION TEST BENCH - AUTOMATISCHES SETUP FÜR RASPBERRY PI 5
#  Unterstützt: Raspberry Pi OS / Debian 12 (Bookworm) / Debian 13
# ==============================================================================

set -e

echo "================================================================="
echo "   NORMA TORSIONS-PRÜFSTAND - INSTALLATION AUF RASPBERRY PI 5   "
echo "================================================================="
echo ""

CURRENT_USER=$(whoami)
INSTALL_DIR="/home/$CURRENT_USER/norma-pruefstand"

echo "[1/7] Aktualisiere Paketquellen und installiere System-Tools..."
sudo apt update -y
sudo apt install -y curl wget git build-essential sqlite3 unzip chromium-browser gpiod libgpiod-dev

echo ""
echo "[2/7] Installiere Node.js LTS (v20.x)..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js ist bereits installiert: $(node -v)"
fi

echo "Node Version: $(node -v)"
echo "NPM Version:  $(npm -v)"

echo ""
echo "[3/7] Richte Projektverzeichnis ein: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

# Wenn das Skript bereits im Projektverzeichnis liegt, kopieren/nutzen wir dieses
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ "$SCRIPT_DIR" != "$INSTALL_DIR" ] && [ -f "$SCRIPT_DIR/package.json" ]; then
    echo "Kopiere Projektdateien von $SCRIPT_DIR nach $INSTALL_DIR..."
    cp -r "$SCRIPT_DIR"/* "$INSTALL_DIR"/ 2>/dev/null || true
    cp "$SCRIPT_DIR"/.env.example "$INSTALL_DIR"/.env 2>/dev/null || true
fi

cd "$INSTALL_DIR"

echo ""
echo "[4/8] Optimiere Linux Realtime & PROFINET Schnittstelle (eth0)..."
if [ -f "$INSTALL_DIR/setup_pi5_profinet_codesys.sh" ]; then
    chmod +x "$INSTALL_DIR/setup_pi5_profinet_codesys.sh"
    sudo "$INSTALL_DIR/setup_pi5_profinet_codesys.sh" || true
fi

echo ""
echo "[5/8] Installiere NPM-Abhängigkeiten..."
npm install

echo ""
echo "[6/8] Kompiliere Anwendung für Produktion..."
npm run build

echo ""
echo "[7/8] Erstelle systemd Autostart-Dienst (Hintergrund-Service)..."
SERVICE_FILE="/etc/systemd/system/norma-pruefstand.service"

sudo bash -c "cat <<EOF > $SERVICE_FILE
[Unit]
Description=Norma Torsion Test Bench Service
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$(which npm) start
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF"

sudo systemctl daemon-reload
sudo systemctl enable norma-pruefstand
sudo systemctl restart norma-pruefstand

echo "Dienst 'norma-pruefstand' wurde eingerichtet und gestartet."

echo ""
echo "[7/7] Richte Chromium Kiosk-Modus für Waveshare Touchscreen ein..."

# 1. Wayfire Autostart (Raspberry Pi OS Wayland Default)
WAYFIRE_CONFIG="/home/$CURRENT_USER/.config/wayfire.ini"
if [ -f "$WAYFIRE_CONFIG" ] || [ -d "/home/$CURRENT_USER/.config" ]; then
    mkdir -p "/home/$CURRENT_USER/.config"
    if ! grep -q "norma_kiosk" "$WAYFIRE_CONFIG" 2>/dev/null; then
        echo "" >> "$WAYFIRE_CONFIG"
        echo "[autostart]" >> "$WAYFIRE_CONFIG"
        echo "norma_kiosk = chromium-browser --kiosk --app=http://localhost:3000 --noerrdialogs --disable-infobars --check-for-update-interval=31536000" >> "$WAYFIRE_CONFIG"
        echo "Wayfire Kiosk Autostart hinzugefügt."
    fi
fi

# 2. Labwc Autostart (Debian Wayland)
LABWC_AUTOSTART="/home/$CURRENT_USER/.config/labwc/autostart"
mkdir -p "/home/$CURRENT_USER/.config/labwc"
if ! grep -q "localhost:3000" "$LABWC_AUTOSTART" 2>/dev/null; then
    echo "chromium-browser --kiosk --app=http://localhost:3000 --noerrdialogs --disable-infobars &" >> "$LABWC_AUTOSTART"
    echo "Labwc Kiosk Autostart hinzugefügt."
fi

# 3. Desktop Entry Fallback
DESKTOP_AUTOSTART="/home/$CURRENT_USER/.config/autostart/norma-kiosk.desktop"
mkdir -p "/home/$CURRENT_USER/.config/autostart"
cat <<EOF > "$DESKTOP_AUTOSTART"
[Desktop Entry]
Type=Application
Name=Norma Test Bench Kiosk
Exec=chromium-browser --kiosk --app=http://localhost:3000 --noerrdialogs --disable-infobars
X-GNOME-Autostart-enabled=true
EOF

echo ""
echo "================================================================="
echo "   INSTALLATION ERFOLGREICH ABGESCHLOSSEN!                     "
echo "================================================================="
echo "Status des Hintergrund-Dienstes: sudo systemctl status norma-pruefstand"
echo "Live-Logs ansehen:               journalctl -u norma-pruefstand -f"
echo "Browser im Kiosk öffnen:         http://localhost:3000"
echo "================================================================="
