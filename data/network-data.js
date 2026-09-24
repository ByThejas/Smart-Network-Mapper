/* =========================================================
   NEXUS NETWORK INTELLIGENCE SYSTEM
   SIMULATED NETWORK TELEMETRY DATASET

   Each object represents one network measurement collected
   at a specific geographic location and time.
========================================================= */

const networkData = [

    /* =====================================================
       SECTOR 01 — EXCELLENT / CENTRAL
    ====================================================== */

    {
        id: 1,
        latitude: 12.97160,
        longitude: 77.59460,
        signal: -61,
        download: 86.4,
        upload: 28.7,
        latency: 18,
        network: "5G",
        timestamp: "2026-09-24T09:10:00"
    },

    {
        id: 2,
        latitude: 12.97182,
        longitude: 77.59478,
        signal: -64,
        download: 79.2,
        upload: 25.4,
        latency: 21,
        network: "5G",
        timestamp: "2026-09-24T09:15:00"
    },

    {
        id: 3,
        latitude: 12.97205,
        longitude: 77.59492,
        signal: -67,
        download: 74.8,
        upload: 22.9,
        latency: 24,
        network: "5G",
        timestamp: "2026-09-24T09:20:00"
    },

    {
        id: 4,
        latitude: 12.97220,
        longitude: 77.59512,
        signal: -69,
        download: 69.5,
        upload: 21.2,
        latency: 27,
        network: "4G",
        timestamp: "2026-09-24T09:25:00"
    },

    {
        id: 5,
        latitude: 12.97238,
        longitude: 77.59530,
        signal: -65,
        download: 81.3,
        upload: 26.1,
        latency: 20,
        network: "5G",
        timestamp: "2026-09-24T09:30:00"
    },


    /* =====================================================
       SECTOR 02 — GOOD CONNECTIVITY
    ====================================================== */

    {
        id: 6,
        latitude: 12.97260,
        longitude: 77.59435,
        signal: -72,
        download: 58.4,
        upload: 18.7,
        latency: 34,
        network: "4G",
        timestamp: "2026-09-24T09:35:00"
    },

    {
        id: 7,
        latitude: 12.97282,
        longitude: 77.59452,
        signal: -74,
        download: 53.8,
        upload: 17.4,
        latency: 37,
        network: "4G",
        timestamp: "2026-09-24T09:40:00"
    },

    {
        id: 8,
        latitude: 12.97300,
        longitude: 77.59472,
        signal: -76,
        download: 49.6,
        upload: 16.8,
        latency: 40,
        network: "4G",
        timestamp: "2026-09-24T09:45:00"
    },

    {
        id: 9,
        latitude: 12.97318,
        longitude: 77.59491,
        signal: -70,
        download: 61.7,
        upload: 19.2,
        latency: 31,
        network: "5G",
        timestamp: "2026-09-24T09:50:00"
    },

    {
        id: 10,
        latitude: 12.97334,
        longitude: 77.59508,
        signal: -78,
        download: 45.2,
        upload: 14.9,
        latency: 43,
        network: "4G",
        timestamp: "2026-09-24T09:55:00"
    },


    /* =====================================================
       SECTOR 03 — MODERATE / TRANSITION
    ====================================================== */

    {
        id: 11,
        latitude: 12.97348,
        longitude: 77.59528,
        signal: -81,
        download: 38.6,
        upload: 12.4,
        latency: 52,
        network: "4G",
        timestamp: "2026-09-24T10:00:00"
    },

    {
        id: 12,
        latitude: 12.97364,
        longitude: 77.59546,
        signal: -83,
        download: 34.1,
        upload: 11.6,
        latency: 57,
        network: "4G",
        timestamp: "2026-09-24T10:05:00"
    },

    {
        id: 13,
        latitude: 12.97382,
        longitude: 77.59562,
        signal: -85,
        download: 29.7,
        upload: 9.8,
        latency: 63,
        network: "4G",
        timestamp: "2026-09-24T10:10:00"
    },

    {
        id: 14,
        latitude: 12.97400,
        longitude: 77.59580,
        signal: -87,
        download: 25.4,
        upload: 8.7,
        latency: 69,
        network: "4G",
        timestamp: "2026-09-24T10:15:00"
    },

    {
        id: 15,
        latitude: 12.97418,
        longitude: 77.59598,
        signal: -89,
        download: 22.8,
        upload: 7.9,
        latency: 74,
        network: "4G",
        timestamp: "2026-09-24T10:20:00"
    },


    /* =====================================================
       SECTOR 04 — DEAD ZONE CLUSTER
    ====================================================== */

    {
        id: 16,
        latitude: 12.97438,
        longitude: 77.59614,
        signal: -101,
        download: 8.7,
        upload: 2.8,
        latency: 118,
        network: "4G",
        timestamp: "2026-09-24T10:25:00"
    },

    {
        id: 17,
        latitude: 12.97452,
        longitude: 77.59630,
        signal: -105,
        download: 5.4,
        upload: 1.9,
        latency: 136,
        network: "4G",
        timestamp: "2026-09-24T10:30:00"
    },

    {
        id: 18,
        latitude: 12.97468,
        longitude: 77.59648,
        signal: -108,
        download: 4.2,
        upload: 1.4,
        latency: 143,
        network: "4G",
        timestamp: "2026-09-24T10:35:00"
    },

    {
        id: 19,
        latitude: 12.97484,
        longitude: 77.59664,
        signal: -106,
        download: 4.8,
        upload: 1.6,
        latency: 139,
        network: "4G",
        timestamp: "2026-09-24T10:40:00"
    },

    {
        id: 20,
        latitude: 12.97500,
        longitude: 77.59682,
        signal: -103,
        download: 7.1,
        upload: 2.2,
        latency: 127,
        network: "4G",
        timestamp: "2026-09-24T10:45:00"
    },

    {
        id: 21,
        latitude: 12.97455,
        longitude: 77.59670,
        signal: -109,
        download: 3.7,
        upload: 1.1,
        latency: 151,
        network: "4G",
        timestamp: "2026-09-24T10:50:00"
    },


    /* =====================================================
       SECTOR 05 — RECOVERY
    ====================================================== */

    {
        id: 22,
        latitude: 12.97518,
        longitude: 77.59698,
        signal: -94,
        download: 17.5,
        upload: 5.8,
        latency: 88,
        network: "4G",
        timestamp: "2026-09-24T10:55:00"
    },

    {
        id: 23,
        latitude: 12.97535,
        longitude: 77.59716,
        signal: -91,
        download: 21.7,
        upload: 7.1,
        latency: 76,
        network: "4G",
        timestamp: "2026-09-24T11:00:00"
    },

    {
        id: 24,
        latitude: 12.97552,
        longitude: 77.59732,
        signal: -88,
        download: 27.9,
        upload: 9.2,
        latency: 64,
        network: "4G",
        timestamp: "2026-09-24T11:05:00"
    },

    {
        id: 25,
        latitude: 12.97570,
        longitude: 77.59748,
        signal: -84,
        download: 33.5,
        upload: 11.4,
        latency: 53,
        network: "4G",
        timestamp: "2026-09-24T11:10:00"
    },


    /* =====================================================
       SECTOR 06 — HIGH LATENCY / GOOD SIGNAL
    ====================================================== */

    {
        id: 26,
        latitude: 12.97588,
        longitude: 77.59764,
        signal: -68,
        download: 41.2,
        upload: 13.8,
        latency: 112,
        network: "5G",
        timestamp: "2026-09-24T11:15:00"
    },

    {
        id: 27,
        latitude: 12.97605,
        longitude: 77.59780,
        signal: -71,
        download: 43.7,
        upload: 14.2,
        latency: 126,
        network: "5G",
        timestamp: "2026-09-24T11:20:00"
    },

    {
        id: 28,
        latitude: 12.97622,
        longitude: 77.59796,
        signal: -69,
        download: 47.1,
        upload: 15.1,
        latency: 118,
        network: "5G",
        timestamp: "2026-09-24T11:25:00"
    },

    {
        id: 29,
        latitude: 12.97640,
        longitude: 77.59812,
        signal: -73,
        download: 39.8,
        upload: 12.7,
        latency: 133,
        network: "5G",
        timestamp: "2026-09-24T11:30:00"
    },


    /* =====================================================
       SECTOR 07 — STRONG / LOW LATENCY
    ====================================================== */

    {
        id: 30,
        latitude: 12.97658,
        longitude: 77.59828,
        signal: -58,
        download: 91.5,
        upload: 31.4,
        latency: 16,
        network: "5G",
        timestamp: "2026-09-24T11:35:00"
    },

    {
        id: 31,
        latitude: 12.97676,
        longitude: 77.59844,
        signal: -62,
        download: 84.7,
        upload: 28.6,
        latency: 19,
        network: "5G",
        timestamp: "2026-09-24T11:40:00"
    },

    {
        id: 32,
        latitude: 12.97694,
        longitude: 77.59860,
        signal: -65,
        download: 78.3,
        upload: 25.1,
        latency: 22,
        network: "5G",
        timestamp: "2026-09-24T11:45:00"
    },

    {
        id: 33,
        latitude: 12.97712,
        longitude: 77.59876,
        signal: -67,
        download: 73.8,
        upload: 23.7,
        latency: 25,
        network: "5G",
        timestamp: "2026-09-24T11:50:00"
    },


    /* =====================================================
       SECTOR 08 — SECOND DEAD ZONE CLUSTER
    ====================================================== */

    {
        id: 34,
        latitude: 12.97730,
        longitude: 77.59892,
        signal: -98,
        download: 11.4,
        upload: 3.5,
        latency: 104,
        network: "4G",
        timestamp: "2026-09-24T11:55:00"
    },

    {
        id: 35,
        latitude: 12.97746,
        longitude: 77.59908,
        signal: -102,
        download: 7.8,
        upload: 2.6,
        latency: 121,
        network: "4G",
        timestamp: "2026-09-24T12:00:00"
    },

    {
        id: 36,
        latitude: 12.97762,
        longitude: 77.59924,
        signal: -107,
        download: 4.6,
        upload: 1.5,
        latency: 147,
        network: "4G",
        timestamp: "2026-09-24T12:05:00"
    },

    {
        id: 37,
        latitude: 12.97778,
        longitude: 77.59940,
        signal: -104,
        download: 5.8,
        upload: 1.8,
        latency: 139,
        network: "4G",
        timestamp: "2026-09-24T12:10:00"
    },

    {
        id: 38,
        latitude: 12.97794,
        longitude: 77.59956,
        signal: -101,
        download: 8.1,
        upload: 2.5,
        latency: 128,
        network: "4G",
        timestamp: "2026-09-24T12:15:00"
    },


    /* =====================================================
       SECTOR 09 — WI-FI POCKET
    ====================================================== */

    {
        id: 39,
        latitude: 12.97810,
        longitude: 77.59972,
        signal: -48,
        download: 94.5,
        upload: 42.8,
        latency: 9,
        network: "Wi-Fi",
        timestamp: "2026-09-24T12:20:00"
    },

    {
        id: 40,
        latitude: 12.97826,
        longitude: 77.59988,
        signal: -52,
        download: 89.7,
        upload: 39.2,
        latency: 11,
        network: "Wi-Fi",
        timestamp: "2026-09-24T12:25:00"
    },

    {
        id: 41,
        latitude: 12.97842,
        longitude: 77.60004,
        signal: -55,
        download: 83.1,
        upload: 35.6,
        latency: 13,
        network: "Wi-Fi",
        timestamp: "2026-09-24T12:30:00"
    },


    /* =====================================================
       SECTOR 10 — ISOLATED ANOMALIES
    ====================================================== */

    {
        id: 42,
        latitude: 12.97858,
        longitude: 77.60020,
        signal: -96,
        download: 28.4,
        upload: 9.1,
        latency: 61,
        network: "4G",
        timestamp: "2026-09-24T12:35:00"
    },

    {
        id: 43,
        latitude: 12.97874,
        longitude: 77.60036,
        signal: -73,
        download: 6.8,
        upload: 2.1,
        latency: 49,
        network: "4G",
        timestamp: "2026-09-24T12:40:00"
    },

    {
        id: 44,
        latitude: 12.97890,
        longitude: 77.60052,
        signal: -66,
        download: 46.2,
        upload: 15.3,
        latency: 154,
        network: "5G",
        timestamp: "2026-09-24T12:45:00"
    },


    /* =====================================================
       SECTOR 11 — GOOD RECOVERY
    ====================================================== */

    {
        id: 45,
        latitude: 12.97906,
        longitude: 77.60068,
        signal: -75,
        download: 51.8,
        upload: 17.2,
        latency: 35,
        network: "5G",
        timestamp: "2026-09-24T12:50:00"
    },

    {
        id: 46,
        latitude: 12.97922,
        longitude: 77.60084,
        signal: -70,
        download: 63.4,
        upload: 20.8,
        latency: 28,
        network: "5G",
        timestamp: "2026-09-24T12:55:00"
    },

    {
        id: 47,
        latitude: 12.97938,
        longitude: 77.60100,
        signal: -68,
        download: 69.1,
        upload: 22.7,
        latency: 25,
        network: "5G",
        timestamp: "2026-09-24T13:00:00"
    },


    /* =====================================================
       SECTOR 12 — FINAL DEAD-ZONE POCKET
    ====================================================== */

    {
        id: 48,
        latitude: 12.97954,
        longitude: 77.60116,
        signal: -100,
        download: 9.2,
        upload: 3.0,
        latency: 112,
        network: "4G",
        timestamp: "2026-09-24T13:05:00"
    },

    {
        id: 49,
        latitude: 12.97970,
        longitude: 77.60132,
        signal: -104,
        download: 6.1,
        upload: 2.0,
        latency: 134,
        network: "4G",
        timestamp: "2026-09-24T13:10:00"
    },

    {
        id: 50,
        latitude: 12.97986,
        longitude: 77.60148,
        signal: -107,
        download: 4.4,
        upload: 1.4,
        latency: 146,
        network: "4G",
        timestamp: "2026-09-24T13:15:00"
    },

    {
        id: 51,
        latitude: 12.98002,
        longitude: 77.60164,
        signal: -105,
        download: 5.0,
        upload: 1.7,
        latency: 141,
        network: "4G",
        timestamp: "2026-09-24T13:20:00"
    },

    {
        id: 52,
        latitude: 12.98018,
        longitude: 77.60180,
        signal: -101,
        download: 8.5,
        upload: 2.7,
        latency: 126,
        network: "4G",
        timestamp: "2026-09-24T13:25:00"
    },


    /* =====================================================
       ADDITIONAL STABLE POINTS
    ====================================================== */

    {
        id: 53,
        latitude: 12.98034,
        longitude: 77.60196,
        signal: -63,
        download: 82.6,
        upload: 27.5,
        latency: 20,
        network: "5G",
        timestamp: "2026-09-24T13:30:00"
    },

    {
        id: 54,
        latitude: 12.98050,
        longitude: 77.60212,
        signal: -67,
        download: 76.3,
        upload: 24.8,
        latency: 23,
        network: "5G",
        timestamp: "2026-09-24T13:35:00"
    },

    {
        id: 55,
        latitude: 12.98066,
        longitude: 77.60228,
        signal: -71,
        download: 62.7,
        upload: 20.1,
        latency: 29,
        network: "5G",
        timestamp: "2026-09-24T13:40:00"
    },

    {
        id: 56,
        latitude: 12.98082,
        longitude: 77.60244,
        signal: -77,
        download: 47.5,
        upload: 15.6,
        latency: 38,
        network: "4G",
        timestamp: "2026-09-24T13:45:00"
    },

    {
        id: 57,
        latitude: 12.98098,
        longitude: 77.60260,
        signal: -80,
        download: 41.3,
        upload: 13.4,
        latency: 46,
        network: "4G",
        timestamp: "2026-09-24T13:50:00"
    },

    {
        id: 58,
        latitude: 12.98114,
        longitude: 77.60276,
        signal: -83,
        download: 35.9,
        upload: 11.8,
        latency: 54,
        network: "4G",
        timestamp: "2026-09-24T13:55:00"
    },

    {
        id: 59,
        latitude: 12.98130,
        longitude: 77.60292,
        signal: -86,
        download: 31.2,
        upload: 10.2,
        latency: 61,
        network: "4G",
        timestamp: "2026-09-24T14:00:00"
    },

    {
        id: 60,
        latitude: 12.98146,
        longitude: 77.60308,
        signal: -90,
        download: 23.7,
        upload: 7.6,
        latency: 72,
        network: "4G",
        timestamp: "2026-09-24T14:05:00"
    }

];

/* =========================================================
   DATASET METADATA
========================================================= */

const networkDatasetInfo = {
    name: "NEXUS Spatial Network Survey",
    version: "2.0",
    measurementCount: networkData.length,
    region: "Bengaluru Spatial Test Region",
    collectionMode: "SIMULATED",
    lastUpdated: "2026-09-24T14:05:00",
    networks: [
        "5G",
        "4G",
        "Wi-Fi"
    ]
};


/* =========================================================
   EXPOSE DATA GLOBALLY
   app.js will use these variables.
========================================================= */

window.networkData = networkData;
window.networkDatasetInfo = networkDatasetInfo;