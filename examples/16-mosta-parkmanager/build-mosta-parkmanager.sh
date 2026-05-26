#!/bin/bash

# Mosta ParkManager - Build Manager
# Script interactif pour compiler et creer des executables
# Architecture: Next.js 16 standalone + Electron wrapper + MongoDB

set +e

# Charger nvm / forcer Node.js >= 20
if [ -d "$HOME/.nvm/versions/node" ]; then
    NODE20=$(ls -d "$HOME/.nvm/versions/node"/v20* 2>/dev/null | sort -V | tail -1)
    if [ -n "$NODE20" ] && [ -x "$NODE20/bin/node" ]; then
        export PATH="$NODE20/bin:$PATH"
    fi
fi

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
APP_NAME="Mosta ParkManager"
APP_ID="com.mostajs.parkmanager"
PRODUCT_NAME="MostaParkManager"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Turbopack peut creer un sous-dossier nomme d'apres le projet
if [ -f "$SCRIPT_DIR/.next/standalone/server.js" ]; then
    STANDALONE_DIR="$SCRIPT_DIR/.next/standalone"
elif [ -f "$SCRIPT_DIR/.next/standalone/$PRODUCT_NAME/server.js" ]; then
    STANDALONE_DIR="$SCRIPT_DIR/.next/standalone/$PRODUCT_NAME"
else
    STANDALONE_DIR="$SCRIPT_DIR/.next/standalone"
fi
BIN_DIR="$SCRIPT_DIR/bin"
BIN_DIST="$BIN_DIR/dist"
BIN_STANDALONE="$BIN_DIR/standalone"
SERVER_PORT=4567

cd "$SCRIPT_DIR"

# ============================================================
# FONCTIONS UTILITAIRES
# ============================================================

log_info()    { echo -e "${CYAN}   $1${NC}"; }
log_success() { echo -e "${GREEN}   $1${NC}"; }
log_warn()    { echo -e "${YELLOW}   $1${NC}"; }
log_error()   { echo -e "${RED}   $1${NC}"; }
log_step()    { echo -e "${YELLOW}$1${NC}"; }

pause_menu() {
    echo
    echo -ne "${YELLOW}Appuyez sur Entree pour continuer...${NC}"
    read
}

show_header() {
    clear
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}        ${BOLD}BUILD MANAGER - ${YELLOW}Mosta ParkManager${NC}"
    echo -e "${BLUE}============================================================${NC}"
    echo
}

# ============================================================
# [1] VERIFIER L'ENVIRONNEMENT
# ============================================================
check_environment() {
    log_step "Verification de l'environnement..."
    echo
    local all_ok=true

    # Node.js
    if command -v node &> /dev/null; then
        log_success "Node.js: $(node --version)"
    else
        log_error "Node.js non installe"
        all_ok=false
    fi

    # npm
    if command -v npm &> /dev/null; then
        log_success "npm: v$(npm --version)"
    else
        log_error "npm non installe"
        all_ok=false
    fi

    # Wine
    if command -v wine &> /dev/null; then
        log_success "Wine: $(wine --version 2>/dev/null)"
    else
        log_warn "Wine non installe (necessaire pour exe Windows depuis Linux)"
    fi

    # MongoDB
    if pgrep -x mongod > /dev/null 2>&1; then
        log_success "MongoDB: en cours d'execution"
    else
        log_warn "MongoDB: pas en cours d'execution"
    fi

    # Electron
    if [ -d "$SCRIPT_DIR/node_modules/electron" ]; then
        local ev=$(node -e "console.log(require('$SCRIPT_DIR/node_modules/electron/package.json').version)" 2>/dev/null)
        log_success "electron: v${ev}"
    else
        log_warn "electron absent (lancez [E])"
    fi

    if [ -d "$SCRIPT_DIR/node_modules/electron-builder" ]; then
        local ebv=$(node -e "console.log(require('$SCRIPT_DIR/node_modules/electron-builder/package.json').version)" 2>/dev/null)
        log_success "electron-builder: v${ebv}"
    else
        log_warn "electron-builder absent (lancez [E])"
    fi

    # Structure du projet
    echo
    log_step "Structure du projet..."
    echo

    for f in package.json next.config.ts src/app/layout.tsx main.js; do
        if [ -f "$SCRIPT_DIR/$f" ]; then
            log_success "$f present"
        else
            if [ "$f" = "main.js" ]; then
                log_warn "$f absent (necessaire pour exe)"
            else
                log_error "$f manquant!"
                all_ok=false
            fi
        fi
    done

    if [ -d "$SCRIPT_DIR/node_modules" ]; then
        local nm_count=$(ls "$SCRIPT_DIR/node_modules" | wc -l)
        log_success "node_modules installe ($nm_count packages)"
    else
        log_warn "node_modules absent (lancez [2])"
    fi

    # next.config standalone
    if grep -q "standalone" "$SCRIPT_DIR/next.config.ts" 2>/dev/null; then
        log_success "next.config.ts: output='standalone' active"
    else
        log_error "next.config.ts: output='standalone' manquant!"
        all_ok=false
    fi

    # Build Next.js
    if [ -f "$STANDALONE_DIR/server.js" ]; then
        local standalone_size=$(du -sh "$STANDALONE_DIR" | cut -f1)
        log_success ".next/standalone present ($standalone_size)"
    else
        log_warn ".next/standalone absent (lancez [3])"
    fi

    # Standalone prepare dans bin/
    if [ -f "$BIN_STANDALONE/server.js" ]; then
        local bin_size=$(du -sh "$BIN_STANDALONE" | cut -f1)
        log_success "bin/standalone present ($bin_size)"
    else
        log_warn "bin/standalone absent (lancez [4])"
    fi

    # .env.local
    if [ -f "$SCRIPT_DIR/.env.local" ]; then
        log_success ".env.local present"
    else
        log_warn ".env.local absent"
    fi

    # Assets
    if [ -f "$SCRIPT_DIR/assets/icon.png" ] && [ -f "$SCRIPT_DIR/assets/icon.ico" ]; then
        log_success "assets/icon.png + icon.ico presents"
    else
        log_warn "Assets icone manquants"
    fi

    echo
    local free_space=$(df -h "$SCRIPT_DIR" | awk 'NR==2{print $4}')
    log_info "Espace disque disponible: ${free_space}"
    log_info "OS: $(uname -s) $(uname -m)"
    echo

    if $all_ok; then
        echo -e "${GREEN}   Environnement OK${NC}"
    else
        echo -e "${RED}   Certains prerequis manquent${NC}"
    fi
}

# ============================================================
# [2] INSTALLER LES DEPENDANCES
# ============================================================
install_dependencies() {
    log_step "Installation des dependances..."
    echo

    cd "$SCRIPT_DIR"
    npm install --legacy-peer-deps
    if [ $? -ne 0 ]; then
        log_error "npm install echoue"
        return 1
    fi

    log_success "Dependances installees"
}

# ============================================================
# [3] BUILD NEXT.JS (standalone)
# ============================================================
build_nextjs() {
    log_step "Build Next.js (production standalone)..."
    echo

    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        log_warn "node_modules absent, installation..."
        install_dependencies || return 1
    fi

    # Verifier output: 'standalone' dans next.config.ts
    if ! grep -q "standalone" "$SCRIPT_DIR/next.config.ts" 2>/dev/null; then
        log_error "next.config.ts n'a pas output: 'standalone'!"
        log_info "Ajoutez: output: 'standalone' dans nextConfig"
        return 1
    fi

    cd "$SCRIPT_DIR"
    log_info "Lancement: npx next build"
    echo

    npx next build
    if [ $? -ne 0 ]; then
        log_error "Build Next.js echoue"
        return 1
    fi

    # Re-detecter STANDALONE_DIR apres le build (Turbopack peut nicher dans un sous-dossier)
    if [ -f "$SCRIPT_DIR/.next/standalone/server.js" ]; then
        STANDALONE_DIR="$SCRIPT_DIR/.next/standalone"
    elif [ -f "$SCRIPT_DIR/.next/standalone/$PRODUCT_NAME/server.js" ]; then
        STANDALONE_DIR="$SCRIPT_DIR/.next/standalone/$PRODUCT_NAME"
    fi

    if [ -f "$STANDALONE_DIR/server.js" ]; then
        local standalone_size=$(du -sh "$STANDALONE_DIR" | cut -f1)
        echo
        log_success "Build standalone termine ($standalone_size)"
        log_info "Sortie: $STANDALONE_DIR/server.js"
    else
        log_error "server.js non genere dans .next/standalone/!"
        return 1
    fi
}

# ============================================================
# [4] PREPARER LE STANDALONE POUR PACKAGING
# ============================================================
prepare_standalone() {
    log_step "Preparation du standalone pour packaging..."
    echo

    if [ ! -f "$STANDALONE_DIR/server.js" ]; then
        log_warn "Standalone non compile, lancement du build..."
        build_nextjs || return 1
    fi

    # Creer le dossier bin/standalone
    mkdir -p "$BIN_STANDALONE"

    # Nettoyer l'ancien (rm + mkdir pour inclure les dotfiles)
    log_info "Nettoyage de bin/standalone/..."
    rm -rf "$BIN_STANDALONE"
    mkdir -p "$BIN_STANDALONE"

    # Copier le standalone (cp -a pour conserver les dotfiles comme .next/)
    log_info "Copie de .next/standalone/ vers bin/standalone/..."
    cp -a "$STANDALONE_DIR"/. "$BIN_STANDALONE"/

    # Copier les fichiers statiques (public + .next/static)
    if [ -d "$SCRIPT_DIR/public" ]; then
        log_info "Copie de public/ vers bin/standalone/public/..."
        cp -r "$SCRIPT_DIR/public" "$BIN_STANDALONE"/
    fi

    if [ -d "$SCRIPT_DIR/.next/static" ]; then
        log_info "Copie de .next/static/ vers bin/standalone/.next/static/..."
        mkdir -p "$BIN_STANDALONE/.next"
        cp -r "$SCRIPT_DIR/.next/static" "$BIN_STANDALONE/.next/"
    fi

    # Fix Turbopack: remplacer les noms de modules haches par les vrais noms
    # Turbopack genere des references comme require("mongoose-8b99e611e7552af3")
    # qui ne sont pas resolubles dans le contexte Electron packaged
    log_info "Correction des references de modules Turbopack..."
    local chunks_dir="$BIN_STANDALONE/.next/server/chunks"
    if [ -d "$chunks_dir" ]; then
        # Detecter et corriger tous les modules haches (pattern: package-<16hex>)
        local fixed=0
        for hashed in $(grep -roh '"[a-z@][a-z0-9@/_.-]*-[a-f0-9]\{16\}"' "$chunks_dir" 2>/dev/null | sort -u | tr -d '"'); do
            local real_name=$(echo "$hashed" | sed 's/-[a-f0-9]\{16\}$//')
            if [ -d "$BIN_STANDALONE/node_modules/$real_name" ]; then
                log_info "  $hashed -> $real_name"
                find "$chunks_dir" -name "*.js" -exec sed -i "s|$hashed|$real_name|g" {} +
                fixed=$((fixed + 1))
            fi
        done
        if [ $fixed -gt 0 ]; then
            log_success "$fixed module(s) Turbopack corrige(s)"
        else
            log_info "Aucun module hache detecte"
        fi
    fi

    # Injection HTTPS dans server.js + patch start-server.js
    log_info "Injection du support HTTPS dans server.js..."
    local SERVERJS="$BIN_STANDALONE/server.js"
    if [ -f "$SERVERJS" ]; then
        # 1) Patcher start-server.js pour autoriser les certificats en production
        #    Next.js 16 bloque selfSignedCertificate quand isDev=false
        local START_SERVER_JS="$BIN_STANDALONE/node_modules/next/dist/server/lib/start-server.js"
        if [ -f "$START_SERVER_JS" ]; then
            sed -i 's/if (selfSignedCertificate && !isDev)/if (false)/' "$START_SERVER_JS"
            log_success "Patch start-server.js: certificat autorise en production"
        else
            log_warn "start-server.js introuvable pour patch HTTPS"
        fi

        # 2) Ajouter la variable selfSignedCertificate avant startServer()
        sed -i '/^startServer({$/i\
const httpsKeyPath = process.env.HTTPS_KEY_PATH;\
const httpsCertPath = process.env.HTTPS_CERT_PATH;\
const selfSignedCert = (httpsKeyPath \&\& httpsCertPath) ? { key: httpsKeyPath, cert: httpsCertPath } : undefined;' "$SERVERJS"

        # 3) Injecter selfSignedCertificate dans les options de startServer
        sed -i 's/^startServer({$/startServer({\n  selfSignedCertificate: selfSignedCert,/' "$SERVERJS"

        log_success "HTTPS injecte dans server.js"
    else
        log_warn "server.js introuvable pour injection HTTPS"
    fi

    # Copier .env.local si present
    if [ -f "$SCRIPT_DIR/.env.local" ]; then
        log_info "Copie de .env.local..."
        cp "$SCRIPT_DIR/.env.local" "$BIN_STANDALONE/"
    fi

    # Verifier
    if [ -f "$BIN_STANDALONE/server.js" ]; then
        local total_size=$(du -sh "$BIN_STANDALONE" | cut -f1)
        local file_count=$(find "$BIN_STANDALONE" -type f | wc -l)
        echo
        log_success "Standalone pret: $file_count fichiers ($total_size)"
        log_info "Chemin: bin/standalone/"
    else
        log_error "Preparation echouee!"
        return 1
    fi
}

# ============================================================
# [5] DEMARRER LE SERVEUR (test)
# ============================================================
start_server() {
    log_step "Demarrage du serveur Mosta ParkManager..."
    echo

    local server_path=""
    if [ -f "$BIN_STANDALONE/server.js" ]; then
        server_path="$BIN_STANDALONE"
        log_info "Utilisation: bin/standalone/server.js"
    elif [ -f "$STANDALONE_DIR/server.js" ]; then
        server_path="$STANDALONE_DIR"
        log_info "Utilisation: .next/standalone/server.js"
    else
        log_error "Aucun standalone disponible! Lancez [3] puis [4]"
        return 1
    fi

    log_info "URL: http://localhost:${SERVER_PORT}"
    echo

    cd "$server_path"
    PORT=$SERVER_PORT HOSTNAME=localhost NODE_ENV=production node server.js
    local exit_code=$?
    cd "$SCRIPT_DIR"

    if [ $exit_code -ne 0 ]; then
        log_error "Le serveur s'est arrete avec le code $exit_code"
    fi
}

# ============================================================
# [E] INSTALLER ELECTRON + ELECTRON-BUILDER
# ============================================================
install_electron() {
    log_step "Installation Electron + electron-builder..."
    echo

    cd "$SCRIPT_DIR"

    if [ ! -d "node_modules/electron" ]; then
        log_info "Installation d'electron..."
        npm install --save-dev electron@28 --legacy-peer-deps
        if [ $? -ne 0 ]; then
            log_error "Installation electron echouee"
            return 1
        fi
    else
        log_success "electron deja installe"
    fi

    if [ ! -d "node_modules/electron-builder" ]; then
        log_info "Installation d'electron-builder..."
        npm install --save-dev electron-builder@24 --legacy-peer-deps
        if [ $? -ne 0 ]; then
            log_error "Installation electron-builder echouee"
            return 1
        fi
    else
        log_success "electron-builder deja installe"
    fi

    if [ ! -f "$SCRIPT_DIR/main.js" ]; then
        log_error "main.js manquant! Le wrapper Electron est necessaire."
        return 1
    fi

    echo
    log_success "Electron pret pour la creation d'executables"
}

# ============================================================
# FONCTIONS INTERNES BUILD EXE
# ============================================================

ensure_exe_ready() {
    # main.js
    if [ ! -f "$SCRIPT_DIR/main.js" ]; then
        log_error "main.js manquant!"
        return 1
    fi

    # electron
    if [ ! -d "$SCRIPT_DIR/node_modules/electron" ]; then
        log_warn "Electron non installe, installation..."
        install_electron || return 1
    fi

    # electron-builder
    if [ ! -d "$SCRIPT_DIR/node_modules/electron-builder" ]; then
        log_warn "electron-builder non installe, installation..."
        install_electron || return 1
    fi

    # Standalone prepare
    if [ ! -f "$BIN_STANDALONE/server.js" ]; then
        log_warn "Standalone non prepare, lancement..."
        prepare_standalone || return 1
    fi

    return 0
}

# ============================================================
# [W] CREER L'EXE WINDOWS (NSIS x64)
# ============================================================
build_win_exe() {
    local arch="${1:-x64}"
    local target="${2:-nsis}"

    log_step "Creation de l'exe Windows ${target} ${arch}..."
    echo

    ensure_exe_ready || return 1

    if ! command -v wine &> /dev/null; then
        log_warn "Wine non detecte. Necessaire pour build Windows depuis Linux."
        echo -ne "${YELLOW}   Continuer quand meme? [o/N]: ${NC}"
        read -r answer
        if [[ "$answer" != "o" && "$answer" != "O" && "$answer" != "y" && "$answer" != "Y" ]]; then
            return 1
        fi
    fi

    mkdir -p "$BIN_DIST"

    cd "$SCRIPT_DIR"
    log_info "Lancement: npx electron-builder --win ${target} --${arch}"
    echo

    CSC_IDENTITY_AUTO_DISCOVERY=false \
    npx electron-builder --win ${target} --${arch} \
        --config electron-builder.config.js
    local exit_code=$?

    if [ $exit_code -ne 0 ]; then
        log_error "electron-builder a echoue (code: $exit_code)"
        return 1
    fi

    echo
    log_success "Build Windows ${target} ${arch} termine"
    show_build_summary
}

# ============================================================
# [L] CREER L'EXE LINUX (AppImage)
# ============================================================
build_linux_exe() {
    log_step "Creation de l'exe Linux AppImage x64..."
    echo

    ensure_exe_ready || return 1

    mkdir -p "$BIN_DIST"

    cd "$SCRIPT_DIR"
    log_info "Lancement: npx electron-builder --linux AppImage --x64"
    echo

    CSC_IDENTITY_AUTO_DISCOVERY=false \
    npx electron-builder --linux AppImage --x64 \
        --config electron-builder.config.js
    local exit_code=$?

    if [ $exit_code -ne 0 ]; then
        log_error "electron-builder a echoue (code: $exit_code)"
        return 1
    fi

    echo
    log_success "Build Linux AppImage termine"
    show_build_summary
}

# ============================================================
# [F] BUILD COMPLET EXE
# ============================================================
build_full_exe() {
    log_step "Build complet (deps + Next.js + standalone + NSIS + portable)..."
    echo

    echo -e "${PURPLE}--- Etape 1/7: Dependances ---${NC}"
    install_dependencies || return 1
    echo

    echo -e "${PURPLE}--- Etape 2/7: Electron ---${NC}"
    install_electron || return 1
    echo

    echo -e "${PURPLE}--- Etape 3/7: Build Next.js ---${NC}"
    build_nextjs || return 1
    echo

    echo -e "${PURPLE}--- Etape 4/7: Preparer standalone ---${NC}"
    prepare_standalone || return 1
    echo

    echo -e "${PURPLE}--- Etape 5/7: NSIS Windows x64 ---${NC}"
    build_win_exe "x64" "nsis"
    echo

    echo -e "${PURPLE}--- Etape 6/7: Portable Windows x64 ---${NC}"
    build_win_exe "x64" "portable"
    echo

    echo -e "${PURPLE}--- Etape 7/7: Resume ---${NC}"
    show_build_summary
}

# ============================================================
# [G] BUILD COMPLET (2+E+3+4+W)
# ============================================================
build_full_win_nsis() {
    log_step "Build complet (deps + Electron + Next.js + standalone + NSIS)..."
    echo

    echo -e "${PURPLE}--- Etape 1/5: Dependances ---${NC}"
    install_dependencies || return 1
    echo

    echo -e "${PURPLE}--- Etape 2/5: Electron ---${NC}"
    install_electron || return 1
    echo

    echo -e "${PURPLE}--- Etape 3/5: Build Next.js ---${NC}"
    build_nextjs || return 1
    echo

    echo -e "${PURPLE}--- Etape 4/5: Preparer standalone ---${NC}"
    prepare_standalone || return 1
    echo

    echo -e "${PURPLE}--- Etape 5/5: NSIS Windows x64 ---${NC}"
    build_win_exe "x64" "nsis"
    echo

    show_build_summary
}

# ============================================================
# [H] BUILD COMPLET (2+E+3+4+P)
# ============================================================
build_full_win_portable() {
    log_step "Build complet (deps + Electron + Next.js + standalone + Portable)..."
    echo

    echo -e "${PURPLE}--- Etape 1/5: Dependances ---${NC}"
    install_dependencies || return 1
    echo

    echo -e "${PURPLE}--- Etape 2/5: Electron ---${NC}"
    install_electron || return 1
    echo

    echo -e "${PURPLE}--- Etape 3/5: Build Next.js ---${NC}"
    build_nextjs || return 1
    echo

    echo -e "${PURPLE}--- Etape 4/5: Preparer standalone ---${NC}"
    prepare_standalone || return 1
    echo

    echo -e "${PURPLE}--- Etape 5/5: Portable Windows x64 ---${NC}"
    build_win_exe "x64" "portable"
    echo

    show_build_summary
}

# ============================================================
# RESUME DES BUILDS
# ============================================================
show_build_summary() {
    echo
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}                    RESUME DES BUILDS${NC}"
    echo -e "${BLUE}============================================================${NC}"
    echo

    if [ -d "$BIN_DIST" ] && [ "$(ls -A "$BIN_DIST" 2>/dev/null)" ]; then
        echo -e "${CYAN}   Executables dans bin/dist/:${NC}"
        local total=0
        for file in "$BIN_DIST"/*; do
            if [ -f "$file" ]; then
                local size=$(du -h "$file" | cut -f1)
                local name=$(basename "$file")
                case "$name" in
                    *.exe|*.AppImage|*.deb|*.rpm|*.dmg)
                        echo -e "${GREEN}      ${name}  (${size})${NC}"
                        total=$((total + 1))
                        ;;
                    *.yaml|*.yml|*.blockmap)
                        ;;
                    *)
                        echo -e "${CYAN}      ${name}  (${size})${NC}"
                        total=$((total + 1))
                        ;;
                esac
            fi
        done
        echo
        local total_size=$(du -sh "$BIN_DIST" | cut -f1)
        log_info "Total: $total fichier(s), $total_size"
    else
        log_warn "Aucun executable dans bin/dist/"
    fi
}

# ============================================================
# STATUT
# ============================================================
show_status() {
    echo
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}                    STATUT${NC}"
    echo -e "${BLUE}============================================================${NC}"
    echo

    # Standalone
    if [ -f "$STANDALONE_DIR/server.js" ]; then
        local s_size=$(du -sh "$STANDALONE_DIR" | cut -f1)
        log_success "Next.js standalone: present ($s_size)"
    else
        log_warn "Next.js standalone: absent"
    fi

    if [ -f "$BIN_STANDALONE/server.js" ]; then
        local b_size=$(du -sh "$BIN_STANDALONE" | cut -f1)
        log_success "bin/standalone: pret ($b_size)"
    else
        log_warn "bin/standalone: absent"
    fi

    # MongoDB
    if pgrep -x mongod > /dev/null 2>&1; then
        log_success "MongoDB: en cours"
    else
        log_warn "MongoDB: arrete"
    fi

    # Executables
    if [ -d "$BIN_DIST" ] && ls "$BIN_DIST"/*.exe &>/dev/null; then
        local exe_count=$(ls "$BIN_DIST"/*.exe 2>/dev/null | wc -l)
        log_success "Executables Windows: $exe_count fichier(s)"
    fi
    if [ -d "$BIN_DIST" ] && ls "$BIN_DIST"/*.AppImage &>/dev/null; then
        log_success "Executables Linux: present"
    fi
}

# ============================================================
# [C] NETTOYER
# ============================================================
clean_temp() {
    log_step "Nettoyage..."
    echo

    echo -e "${YELLOW}   Quoi nettoyer?${NC}"
    echo
    echo "   [1] .next/ (build Next.js)"
    echo "   [2] bin/standalone/ (standalone prepare)"
    echo "   [3] bin/dist/ (executables)"
    echo "   [4] Tout (1+2+3)"
    echo "   [0] Annuler"
    echo
    echo -ne "${CYAN}   Choix: ${NC}"
    read -r clean_choice

    case $clean_choice in
        1) [ -d "$SCRIPT_DIR/.next" ] && rm -rf "$SCRIPT_DIR/.next" && log_success ".next/ supprime" ;;
        2) [ -d "$BIN_STANDALONE" ] && rm -rf "$BIN_STANDALONE" && log_success "bin/standalone/ supprime" ;;
        3) [ -d "$BIN_DIST" ] && rm -rf "$BIN_DIST" && log_success "bin/dist/ supprime" ;;
        4)
            [ -d "$SCRIPT_DIR/.next" ] && rm -rf "$SCRIPT_DIR/.next"
            [ -d "$BIN_STANDALONE" ] && rm -rf "$BIN_STANDALONE"
            [ -d "$BIN_DIST" ] && rm -rf "$BIN_DIST"
            log_success "Tout nettoye"
            ;;
        *) log_info "Annule" ;;
    esac
}

# ============================================================
# MENU PRINCIPAL
# ============================================================
show_menu() {
    echo -e "${BLUE}  CONFIGURATION${NC}"
    echo -e "  ${YELLOW}[1]${NC} Verifier l'environnement"
    echo -e "  ${YELLOW}[2]${NC} Installer les dependances (npm install)"
    echo
    echo -e "${BLUE}  COMPILATION${NC}"
    echo -e "  ${YELLOW}[3]${NC} Build Next.js (standalone)"
    echo -e "  ${YELLOW}[4]${NC} Preparer le standalone pour packaging"
    echo -e "  ${YELLOW}[5]${NC} Tester le serveur standalone"
    echo
    echo -e "${BLUE}  CREATION D'EXECUTABLES${NC}"
    echo -e "  ${YELLOW}[E]${NC} Installer Electron + electron-builder"
    echo -e "  ${YELLOW}[W]${NC} Creer l'exe Windows 64-bit (NSIS)"
    echo -e "  ${YELLOW}[P]${NC} Creer le portable Windows 64-bit"
    echo -e "  ${YELLOW}[L]${NC} Creer l'exe Linux (AppImage)"
    echo -e "  ${YELLOW}[F]${NC} Build complet (2+E+3+4+W+P)"
    echo -e "  ${YELLOW}[G]${NC} Build complet (2+E+3+4+W)"
    echo -e "  ${YELLOW}[H]${NC} Build complet (2+E+3+4+P)"
    echo
    echo -e "${BLUE}  MAINTENANCE${NC}"
    echo -e "  ${YELLOW}[S]${NC} Statut"
    echo -e "  ${YELLOW}[B]${NC} Resume des builds"
    echo -e "  ${YELLOW}[C]${NC} Nettoyer"
    echo -e "  ${YELLOW}[0]${NC} Quitter"
    echo
}

# ============================================================
# BOUCLE PRINCIPALE
# ============================================================
main() {
    while true; do
        show_header
        show_menu
        echo -ne "${CYAN}Votre choix: ${NC}"
        read -r choice

        case $choice in
            1)  show_header; check_environment; pause_menu ;;
            2)  show_header; install_dependencies; pause_menu ;;
            3)  show_header; build_nextjs; pause_menu ;;
            4)  show_header; prepare_standalone; pause_menu ;;
            5)  show_header; start_server; pause_menu ;;
            [eE]) show_header; install_electron; pause_menu ;;
            [wW]) show_header; build_win_exe "x64" "nsis"; pause_menu ;;
            [pP]) show_header; build_win_exe "x64" "portable"; pause_menu ;;
            [lL]) show_header; build_linux_exe; pause_menu ;;
            [fF]) show_header; build_full_exe; pause_menu ;;
            [gG]) show_header; build_full_win_nsis; pause_menu ;;
            [hH]) show_header; build_full_win_portable; pause_menu ;;
            [sS]) show_header; show_status; pause_menu ;;
            [bB]) show_header; show_build_summary; pause_menu ;;
            [cC]) show_header; clean_temp; pause_menu ;;
            0)  echo -e "${GREEN}Au revoir!${NC}"; exit 0 ;;
            *)  echo -e "${RED}Choix invalide.${NC}"; sleep 1 ;;
        esac
    done
}

trap 'echo -e "\n${RED}Interrompu.${NC}"; exit 1' INT TERM

main "$@"
