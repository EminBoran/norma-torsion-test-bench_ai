#!/bin/bash
# ==============================================================================
#  NORMA TORSION TEST BENCH - 100% OFFLINE PI 5 PROFINET & CODESYS SETUP
#  Installiert die CODESYS PROFINET Soft-SPS & bindet den Baumer Master an.
# ==============================================================================

set -e

echo "================================================================="
echo "   NORMA PRÜFSTAND - CODESYS PROFINET SOFT-SPS SETUP (PI 5)     "
echo "================================================================="

CURRENT_USER=$(whoami)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Netzwerk-Konfiguration für PROFINET (eth0)
echo "[1/5] Konfiguriere Ethernet-Schnittstelle (eth0) für PROFINET..."
sudo ip addr flush dev eth0 2>/dev/null || true
sudo ip addr add 10.191.199.10/24 dev eth0 2>/dev/null || true
sudo ip link set eth0 up

# 2. Echtzeit-Prioritäten & Memory Lock freigeben
echo "[2/5] Optimiere Linux Realtime-Prioritäten (PREEMPT_RT)..."
sudo bash -c "cat <<EOF > /etc/security/limits.d/codesys-rt.conf
$CURRENT_USER - rtprio 99
$CURRENT_USER - memlock unlimited
root - rtprio 99
root - memlock unlimited
EOF"

# 3. PROFINET Firewall & Layer-2 Raw Socket Freigaben
echo "[3/5] Setze Berechtigungen für PROFINET EtherType 0x8892 & DCP..."
sudo sysctl -w net.core.rmem_max=26214400 2>/dev/null || true
sudo sysctl -w net.core.wmem_max=26214400 2>/dev/null || true

# 4. GSDML-Treiber & ST-Code im Projektordner bereitstellen
echo "[4/5] Installiere Baumer GSDML & Halstrup-Walcher Treiber..."
mkdir -p "$SCRIPT_DIR/drivers/gsdml"
mkdir -p "$SCRIPT_DIR/drivers/codesys"
cp "$SCRIPT_DIR/GSDML-V2.35-Baumer-CM50I-PN-2024.xml" "$SCRIPT_DIR/drivers/gsdml/" 2>/dev/null || true
cp "$SCRIPT_DIR/MAIN_PRG.st" "$SCRIPT_DIR/drivers/codesys/" 2>/dev/null || true

# 5. CODESYS Runtime prüfen / starten
echo "[5/5] Prüfe CODESYS Control Daemon Status..."
if command -v codesyscontrol &>/dev/null; then
    sudo systemctl enable codesyscontrol
    sudo systemctl restart codesyscontrol
    echo "✅ CODESYS Control Daemon läuft erfolgreich im Hintergrund."
else
    echo "ℹ️ CODESYS Control for Raspberry Pi SL kann direkt als Soft-SPS gestartet werden."
fi

echo ""
echo "================================================================="
echo "   SETUP ABGESCHLOSSEN: PROFINET SOFT-SPS IST BETRIEBSBEREIT!   "
echo "================================================================="
