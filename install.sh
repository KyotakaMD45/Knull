#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Knull Bot — Universal Installation Script
# Based on the Levanter installer by lyfe00011.
# Supports: Debian/Ubuntu, Fedora/RHEL, Arch, Alpine, macOS, Termux (Android)
#
#   bash <(curl -fsSL https://tinyurl.com/knull-setup)
# =============================================================================

# ---- Section A: Constants & Defaults ----------------------------------------
NODE_VERSION="${NODE_VERSION:-20}"
REPO_URL="${REPO_URL:-https://github.com/KyotakaMD45/Knull.git}"
BOT_NAME="${BOT_NAME:-knull}"
SESSION_ID="${SESSION_ID:-}"
PREFIX="${PREFIX:-.}"
SUDO_NUMBERS="${SUDO_NUMBERS:-}"
STICKER_PACKNAME="${STICKER_PACKNAME:-Knull}"
VPS="${VPS:-true}"
NONINTERACTIVE="${NONINTERACTIVE:-0}"
START_AFTER_INSTALL="${START_AFTER_INSTALL:-0}"

# Work from a writable folder (e.g. not a folder created with sudo).
if ! ( : >>"${LOG_FILE:-knull-install.log}" ) 2>/dev/null; then
    cd "$HOME" 2>/dev/null || cd /tmp
fi
LOG_FILE="${LOG_FILE:-$PWD/knull-install.log}"
( : >>"$LOG_FILE" ) 2>/dev/null || LOG_FILE="$(mktemp)"

OS_TYPE=""
PKG_MANAGER=""
NEED_NODE=0
NEED_FFMPEG=0
NEED_GIT=0
NEED_CURL=0
NEED_BUILD=0
NEED_PYTHON=0
SPINNER_PID=""
INSTALL_SUCCESS=0

# ---- Section B: Color / UI Helpers ------------------------------------------
supports_color() {
    if [ -n "${NO_COLOR:-}" ]; then return 1; fi
    if [ -t 1 ] && [ -n "${TERM:-}" ] && [ "${TERM}" != "dumb" ]; then return 0; fi
    return 1
}

if supports_color; then
    CYAN='\033[36m'; GREEN='\033[32m'; YELLOW='\033[33m'; RED='\033[31m'
    BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'
else
    CYAN=''; GREEN=''; YELLOW=''; RED=''; BOLD=''; DIM=''; NC=''
fi

info()    { printf "${CYAN}[INFO]${NC} %s\n" "$1" >&2; echo "[INFO] $1" >> "$LOG_FILE"; }
warn()    { printf "${YELLOW}[WARN]${NC} %s\n" "$1" >&2; echo "[WARN] $1" >> "$LOG_FILE"; }
error()   { printf "${RED}[ERROR]${NC} %s\n" "$1" >&2; echo "[ERROR] $1" >> "$LOG_FILE"; }
success() { printf "${GREEN}[OK]${NC} %s\n" "$1" >&2; echo "[OK] $1" >> "$LOG_FILE"; }

# Reads an answer from the keyboard, even when the script itself comes from a pipe.
ask() {
    if [ -r /dev/tty ]; then
        read -r "$1" </dev/tty || true
    else
        read -r "$1" || true
    fi
}

spin() {
    local msg="$1"; shift
    local chars='|/-\'
    local i=0

    printf "${DIM}  %s %s${NC}" "-" "$msg" >&2

    while true; do
        i=$(( (i + 1) % 4 ))
        printf "\r${DIM}  %s %s${NC}" "$(echo "$chars" | cut -c$((i+1)))" "$msg" >&2
        sleep 0.15
    done &
    SPINNER_PID=$!

    echo "\$ $*" >> "$LOG_FILE"
    local rc=0
    "$@" >> "$LOG_FILE" 2>&1 || rc=$?
    kill "$SPINNER_PID" 2>/dev/null; wait "$SPINNER_PID" 2>/dev/null || true
    SPINNER_PID=""
    if [ "$rc" -eq 0 ]; then
        printf "\r${GREEN}  + %s${NC}\n" "$msg" >&2
        return 0
    fi
    echo "[exit code $rc]" >> "$LOG_FILE"
    printf "\r${RED}  x %s${NC}\n" "$msg" >&2
    [ "$rc" -eq 137 ] && printf "${YELLOW}  Killed by the system: not enough memory (RAM).${NC}\n" >&2
    return $rc
}

# ---- Section C: Logging & Error Handling ------------------------------------
cleanup() {
    if [ -n "${SPINNER_PID:-}" ]; then
        kill "$SPINNER_PID" 2>/dev/null; wait "$SPINNER_PID" 2>/dev/null || true
    fi
    if [ "${INSTALL_SUCCESS:-0}" -ne 1 ]; then
        echo "" >&2
        printf "${RED}[ERROR]${NC} Installation failed. Last 25 lines of %s:\n" "$LOG_FILE" >&2
        echo "---" >&2
        tail -n 25 "$LOG_FILE" >&2 2>/dev/null || true
        echo "---" >&2
        error "Full log: $LOG_FILE"
    fi
}
trap cleanup EXIT

run_privileged() {
    if [ "$(id -u)" -ne 0 ]; then
        if command -v sudo > /dev/null 2>&1; then
            sudo "$@"
        else
            # Termux and similar environments don't need/have sudo
            "$@"
        fi
    else
        "$@"
    fi
}

# Prompt for sudo password upfront so spinners don't swallow the prompt
cache_sudo() {
    if [ "$(id -u)" -eq 0 ] || [ "$OS_TYPE" = "termux" ]; then
        return 0
    fi
    if command -v sudo > /dev/null 2>&1; then
        info "Root privileges needed for package installation."
        sudo -v || { error "Failed to obtain sudo credentials."; exit 1; }
    fi
}

# ---- Section D: OS Detection -----------------------------------------------
detect_os() {
    local kernel
    kernel="$(uname -s)"

    case "$kernel" in
        Linux)
            OS_TYPE="linux"

            # Check for Termux (Android)
            if [ -n "${TERMUX_VERSION:-}" ] || [ -d "/data/data/com.termux" ]; then
                OS_TYPE="termux"
                PKG_MANAGER="pkg"
                info "Detected: Termux (Android)"
                return 0
            fi

            # Check for WSL
            if grep -qi microsoft /proc/version 2>/dev/null; then
                OS_TYPE="wsl"
            fi

            if [ -f /etc/os-release ]; then
                # shellcheck disable=SC1091
                . /etc/os-release
                local id="${ID:-}"
                local id_like="${ID_LIKE:-}"

                case "$id" in
                    debian|ubuntu|pop|linuxmint|raspbian|kali|zorin)
                        PKG_MANAGER="apt" ;;
                    fedora|rhel|centos|rocky|alma|ol|amzn)
                        if command -v dnf > /dev/null 2>&1; then
                            PKG_MANAGER="dnf"
                        else
                            PKG_MANAGER="yum"
                        fi ;;
                    arch|manjaro|endeavouros|garuda)
                        PKG_MANAGER="pacman" ;;
                    alpine)
                        PKG_MANAGER="apk" ;;
                    *)
                        # Fallback: check ID_LIKE
                        case "$id_like" in
                            *debian*|*ubuntu*)  PKG_MANAGER="apt" ;;
                            *fedora*|*rhel*)
                                if command -v dnf > /dev/null 2>&1; then
                                    PKG_MANAGER="dnf"
                                else
                                    PKG_MANAGER="yum"
                                fi ;;
                            *arch*)             PKG_MANAGER="pacman" ;;
                            *)
                                error "Unsupported Linux distro: ${PRETTY_NAME:-$id}"
                                error "Supported: Debian/Ubuntu, Fedora/RHEL, Arch, Alpine, Termux"
                                exit 1
                                ;;
                        esac
                        ;;
                esac
            else
                error "Cannot detect Linux distro (/etc/os-release not found)."
                exit 1
            fi
            ;;
        Darwin)
            OS_TYPE="darwin"
            if command -v brew > /dev/null 2>&1; then
                PKG_MANAGER="brew"
            else
                error "Homebrew is required on macOS but was not found."
                echo "  Install it from: https://brew.sh" >&2
                exit 1
            fi
            ;;
        *)
            error "Unsupported OS: $kernel"
            error "Use WSL on Windows, Termux on Android, or Docker."
            exit 1
            ;;
    esac

    info "Detected: $OS_TYPE ($PKG_MANAGER)"
    if [ "$OS_TYPE" = "wsl" ]; then
        info "Running under WSL — fully supported."
    fi
}

# ---- Section E: Prerequisite Check -----------------------------------------
check_prerequisites() {
    info "Checking prerequisites..."

    # Node.js
    if command -v node > /dev/null 2>&1; then
        local node_major
        node_major="$(node -v | sed 's/^v//' | cut -d. -f1)"
        if [ "$node_major" -ge "$NODE_VERSION" ] 2>/dev/null; then
            success "Node.js $(node -v) found"
        else
            warn "Node.js $(node -v) found but v${NODE_VERSION}.x required"
            NEED_NODE=1
        fi
    else
        NEED_NODE=1
    fi

    # Git
    if command -v git > /dev/null 2>&1; then
        success "git found"
    else
        NEED_GIT=1
    fi

    # curl
    if command -v curl > /dev/null 2>&1; then
        success "curl found"
    else
        NEED_CURL=1
    fi

    # FFmpeg
    if command -v ffmpeg > /dev/null 2>&1 && command -v ffprobe > /dev/null 2>&1; then
        success "ffmpeg found"
    else
        NEED_FFMPEG=1
    fi

    # Build tools (not needed on Termux — pkg handles native deps)
    if [ "$OS_TYPE" = "termux" ]; then
        success "Build tools (Termux — handled by pkg)"
    elif command -v gcc > /dev/null 2>&1 && command -v make > /dev/null 2>&1; then
        success "Build tools found"
    else
        NEED_BUILD=1
    fi

    # Python (needed by node-gyp)
    if command -v python3 > /dev/null 2>&1 || command -v python > /dev/null 2>&1; then
        success "python found"
    else
        NEED_PYTHON=1
    fi

    # Summary
    local to_install=""
    [ "$NEED_NODE" -eq 1 ]   && to_install="${to_install}Node.js ${NODE_VERSION}.x, "
    [ "$NEED_GIT" -eq 1 ]    && to_install="${to_install}git, "
    [ "$NEED_CURL" -eq 1 ]   && to_install="${to_install}curl, "
    [ "$NEED_FFMPEG" -eq 1 ] && to_install="${to_install}ffmpeg, "
    [ "$NEED_BUILD" -eq 1 ]  && to_install="${to_install}build tools, "
    [ "$NEED_PYTHON" -eq 1 ] && to_install="${to_install}python3, "

    if [ -n "$to_install" ]; then
        to_install="$(echo "$to_install" | sed 's/, $//')"
        info "Will install: $to_install"
    else
        success "All prerequisites already installed"
    fi
}

# ---- Section F: System Package Installation ---------------------------------
install_system_deps() {
    local need_any=0
    for flag in $NEED_GIT $NEED_CURL $NEED_FFMPEG $NEED_BUILD $NEED_PYTHON; do
        [ "$flag" -eq 1 ] && need_any=1
    done
    [ "$need_any" -eq 0 ] && return 0

    info "Installing system dependencies..."

    case "$PKG_MANAGER" in
        pkg)
            # Termux
            spin "Updating package lists" pkg update -y
            local pkgs=""
            [ "$NEED_GIT" -eq 1 ]    && pkgs="$pkgs git"
            [ "$NEED_CURL" -eq 1 ]   && pkgs="$pkgs curl"
            [ "$NEED_FFMPEG" -eq 1 ] && pkgs="$pkgs ffmpeg"
            [ "$NEED_PYTHON" -eq 1 ] && pkgs="$pkgs python"
            [ "$NEED_NODE" -eq 1 ]   && pkgs="$pkgs nodejs"
            # Termux needs binutils for native module compilation
            pkgs="$pkgs binutils"
            # shellcheck disable=SC2086
            spin "Installing packages:$pkgs" pkg install -y $pkgs
            # Mark Node as handled since pkg installed it
            NEED_NODE=0
            ;;
        apt)
            spin "Updating package lists" run_privileged apt-get update -y
            local pkgs=""
            [ "$NEED_GIT" -eq 1 ]    && pkgs="$pkgs git"
            [ "$NEED_CURL" -eq 1 ]   && pkgs="$pkgs curl"
            [ "$NEED_FFMPEG" -eq 1 ] && pkgs="$pkgs ffmpeg"
            [ "$NEED_BUILD" -eq 1 ]  && pkgs="$pkgs build-essential"
            [ "$NEED_PYTHON" -eq 1 ] && pkgs="$pkgs python3"
            if [ -n "$pkgs" ]; then
                export DEBIAN_FRONTEND=noninteractive
                # shellcheck disable=SC2086
                spin "Installing packages:$pkgs" run_privileged apt-get install -y $pkgs
            fi
            ;;
        dnf|yum)
            local pkgs=""
            [ "$NEED_GIT" -eq 1 ]    && pkgs="$pkgs git"
            [ "$NEED_CURL" -eq 1 ]   && pkgs="$pkgs curl"
            [ "$NEED_FFMPEG" -eq 1 ] && pkgs="$pkgs ffmpeg-free"
            [ "$NEED_BUILD" -eq 1 ]  && pkgs="$pkgs gcc gcc-c++ make"
            [ "$NEED_PYTHON" -eq 1 ] && pkgs="$pkgs python3"
            if [ -n "$pkgs" ]; then
                # shellcheck disable=SC2086
                spin "Installing packages:$pkgs" run_privileged "$PKG_MANAGER" install -y $pkgs
            fi
            if [ "$NEED_FFMPEG" -eq 1 ] && ! command -v ffmpeg > /dev/null 2>&1; then
                warn "ffmpeg-free may lack some codecs. For full ffmpeg, enable RPM Fusion:"
                echo "  https://rpmfusion.org/Configuration" >&2
            fi
            ;;
        pacman)
            local pkgs=""
            [ "$NEED_GIT" -eq 1 ]    && pkgs="$pkgs git"
            [ "$NEED_CURL" -eq 1 ]   && pkgs="$pkgs curl"
            [ "$NEED_FFMPEG" -eq 1 ] && pkgs="$pkgs ffmpeg"
            [ "$NEED_BUILD" -eq 1 ]  && pkgs="$pkgs base-devel"
            [ "$NEED_PYTHON" -eq 1 ] && pkgs="$pkgs python"
            if [ -n "$pkgs" ]; then
                # shellcheck disable=SC2086
                spin "Installing packages:$pkgs" run_privileged pacman -Sy --noconfirm --needed $pkgs
            fi
            ;;
        apk)
            local pkgs=""
            [ "$NEED_GIT" -eq 1 ]    && pkgs="$pkgs git"
            [ "$NEED_CURL" -eq 1 ]   && pkgs="$pkgs curl"
            [ "$NEED_FFMPEG" -eq 1 ] && pkgs="$pkgs ffmpeg"
            [ "$NEED_BUILD" -eq 1 ]  && pkgs="$pkgs build-base"
            [ "$NEED_PYTHON" -eq 1 ] && pkgs="$pkgs python3"
            if [ -n "$pkgs" ]; then
                # shellcheck disable=SC2086
                spin "Installing packages:$pkgs" run_privileged apk add --no-cache $pkgs
            fi
            ;;
        brew)
            # macOS: check Xcode CLT
            if ! xcode-select -p > /dev/null 2>&1; then
                info "Installing Xcode Command Line Tools (may show a system dialog)..."
                xcode-select --install 2>/dev/null || true
                warn "If a dialog appeared, complete the installation and re-run this script."
                exit 1
            fi
            local pkgs=""
            [ "$NEED_FFMPEG" -eq 1 ] && pkgs="$pkgs ffmpeg"
            [ "$NEED_PYTHON" -eq 1 ] && pkgs="$pkgs python3"
            if [ -n "$pkgs" ]; then
                # shellcheck disable=SC2086
                spin "Installing packages:$pkgs" brew install $pkgs
            fi
            ;;
    esac

    success "System dependencies installed"
}

# ---- Section G: Node.js Installation (NodeSource) -------------------------
install_node() {
    [ "$NEED_NODE" -eq 0 ] && return 0

    # Termux: install Node via pkg directly if not handled in Section F
    if [ "$OS_TYPE" = "termux" ]; then
        if ! command -v node > /dev/null 2>&1; then
            spin "Installing Node.js via pkg" pkg install -y nodejs
        fi
        success "Node.js $(node -v) installed via pkg"
        return 0
    fi

    # Remove outdated Node.js (< NODE_VERSION) to avoid conflicts
    if command -v node > /dev/null 2>&1; then
        local old_ver
        old_ver="$(node -v | sed 's/^v//' | cut -d. -f1)"
        if [ "$old_ver" -lt "$NODE_VERSION" ] 2>/dev/null; then
            warn "Removing outdated Node.js v${old_ver}..."
            case "$PKG_MANAGER" in
                apt)
                    spin "Removing old Node.js" run_privileged apt-get remove -y nodejs || true
                    run_privileged apt-get autoremove -y >> "$LOG_FILE" 2>&1 || true
                    ;;
                dnf|yum)
                    spin "Removing old Node.js" run_privileged "$PKG_MANAGER" remove -y nodejs || true
                    ;;
                pacman)
                    spin "Removing old Node.js" run_privileged pacman -Rns --noconfirm nodejs npm || true
                    ;;
                apk)
                    spin "Removing old Node.js" run_privileged apk del nodejs npm || true
                    ;;
                brew)
                    spin "Removing old Node.js" brew uninstall node || true
                    ;;
            esac
            # Clean stale NodeSource list if present
            run_privileged rm -f /etc/apt/sources.list.d/nodesource*.list 2>/dev/null || true
            run_privileged rm -f /etc/yum.repos.d/nodesource*.repo 2>/dev/null || true
        fi
    fi

    info "Installing Node.js ${NODE_VERSION}.x via NodeSource..."

    case "$PKG_MANAGER" in
        apt)
            export DEBIAN_FRONTEND=noninteractive
            spin "Downloading NodeSource setup" \
                curl -fsSL -o /tmp/nodesource_setup.sh \
                "https://deb.nodesource.com/setup_${NODE_VERSION}.x"
            spin "Setting up NodeSource repository" \
                run_privileged bash /tmp/nodesource_setup.sh
            spin "Installing Node.js" \
                run_privileged apt-get install -y nodejs
            rm -f /tmp/nodesource_setup.sh
            ;;
        dnf|yum)
            spin "Downloading NodeSource setup" \
                curl -fsSL -o /tmp/nodesource_setup.sh \
                "https://rpm.nodesource.com/setup_${NODE_VERSION}.x"
            spin "Setting up NodeSource repository" \
                run_privileged bash /tmp/nodesource_setup.sh
            spin "Installing Node.js" \
                run_privileged "$PKG_MANAGER" install -y nodejs
            rm -f /tmp/nodesource_setup.sh
            ;;
        pacman)
            spin "Installing Node.js" run_privileged pacman -Sy --noconfirm nodejs npm
            ;;
        apk)
            spin "Installing Node.js" run_privileged apk add --no-cache nodejs npm
            ;;
        brew)
            spin "Installing Node.js" brew install node
            ;;
    esac

    success "Node.js $(node -v) installed"
}

# ---- Section H: Yarn Setup --------------------------------------------------
setup_yarn() {
    info "Setting up Yarn..."

    if command -v yarn > /dev/null 2>&1; then
        success "Yarn $(yarn --version) already installed"
        return 0
    fi

    spin "Installing Yarn via npm" run_privileged npm install -g yarn@1.22.22

    success "Yarn $(yarn --version) ready"
}

# ---- Section I: Repository Clone -------------------------------------------
clone_repo() {
    if [ -d "$BOT_NAME" ]; then
        if [ -d "$BOT_NAME/.git" ]; then
            info "Directory '$BOT_NAME' exists — pulling latest changes..."
            spin "Pulling updates" git -C "$BOT_NAME" pull --ff-only || {
                warn "Pull failed, resetting to the latest version..."
                spin "Resetting to latest version" sh -c "git -C '$BOT_NAME' fetch origin && git -C '$BOT_NAME' reset --hard origin/master"
            }
        else
            local suffix=$((RANDOM % 1000))
            warn "Directory '$BOT_NAME' exists but is not a git repo."
            BOT_NAME="${BOT_NAME}_${suffix}"
            warn "Using '$BOT_NAME' instead."
            spin "Cloning repository" git clone --depth 1 "$REPO_URL" "$BOT_NAME"
        fi
    else
        spin "Cloning repository" git clone --depth 1 "$REPO_URL" "$BOT_NAME" || {
            warn "Shallow clone failed, retrying with a full clone..."
            rm -rf "$BOT_NAME"
            spin "Cloning repository (full)" git clone "$REPO_URL" "$BOT_NAME"
        }
    fi

    success "Repository ready at $PWD/$BOT_NAME"
}

# ---- Section I bis: Disk space ---------------------------------------------
# Dependencies take about 400 MB, plus about as much for the yarn cache.
NEED_DISK_MB=1200

free_mb() { df -Pm "${1:-$PWD}" 2>/dev/null | awk 'NR==2 {print $4}'; }

clean_caches() {
    yarn cache clean >> "$LOG_FILE" 2>&1 || true
    npm cache clean --force >> "$LOG_FILE" 2>&1 || true
    rm -rf "$HOME/.cache/yarn" "$HOME/.npm/_cacache" 2>/dev/null || true
    case "$PKG_MANAGER" in
        apt) run_privileged apt-get clean >> "$LOG_FILE" 2>&1 || true ;;
        dnf|yum) run_privileged "$PKG_MANAGER" clean all >> "$LOG_FILE" 2>&1 || true ;;
    esac
    if command -v journalctl > /dev/null 2>&1 && [ "$OS_TYPE" != "termux" ]; then
        run_privileged journalctl --vacuum-size=50M >> "$LOG_FILE" 2>&1 || true
    fi
}

disk_full_help() {
    error "Not enough disk space: $(free_mb) MB free, about ${NEED_DISK_MB} MB needed."
    df -h "$PWD" >&2 || true
    echo "" >&2
    printf "${CYAN}Free some space, then run the installer again:${NC}\n" >&2
    printf "  - delete old bot folders you no longer use (rm -rf <folder>)\n" >&2
    [ -e /knull.swap ] && printf "  - remove the swap file: swapoff /knull.swap && rm /knull.swap && sed -i '/knull.swap/d' /etc/fstab\n" >&2
    printf "  - see what takes the most space: du -xh / --max-depth=2 2>/dev/null | sort -h | tail -15\n" >&2
    printf "  - or enlarge the server disk in your hosting panel\n" >&2
}

check_disk() {
    local free
    free="$(free_mb)"
    [ -n "$free" ] || return 0
    if [ "$free" -lt "$NEED_DISK_MB" ]; then
        warn "Only ${free} MB of disk space free: cleaning package caches..."
        clean_caches
        free="$(free_mb)"
        if [ "$free" -lt "$NEED_DISK_MB" ]; then
            disk_full_help
            exit 1
        fi
    fi
    success "Disk space: ${free} MB free"
}

# ---- Section J: Project Dependencies ---------------------------------------
# Small VPS (1 GB RAM) run out of memory during yarn install: add a swap file,
# only when the disk has room for it.
ensure_swap() {
    case "$OS_TYPE" in linux|wsl) ;; *) return 0 ;; esac
    [ -r /proc/meminfo ] || return 0
    local mem swap free size
    mem=$(awk '/^MemTotal:/ {print int($2/1024)}' /proc/meminfo)
    swap=$(awk '/^SwapTotal:/ {print int($2/1024)}' /proc/meminfo)
    free="$(free_mb /)"
    if [ "${mem:-0}" -lt 2000 ] && [ "${swap:-0}" -lt 500 ] && [ ! -e /knull.swap ]; then
        if [ "${free:-0}" -ge $((NEED_DISK_MB + 2048 + 500)) ]; then
            size=2048
        elif [ "${free:-0}" -ge $((NEED_DISK_MB + 1024 + 300)) ]; then
            size=1024
        else
            warn "Only ${mem} MB of RAM and not enough disk for swap; continuing without it."
            return 0
        fi
        info "Only ${mem} MB of RAM: adding a ${size} MB swap file..."
        if spin "Creating swap file" run_privileged sh -c "fallocate -l ${size}M /knull.swap 2>/dev/null || dd if=/dev/zero of=/knull.swap bs=1M count=${size}; chmod 600 /knull.swap && mkswap /knull.swap && swapon /knull.swap || { rm -f /knull.swap; exit 1; }"; then
            run_privileged sh -c 'grep -q "^/knull.swap" /etc/fstab || echo "/knull.swap none swap sw 0 0" >> /etc/fstab' >> "$LOG_FILE" 2>&1 || true
        else
            warn "Could not add swap; continuing anyway."
        fi
    fi
}

install_dependencies() {
    ensure_swap
    cd "$BOT_NAME"
    info "Installing project dependencies (this may take a few minutes)..."

    if [ "$OS_TYPE" = "termux" ]; then
        # Termux: sharp needs wasm32 build since native ARM compilation often fails
        info "Termux: installing sharp with wasm32 target..."
        spin "Installing sharp (wasm32)" npm install --cpu=wasm32 sharp --legacy-peer-deps

        # Ensure setuptools is available for node-gyp
        if command -v pip > /dev/null 2>&1 || command -v pip3 > /dev/null 2>&1; then
            local pip_cmd="pip3"
            command -v pip3 > /dev/null 2>&1 || pip_cmd="pip"
            spin "Installing python setuptools" $pip_cmd install setuptools 2>/dev/null || true
        fi

        export GYP_DEFINES="android_ndk_path=''"
        spin "Running yarn install" yarn install || {
            warn "yarn install failed, retrying with npm..."
            spin "Running npm install" npm install
        }
    else
        spin "Running yarn install" yarn install --frozen-lockfile || {
            stop_if_disk_full
            warn "Frozen lockfile install failed, retrying without --frozen-lockfile..."
            yarn cache clean >> "$LOG_FILE" 2>&1 || true
            spin "Running yarn install (relaxed)" yarn install || {
                stop_if_disk_full
                warn "yarn install failed again, retrying with npm..."
                yarn cache clean >> "$LOG_FILE" 2>&1 || true
                spin "Running npm install" npm install --no-audit --no-fund || {
                    stop_if_disk_full
                    exit 1
                }
            }
        }
    fi

    # The download cache is no longer needed: give the space back.
    yarn cache clean >> "$LOG_FILE" 2>&1 || true
    npm cache clean --force >> "$LOG_FILE" 2>&1 || true

    cd ..
    success "Dependencies installed"
}

# Retrying is pointless when the disk is full.
stop_if_disk_full() {
    if tail -n 15 "$LOG_FILE" 2>/dev/null | grep -q "ENOSPC"; then
        rm -rf node_modules
        clean_caches
        cd ..
        INSTALL_SUCCESS=1
        disk_full_help
        exit 1
    fi
}

# ---- Section K: Config Generation ------------------------------------------
generate_config() {
    local config_path="$BOT_NAME/config.env"

    if [ -f "$config_path" ]; then
        if [ "$NONINTERACTIVE" -eq 1 ]; then
            info "config.env already exists — skipping (non-interactive mode)"
            return 0
        fi
        echo "" >&2
        printf "${YELLOW}config.env already exists. Overwrite? [y/N]:${NC}\n" >&2
        printf "  > " >&2
        ask overwrite
        if ! echo "${overwrite:-}" | grep -qiE '^y'; then
            info "Keeping existing config.env"
            return 0
        fi
    fi

    # Prompt for values in interactive mode
    if [ "$NONINTERACTIVE" -eq 0 ]; then
        echo "" >&2
        printf "${CYAN}${BOLD}--- Bot Configuration ---${NC}\n" >&2

        if [ -z "$SESSION_ID" ]; then
            echo "" >&2
            printf "${CYAN}Enter your SESSION_ID (leave blank to scan a QR code):${NC}\n" >&2
            printf "  > " >&2
            ask SESSION_ID
        fi

        if [ -z "$SUDO_NUMBERS" ]; then
            echo "" >&2
            printf "${CYAN}Enter admin phone number(s) with country code (e.g. 2250500000000):${NC}\n" >&2
            printf "${DIM}  Separate multiple numbers with commas${NC}\n" >&2
            printf "  > " >&2
            ask SUDO_NUMBERS
        fi

        echo "" >&2
        printf "${CYAN}Command prefix [%s]:${NC}\n" "$PREFIX" >&2
        printf "  > " >&2
        ask input_prefix
        PREFIX="${input_prefix:-$PREFIX}"
    fi

    SUDO_NUMBERS="$(printf '%s' "${SUDO_NUMBERS:-}" | tr -cd '0-9,')"

    cat > "$config_path" <<EOF
# Knull Bot Configuration

# Command prefix (default: .)
PREFIX=${PREFIX}

# Admin phone number(s) with country code
SUDO=${SUDO_NUMBERS}

# Bot display name
NAME=${BOT_NAME}

# Sticker pack branding
STICKER_PACKNAME=${STICKER_PACKNAME}

# Always show as online
ALWAYS_ONLINE=false

# Auto-join groups on invite
AJOIN=true

# Auto-view status updates
AUTO_STATUS_VIEW=true

# Mark messages as read
SEND_READ=true

# Reject incoming calls
REJECT_CALL=false

# Warning limit before action
WARN_LIMIT=3

# Max upload size in MB
MAX_UPLOAD=60

# Running on VPS
VPS=${VPS}

# Language
LANGUAGE=en
BOT_LANG=en

# Force logout on session conflict
FORCE_LOGOUT=false

# Remove background API key (get from remove.bg)
RMBG_KEY=null

# Updates: you get a message when one is available, send .update now to install it
AUTO_UPDATE=false
EOF

    if [ -n "$SESSION_ID" ]; then
        echo "" >> "$config_path"
        echo "# WhatsApp session identifier" >> "$config_path"
        echo "SESSION_ID=$SESSION_ID" >> "$config_path"
    fi

    success "Configuration saved to $config_path"
}

# ---- Section L: Post-Install -----------------------------------------------
start_bot() {
    cd "$BOT_NAME"
    npx pm2 delete "$BOT_NAME" > /dev/null 2>&1 || true
    exec npx pm2 start . --name "$BOT_NAME" --attach --time
}

post_install() {
    INSTALL_SUCCESS=1

    echo "" >&2
    printf "${GREEN}${BOLD}============================================${NC}\n" >&2
    printf "${GREEN}${BOLD}   Knull installed successfully!            ${NC}\n" >&2
    printf "${GREEN}${BOLD}============================================${NC}\n" >&2
    echo "" >&2

    printf "${CYAN}Location:${NC}  %s/%s\n" "$PWD" "$BOT_NAME" >&2
    printf "${CYAN}Node:${NC}      %s\n" "$(node -v 2>/dev/null || echo 'N/A')" >&2
    printf "${CYAN}Yarn:${NC}      %s\n" "$(yarn --version 2>/dev/null || echo 'N/A')" >&2
    echo "" >&2

    if [ -z "$SESSION_ID" ]; then
        printf "${YELLOW}Note:${NC} No SESSION_ID set: a QR code will be shown when the bot starts.\n" >&2
        printf "${DIM}  Scan it in WhatsApp > Linked devices within about a minute.${NC}\n" >&2
        echo "" >&2
    fi

    printf "${CYAN}To start your bot:${NC}\n" >&2
    printf "  cd %s && npx pm2 start . --name %s --attach --time\n" "$BOT_NAME" "$BOT_NAME" >&2
    echo "" >&2
    printf "${CYAN}To see the logs / QR code:${NC}\n" >&2
    printf "  npx pm2 logs %s\n" "$BOT_NAME" >&2
    echo "" >&2
    printf "${CYAN}To stop:${NC}\n" >&2
    printf "  npx pm2 stop %s\n" "$BOT_NAME" >&2
    echo "" >&2

    # Clean up log on success
    rm -f "$LOG_FILE"

    # Optional: start the bot
    if [ "$START_AFTER_INSTALL" -eq 1 ]; then
        info "Starting bot..."
        start_bot
    elif [ "$NONINTERACTIVE" -eq 0 ]; then
        printf "${CYAN}Start the bot now? [Y/n]:${NC}\n" >&2
        printf "  > " >&2
        ask start_now
        if ! echo "${start_now:-}" | grep -qiE '^n'; then
            start_bot
        fi
    fi
}

# ---- Section M: Main Entrypoint --------------------------------------------
print_banner() {
    printf "${CYAN}${BOLD}\n" >&2
    echo "  _  __            _ _ " >&2
    echo " | |/ /_ __  _   _| | |" >&2
    echo " | ' /| '_ \\| | | | | |" >&2
    echo " | . \\| | | | |_| | | |" >&2
    echo " |_|\\_\\_| |_|\\__,_|_|_|" >&2
    echo "" >&2
    printf "  Universal Installer\n${NC}\n" >&2
}

print_usage() {
    cat >&2 <<EOF
Usage: $0 [OPTIONS]

Options:
  -h, --help             Show this help message
  -y, --non-interactive  Skip all prompts (use env vars for config)
  --start                Start the bot after installation
  --name NAME            Bot directory name (default: knull)
  --session ID           WhatsApp SESSION_ID

Environment Variables:
  BOT_NAME, SESSION_ID, PREFIX, SUDO_NUMBERS, VPS,
  NODE_VERSION, NONINTERACTIVE, START_AFTER_INSTALL

Examples:
  $0                              # Interactive install
  $0 -y --name mybot              # Non-interactive with custom name
  SESSION_ID=abc123 $0 -y --start # Full automated install + start
EOF
}

parse_args() {
    while [ $# -gt 0 ]; do
        case "$1" in
            -h|--help)
                print_usage
                INSTALL_SUCCESS=1
                exit 0
                ;;
            -y|--non-interactive)
                NONINTERACTIVE=1
                shift
                ;;
            --start)
                START_AFTER_INSTALL=1
                shift
                ;;
            --name)
                BOT_NAME="${2:-}"
                if [ -z "$BOT_NAME" ]; then
                    error "--name requires a value"
                    exit 1
                fi
                shift 2
                ;;
            --session)
                SESSION_ID="${2:-}"
                if [ -z "$SESSION_ID" ]; then
                    error "--session requires a value"
                    exit 1
                fi
                shift 2
                ;;
            *)
                error "Unknown option: $1"
                print_usage
                exit 1
                ;;
        esac
    done

    # Auto-detect CI environments
    if [ -n "${CI:-}" ]; then
        NONINTERACTIVE=1
    fi
}

prompt_bot_name() {
    [ "$NONINTERACTIVE" -eq 1 ] && return 0

    echo "" >&2
    printf "${CYAN}Bot directory name [%s]:${NC}\n" "$BOT_NAME" >&2
    printf "  > " >&2
    ask input_name
    BOT_NAME="${input_name:-$BOT_NAME}"
    case "$BOT_NAME" in
        *[!A-Za-z0-9._-]*) error "Invalid name: use letters, digits, dot, dash or underscore."; exit 1 ;;
    esac
}

main() {
    # Initialize log
    : > "$LOG_FILE"

    parse_args "$@"
    print_banner
    detect_os
    prompt_bot_name

    echo "" >&2
    check_prerequisites

    # Confirm in interactive mode
    if [ "$NONINTERACTIVE" -eq 0 ]; then
        echo "" >&2
        printf "${CYAN}Proceed with installation? [Y/n]:${NC}\n" >&2
        printf "  > " >&2
        ask confirm
        if echo "${confirm:-}" | grep -qiE '^n'; then
            info "Installation cancelled."
            INSTALL_SUCCESS=1  # Suppress error message in cleanup
            exit 0
        fi
    fi

    echo "" >&2
    cache_sudo
    install_system_deps
    install_node
    setup_yarn
    check_disk
    clone_repo
    install_dependencies
    generate_config
    post_install
}

main "$@"
