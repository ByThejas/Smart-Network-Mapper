/* ============================================================
   NEXUS NETWORK INTELLIGENCE SYSTEM
   Location-Aware Spatial Network Analysis
   ============================================================ */

let networkMap;

let renderedMarkers = [];
let renderedZones = [];

let currentFilter = "ALL";

let processedMeasurements = [];
let deadZones = [];

let scanInProgress = false;

let userLocation = null;
let userLocationMarker = null;
let userAccuracyCircle = null;
let userPulse = null;

const CONFIG = {

    weights: {
        signal: 0.40,
        download: 0.25,
        upload: 0.10,
        latency: 0.25
    },

    thresholds: {
        excellent: 80,
        good: 60,
        weak: 40
    },

    deadZoneThreshold: 40,

    clusterDistance: 0.00055,

    localRadius: 0.0018,

    mapZoom: 15,

    referenceLocation: {
        latitude: 12.9716,
        longitude: 77.5946
    }
};


/* ============================================================
   DOM
   ============================================================ */

const $ = id => document.getElementById(id);

function setText(id, value) {

    const element = $(id);

    if (element) {
        element.textContent = value;
    }
}


/* ============================================================
   NORMALIZATION
   ============================================================ */

function normalizeSignal(signal) {

    return Math.max(
        0,
        Math.min(
            100,
            ((signal + 110) / 60) * 100
        )
    );
}


function normalizeDownload(download) {

    return Math.max(
        0,
        Math.min(
            100,
            download
        )
    );
}


function normalizeUpload(upload) {

    return Math.max(
        0,
        Math.min(
            100,
            (upload / 50) * 100
        )
    );
}


function normalizeLatency(latency) {

    return Math.max(
        0,
        Math.min(
            100,
            ((200 - latency) / 190) * 100
        )
    );
}


/* ============================================================
   NETWORK SCORE
   ============================================================ */

function calculateNetworkScore(point) {

    const signal =
        normalizeSignal(point.signal);

    const download =
        normalizeDownload(point.download);

    const upload =
        normalizeUpload(point.upload);

    const latency =
        normalizeLatency(point.latency);

    return Math.round(
        signal * CONFIG.weights.signal +
        download * CONFIG.weights.download +
        upload * CONFIG.weights.upload +
        latency * CONFIG.weights.latency
    );
}


/* ============================================================
   CLASSIFICATION
   ============================================================ */

function classifyScore(score) {

    if (score >= 80) {

        return {
            label: "EXCELLENT",
            color: "#20e6a3"
        };
    }

    if (score >= 60) {

        return {
            label: "GOOD",
            color: "#00e5ff"
        };
    }

    if (score >= 40) {

        return {
            label: "WEAK",
            color: "#ffb020"
        };
    }

    return {
        label: "DEAD ZONE",
        color: "#ff304f"
    };
}


/* ============================================================
   DIAGNOSIS
   ============================================================ */

function diagnose(point) {

    if (
        point.signal <= -100 &&
        point.latency >= 150 &&
        point.download <= 10
    ) {

        return {
            title:
                "SEVERE CONNECTIVITY DEGRADATION",

            description:
                "Multiple network indicators are significantly degraded."
        };
    }


    if (point.signal <= -100) {

        return {
            title:
                "WEAK SIGNAL",

            description:
                "Low received signal strength is the dominant anomaly."
        };
    }


    if (point.download <= 12) {

        return {
            title:
                "LOW BANDWIDTH",

            description:
                "Download throughput is significantly below the expected range."
        };
    }


    if (point.upload <= 5) {

        return {
            title:
                "LOW UPLOAD CAPACITY",

            description:
                "Uplink performance is limiting network quality."
        };
    }


    if (point.latency >= 120) {

        return {
            title:
                "HIGH LATENCY",

            description:
                "Network response time is elevated despite available signal."
        };
    }


    return {
        title:
            "NORMAL OPERATION",

        description:
            "No significant network anomaly detected."
    };
}


/* ============================================================
   DISTANCE
   ============================================================ */

function distanceBetween(a, b) {

    const lat =
        a.latitude -
        b.latitude;

    const lon =
        a.longitude -
        b.longitude;

    return Math.sqrt(
        lat * lat +
        lon * lon
    );
}


/* ============================================================
   APPROXIMATE METERS
   ============================================================ */

function distanceInMeters(a, b) {

    const latMeters =
        (a.latitude - b.latitude) *
        111320;

    const lonMeters =
        (a.longitude - b.longitude) *
        111320 *
        Math.cos(
            a.latitude *
            Math.PI /
            180
        );

    return Math.sqrt(
        latMeters * latMeters +
        lonMeters * lonMeters
    );
}


/* ============================================================
   CONFIDENCE
   ============================================================ */

function calculateConfidence(
    point,
    dataset
) {

    const nearby =
        dataset.filter(
            other => {

                if (
                    other.id === point.id
                ) {
                    return false;
                }

                return (
                    distanceBetween(
                        point,
                        other
                    ) <=
                    CONFIG.clusterDistance
                );
            }
        );


    if (!nearby.length) {
        return 61;
    }


    const scores =
        nearby.map(
            item =>
                calculateNetworkScore(
                    item
                )
        );


    const average =
        scores.reduce(
            (sum, value) =>
                sum + value,
            0
        ) / scores.length;


    const difference =
        Math.abs(
            average -
            calculateNetworkScore(point)
        );


    let confidence =
        94 -
        difference * 1.8;


    confidence +=
        Math.min(
            5,
            nearby.length
        );


    return Math.round(
        Math.max(
            55,
            Math.min(
                99,
                confidence
            )
        )
    );
}


/* ============================================================
   PROCESS DATA
   ============================================================ */

function processMeasurements() {

    processedMeasurements =
        networkData.map(point => {

            const score =
                calculateNetworkScore(
                    point
                );

            return {

                ...point,

                score,

                classification:
                    classifyScore(
                        score
                    ),

                diagnosis:
                    diagnose(
                        point
                    ),

                confidence:
                    calculateConfidence(
                        point,
                        networkData
                    )
            };
        });


    return processedMeasurements;
}


/* ============================================================
   DEAD ZONES
   ============================================================ */

function detectDeadZones(dataset) {

    const critical =
        dataset.filter(
            point =>
                point.score <
                CONFIG.deadZoneThreshold
        );


    const visited =
        new Set();

    const clusters = [];


    for (
        const point
        of critical
    ) {

        if (
            visited.has(
                point.id
            )
        ) {
            continue;
        }


        const cluster = [];

        const queue = [point];

        visited.add(point.id);


        while (queue.length) {

            const current =
                queue.shift();

            cluster.push(
                current
            );


            for (
                const candidate
                of critical
            ) {

                if (
                    visited.has(
                        candidate.id
                    )
                ) {
                    continue;
                }


                if (
                    distanceBetween(
                        current,
                        candidate
                    ) <=
                    CONFIG.clusterDistance
                ) {

                    visited.add(
                        candidate.id
                    );

                    queue.push(
                        candidate
                    );
                }
            }
        }


        if (
            cluster.length >= 2
        ) {

            clusters.push(
                cluster
            );
        }
    }


    return clusters.map(
        (cluster, index) => {

            const latitude =
                cluster.reduce(
                    (sum, point) =>
                        sum +
                        point.latitude,
                    0
                ) /
                cluster.length;


            const longitude =
                cluster.reduce(
                    (sum, point) =>
                        sum +
                        point.longitude,
                    0
                ) /
                cluster.length;


            const averageScore =
                cluster.reduce(
                    (sum, point) =>
                        sum +
                        point.score,
                    0
                ) /
                cluster.length;


            const causes = {};


            cluster.forEach(
                point => {

                    const cause =
                        point.diagnosis.title;

                    causes[cause] =
                        (causes[cause] || 0) +
                        1;
                }
            );


            const diagnosis =
                Object.entries(
                    causes
                ).sort(
                    (a, b) =>
                        b[1] -
                        a[1]
                )[0][0];


            return {

                id:
                    `DZ-${String(
                        index + 1
                    ).padStart(2, "0")}`,

                latitude,

                longitude,

                points:
                    cluster,

                size:
                    cluster.length,

                averageScore:
                    Math.round(
                        averageScore
                    ),

                diagnosis
            };
        }
    );
}


/* ============================================================
   MAP
   ============================================================ */

function initializeMap() {

    networkMap =
        L.map(
            "networkMap",
            {
                zoomControl: false,

                attributionControl: true
            }
        ).setView(
            [
                CONFIG.referenceLocation.latitude,
                CONFIG.referenceLocation.longitude
            ],

            CONFIG.mapZoom
        );


    L.control.zoom({
        position:
            "bottomright"
    }).addTo(
        networkMap
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(
        networkMap
    );


    createLocationControl();

    createLocationStatus();

    requestUserLocation();
}


/* ============================================================
   LOCATION CONTROL
   ============================================================ */

function createLocationControl() {

    const button =
        document.createElement(
            "button"
        );


    button.id =
        "locateMeButton";

    button.className =
        "nexus-location-control";


    button.innerHTML = `
        <span class="locate-icon">◎</span>
        <span>LOCATE ME</span>
    `;


    button.addEventListener(
        "click",
        () => {

            if (
                userLocation
            ) {

                networkMap.flyTo(
                    [
                        userLocation.latitude,
                        userLocation.longitude
                    ],

                    17,

                    {
                        duration:
                            1.2
                    }
                );

            }
            else {

                requestUserLocation(
                    true
                );
            }
        }
    );


    document
        .getElementById(
            "networkMap"
        )
        .appendChild(
            button
        );
}


/* ============================================================
   LOCATION STATUS
   ============================================================ */

function createLocationStatus() {

    const panel =
        document.createElement(
            "div"
        );


    panel.id =
        "locationStatus";

    panel.className =
        "location-status";


    panel.innerHTML = `

        <div class="location-status-dot"></div>

        <div>

            <div class="location-status-title">
                LOCATION
            </div>

            <div
                id="locationStatusText"
                class="location-status-text"
            >
                ACQUIRING POSITION...
            </div>

        </div>

    `;


    document
        .getElementById(
            "networkMap"
        )
        .appendChild(
            panel
        );
}


/* ============================================================
   GEOLOCATION
   ============================================================ */

function requestUserLocation(
    showEvent = false
) {

    if (
        !navigator.geolocation
    ) {

        handleLocationFailure(
            "GEOLOCATION UNSUPPORTED"
        );

        return;
    }


    updateLocationStatus(
        "REQUESTING ACCESS..."
    );


    navigator.geolocation.getCurrentPosition(

        position => {

            userLocation = {

                latitude:
                    position.coords.latitude,

                longitude:
                    position.coords.longitude,

                accuracy:
                    position.coords.accuracy
            };


            handleLocationSuccess(
                showEvent
            );
        },


        error => {

            let message =
                "LOCATION ACCESS DENIED";


            if (
                error.code ===
                error.POSITION_UNAVAILABLE
            ) {

                message =
                    "POSITION UNAVAILABLE";
            }


            if (
                error.code ===
                error.TIMEOUT
            ) {

                message =
                    "LOCATION REQUEST TIMEOUT";
            }


            handleLocationFailure(
                message
            );
        },


        {
            enableHighAccuracy:
                true,

            timeout:
                12000,

            maximumAge:
                60000
        }
    );
}


/* ============================================================
   LOCATION SUCCESS
   ============================================================ */

function handleLocationSuccess(
    showEvent
) {

    updateLocationStatus(
        "POSITION LOCKED"
    );


    addUserLocationMarker();


    networkMap.flyTo(
        [
            userLocation.latitude,
            userLocation.longitude
        ],

        16,

        {
            duration:
                1.5
        }
    );


    updateCoordinates(
        processedMeasurements
    );


    renderSystem();


    if (
        showEvent
    ) {

        addEvent(
            "GPS",
            "User position acquired",
            "LOCKED"
        );

    }
    else {

        addEvent(
            "GPS",
            "Location services initialized",
            "LOCKED"
        );
    }
}


/* ============================================================
   LOCATION FAILURE
   ============================================================ */

function handleLocationFailure(
    message
) {

    updateLocationStatus(
        "FALLBACK REGION"
    );


    addEvent(
        "GPS",
        `${message} — using simulated survey region`,
        "FALLBACK"
    );


    networkMap.setView(
        [
            CONFIG.referenceLocation.latitude,
            CONFIG.referenceLocation.longitude
        ],

        CONFIG.mapZoom
    );
}


/* ============================================================
   LOCATION STATUS
   ============================================================ */

function updateLocationStatus(
    message
) {

    const element =
        $("locationStatusText");


    if (element) {
        element.textContent =
            message;
    }
}


/* ============================================================
   USER MARKER
   ============================================================ */

function addUserLocationMarker() {

    if (
        userLocationMarker
    ) {

        networkMap.removeLayer(
            userLocationMarker
        );
    }


    if (
        userAccuracyCircle
    ) {

        networkMap.removeLayer(
            userAccuracyCircle
        );
    }


    if (
        userPulse
    ) {

        networkMap.removeLayer(
            userPulse
        );
    }


    const position = [

        userLocation.latitude,

        userLocation.longitude
    ];


    userAccuracyCircle =
        L.circle(
            position,
            {

                radius:
                    Math.min(
                        userLocation.accuracy,
                        300
                    ),

                color:
                    "#00e5ff",

                fillColor:
                    "#00e5ff",

                fillOpacity:
                    0.045,

                weight:
                    1,

                dashArray:
                    "4 6"
            }
        ).addTo(
            networkMap
        );


    userPulse =
        L.circleMarker(
            position,
            {

                radius:
                    18,

                color:
                    "#00e5ff",

                fillOpacity:
                    0,

                weight:
                    1
            }
        ).addTo(
            networkMap
        );


    const icon =
        L.divIcon({

            className:
                "nexus-user-marker",

            html: `

                <div class="user-marker-outer">

                    <div
                        class="user-marker-ring"
                    ></div>

                    <div
                        class="user-marker-core"
                    ></div>

                    <div
                        class="user-marker-cross"
                    ></div>

                </div>

            `,

            iconSize:
                [42, 42],

            iconAnchor:
                [21, 21]
        });


    userLocationMarker =
        L.marker(
            position,
            {

                icon,

                zIndexOffset:
                    5000
            }
        ).addTo(
            networkMap
        );


    userLocationMarker.bindPopup(`

        <div class="nexus-popup">

            <div class="popup-title">
                LOCAL POSITION
            </div>

            <div
                class="popup-status"
                style="color:#00e5ff"
            >
                GPS LOCKED
            </div>

            <div class="popup-grid">

                <span>LATITUDE</span>

                <strong>
                    ${userLocation.latitude.toFixed(6)}
                </strong>

                <span>LONGITUDE</span>

                <strong>
                    ${userLocation.longitude.toFixed(6)}
                </strong>

                <span>ACCURACY</span>

                <strong>
                    ±${Math.round(
                        userLocation.accuracy
                    )} m
                </strong>

            </div>

        </div>

    `);
}


/* ============================================================
   DISPLAY COORDINATES
   ============================================================ */

function getDisplayCoordinates(
    point
) {

    if (
        !userLocation
    ) {

        return {

            latitude:
                point.latitude,

            longitude:
                point.longitude
        };
    }


    return {

        latitude:
            userLocation.latitude +
            (
                point.latitude -
                CONFIG.referenceLocation.latitude
            ),

        longitude:
            userLocation.longitude +
            (
                point.longitude -
                CONFIG.referenceLocation.longitude
            )
    };
}


/* ============================================================
   MARKERS
   ============================================================ */

function clearMarkers() {

    renderedMarkers.forEach(
        marker =>
            networkMap.removeLayer(
                marker
            )
    );


    renderedMarkers = [];
}


function renderMarkers(
    dataset
) {

    clearMarkers();


    dataset.forEach(
        point => {

            const coordinates =
                getDisplayCoordinates(
                    point
                );


            const marker =
                L.circleMarker(
                    [
                        coordinates.latitude,
                        coordinates.longitude
                    ],
                    {

                        radius:
                            point.classification.label ===
                            "DEAD ZONE"
                                ? 7
                                : 5,

                        color:
                            point.classification.color,

                        fillColor:
                            point.classification.color,

                        fillOpacity:
                            0.82,

                        weight:
                            1.5,

                        className:
                            "network-node"
                    }
                );


            marker.bindPopup(`

                <div class="nexus-popup">

                    <div class="popup-title">
                        NODE ${point.id}
                    </div>

                    <div
                        class="popup-status"
                        style="
                            color:${point.classification.color}
                        "
                    >
                        ${point.classification.label}
                    </div>

                    <div class="popup-score">

                        NETWORK SCORE

                        <strong>
                            ${point.score}
                        </strong>

                    </div>

                    <div class="popup-grid">

                        <span>SIGNAL</span>
                        <strong>
                            ${point.signal} dBm
                        </strong>

                        <span>DOWNLOAD</span>
                        <strong>
                            ${point.download} Mbps
                        </strong>

                        <span>UPLOAD</span>
                        <strong>
                            ${point.upload} Mbps
                        </strong>

                        <span>LATENCY</span>
                        <strong>
                            ${point.latency} ms
                        </strong>

                        <span>NETWORK</span>
                        <strong>
                            ${point.network}
                        </strong>

                        <span>CONFIDENCE</span>
                        <strong>
                            ${point.confidence}%
                        </strong>

                    </div>

                    <div class="popup-diagnosis">
                        ${point.diagnosis.title}
                    </div>

                </div>

            `);


            marker.on(
                "click",
                () =>
                    updateSelectedIntelligence(
                        point
                    )
            );


            marker.addTo(
                networkMap
            );


            renderedMarkers.push(
                marker
            );
        }
    );
}


/* ============================================================
   DEAD ZONE OVERLAYS
   ============================================================ */

function clearDeadZones() {

    renderedZones.forEach(
        zone =>
            networkMap.removeLayer(
                zone
            )
    );


    renderedZones = [];
}


function renderDeadZones(
    zones
) {

    clearDeadZones();


    zones.forEach(
        zone => {

            const coordinates =
                getDisplayCoordinates(
                    zone
                );


            const radius =
                Math.max(
                    35,
                    zone.size * 22
                );


            const circle =
                L.circle(
                    [
                        coordinates.latitude,
                        coordinates.longitude
                    ],
                    {

                        radius,

                        color:
                            "#ff304f",

                        fillColor:
                            "#ff304f",

                        fillOpacity:
                            0.075,

                        weight:
                            1.5,

                        dashArray:
                            "6 6"
                    }
                );


            circle.bindPopup(`

                <div class="nexus-popup">

                    <div class="popup-title">
                        ${zone.id}
                    </div>

                    <div
                        class="popup-status"
                        style="color:#ff304f"
                    >
                        DEAD ZONE CLUSTER
                    </div>

                    <div class="popup-grid">

                        <span>MEASUREMENTS</span>

                        <strong>
                            ${zone.size}
                        </strong>

                        <span>AVG SCORE</span>

                        <strong>
                            ${zone.averageScore}
                        </strong>

                        <span>PRIMARY CAUSE</span>

                        <strong>
                            ${zone.diagnosis}
                        </strong>

                    </div>

                </div>

            `);


            circle.addTo(
                networkMap
            );


            renderedZones.push(
                circle
            );
        }
    );
}


/* ============================================================
   FILTER
   ============================================================ */

function getFilteredData() {

    if (
        currentFilter ===
        "ALL"
    ) {

        return processedMeasurements;
    }


    return processedMeasurements.filter(
        point =>
            point.network.toUpperCase() ===
            currentFilter
    );
}


/* ============================================================
   LOCAL INTELLIGENCE
   ============================================================ */

function calculateLocalIntelligence() {

    if (
        !userLocation
    ) {

        return null;
    }


    /*
       Convert user position into the
       same coordinate space as the
       original simulated dataset.
    */

    const virtualUser = {

        latitude:
            CONFIG.referenceLocation.latitude,

        longitude:
            CONFIG.referenceLocation.longitude
    };


    const nearby =
        processedMeasurements
            .map(
                point => ({

                    ...point,

                    distance:
                        distanceInMeters(
                            virtualUser,
                            {
                                latitude:
                                    point.latitude,

                                longitude:
                                    point.longitude
                            }
                        )
                })
            )
            .filter(
                point =>
                    point.distance <=
                    CONFIG.localRadius *
                    111320
            )
            .sort(
                (a, b) =>
                    a.distance -
                    b.distance
            );


    /*
       If no points fall within the
       local radius, use nearest nodes.
    */

    const localPoints =
        nearby.length
            ? nearby.slice(0, 12)
            : processedMeasurements
                .map(
                    point => ({

                        ...point,

                        distance:
                            distanceInMeters(
                                virtualUser,
                                {
                                    latitude:
                                        point.latitude,

                                    longitude:
                                        point.longitude
                                }
                            )
                    })
                )
                .sort(
                    (a, b) =>
                        a.distance -
                        b.distance
                )
                .slice(0, 8);


    if (!localPoints.length) {
        return null;
    }


    const averageScore =
        localPoints.reduce(
            (sum, point) =>
                sum + point.score,
            0
        ) /
        localPoints.length;


    const averageSignal =
        localPoints.reduce(
            (sum, point) =>
                sum + point.signal,
            0
        ) /
        localPoints.length;


    const averageLatency =
        localPoints.reduce(
            (sum, point) =>
                sum + point.latency,
            0
        ) /
        localPoints.length;


    const localScore =
        Math.round(
            averageScore
        );


    const classification =
        classifyScore(
            localScore
        );


    const nearestDeadZone =
        deadZones
            .map(
                zone => ({

                    ...zone,

                    distance:
                        distanceInMeters(
                            virtualUser,
                            zone
                        )
                })
            )
            .sort(
                (a, b) =>
                    a.distance -
                    b.distance
            )[0] || null;


    return {

        score:
            localScore,

        classification,

        signal:
            Math.round(
                averageSignal
            ),

        latency:
            Math.round(
                averageLatency
            ),

        nodes:
            localPoints.length,

        nearestDeadZone,

        nearby:
            localPoints
    };
}


/* ============================================================
   LOCAL INTELLIGENCE UI
   ============================================================ */

function createLocalIntelligencePanel() {

    if (
        $("localIntelligence")
    ) {
        return;
    }


    const panel =
        document.createElement(
            "section"
        );


    panel.id =
        "localIntelligence";


    panel.className =
        "intelligence-section local-intelligence-section";


    panel.innerHTML = `

        <div class="section-label">
            LOCAL INTELLIGENCE
        </div>

        <div class="local-score-row">

            <div>

                <div
                    id="localScore"
                    class="local-score"
                >
                    --
                </div>

                <div
                    id="localCondition"
                    class="local-condition"
                >
                    ACQUIRING
                </div>

            </div>

            <div class="local-score-caption">
                NETWORK<br>
                SCORE
            </div>

        </div>


        <div class="local-metrics">

            <div>
                <span>
                    SIGNAL
                </span>

                <strong
                    id="localSignal"
                >
                    --
                </strong>
            </div>

            <div>
                <span>
                    LATENCY
                </span>

                <strong
                    id="localLatency"
                >
                    --
                </strong>
            </div>

            <div>
                <span>
                    NODES
                </span>

                <strong
                    id="localNodes"
                >
                    --
                </strong>
            </div>

        </div>


        <div class="local-anomaly">

            <div class="local-anomaly-label">
                NEAREST ANOMALY
            </div>

            <div
                id="localAnomaly"
                class="local-anomaly-value"
            >
                ANALYZING...
            </div>

            <div
                id="localDistance"
                class="local-distance"
            >
                --
            </div>

        </div>


        <div
            id="localRecommendation"
            class="local-recommendation"
        >
            Acquiring local network intelligence...
        </div>

    `;


    const intelligence =
        document.querySelector(
            ".intelligence"
        );


    if (!intelligence) {
        return;
    }


    const header =
        intelligence.querySelector(
            ".intelligence-header"
        );


    if (
        header &&
        header.nextElementSibling
    ) {

        intelligence.insertBefore(
            panel,
            header.nextElementSibling
        );

    }
    else {

        intelligence.appendChild(
            panel
        );
    }
}


/* ============================================================
   UPDATE LOCAL INTELLIGENCE
   ============================================================ */

function updateLocalIntelligence() {

    const panel =
        $("localIntelligence");


    if (!panel) {
        return;
    }


    if (
        !userLocation
    ) {

        setText(
            "localScore",
            "--"
        );

        setText(
            "localCondition",
            "GPS REQUIRED"
        );

        setText(
            "localSignal",
            "--"
        );

        setText(
            "localLatency",
            "--"
        );

        setText(
            "localNodes",
            "--"
        );

        setText(
            "localAnomaly",
            "POSITION REQUIRED"
        );

        setText(
            "localDistance",
            "--"
        );

        setText(
            "localRecommendation",
            "Enable location services to calculate local network intelligence."
        );

        return;
    }


    const local =
        calculateLocalIntelligence();


    if (!local) {
        return;
    }


    setText(
        "localScore",
        local.score
    );


    setText(
        "localCondition",
        local.classification.label
    );


    setText(
        "localSignal",
        `${local.signal} dBm`
    );


    setText(
        "localLatency",
        `${local.latency} ms`
    );


    setText(
        "localNodes",
        local.nodes
    );


    const condition =
        $("localCondition");


    if (condition) {

        condition.style.color =
            local.classification.color;
    }


    if (
        local.nearestDeadZone
    ) {

        const zone =
            local.nearestDeadZone;


        setText(
            "localAnomaly",
            zone.id
        );


        setText(
            "localDistance",
            formatDistance(
                zone.distance
            )
        );

    }
    else {

        setText(
            "localAnomaly",
            "NONE DETECTED"
        );

        setText(
            "localDistance",
            "CLEAR"
        );
    }


    let recommendation;


    if (
        local.score >= 80
    ) {

        recommendation =
            "Excellent local connectivity detected. No immediate intervention required.";

    }
    else if (
        local.score >= 60
    ) {

        recommendation =
            "Local connectivity is stable with minor performance variation.";

    }
    else if (
        local.score >= 40
    ) {

        recommendation =
            "Moderate degradation detected. Monitor nearby network conditions.";

    }
    else {

        recommendation =
            "Poor local connectivity detected. A nearby coverage anomaly may affect service.";
    }


    if (
        local.nearestDeadZone &&
        local.nearestDeadZone.distance <
        500
    ) {

        recommendation +=
            ` Nearest dead zone is ${formatDistance(
                local.nearestDeadZone.distance
            )} away.`;
    }


    setText(
        "localRecommendation",
        recommendation
    );
}


/* ============================================================
   DISTANCE FORMAT
   ============================================================ */

function formatDistance(
    meters
) {

    if (
        meters < 1000
    ) {

        return `${Math.round(
            meters
        )} m`;
    }


    return `${(
        meters / 1000
    ).toFixed(2)} km`;
}


/* ============================================================
   DASHBOARD
   ============================================================ */

function updateDashboard(
    dataset
) {

    if (!dataset.length) {
        return;
    }


    const averageSignal =
        dataset.reduce(
            (sum, point) =>
                sum + point.signal,
            0
        ) /
        dataset.length;


    const averageDownload =
        dataset.reduce(
            (sum, point) =>
                sum + point.download,
            0
        ) /
        dataset.length;


    const averageLatency =
        dataset.reduce(
            (sum, point) =>
                sum + point.latency,
            0
        ) /
        dataset.length;


    const averageScore =
        dataset.reduce(
            (sum, point) =>
                sum + point.score,
            0
        ) /
        dataset.length;


    const stability =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    100 -
                    Math.abs(
                        averageLatency -
                        45
                    ) *
                    0.55
                )
            )
        );


    setText(
        "signalValue",
        Math.round(
            averageSignal
        )
    );


    setText(
        "downloadValue",
        averageDownload.toFixed(1)
    );


    setText(
        "latencyValue",
        Math.round(
            averageLatency
        )
    );


    setText(
        "stabilityValue",
        stability
    );


    setText(
        "networkScore",
        Math.round(
            averageScore
        )
    );


    setText(
        "measurementCount",
        dataset.length
    );


    setText(
        "deadZoneCount",
        String(
            deadZones.length
        ).padStart(
            2,
            "0"
        )
    );


    updateCoreStatus(
        Math.round(
            averageScore
        )
    );


    updateCoordinates(
        dataset
    );


    updateTelemetry(
        averageSignal,
        averageDownload,
        averageLatency,
        stability
    );
}


/* ============================================================
   CORE
   ============================================================ */

function updateCoreStatus(
    score
) {

    let status =
        "OPTIMAL";


    if (score < 40) {

        status =
            "CRITICAL";

    }
    else if (score < 60) {

        status =
            "DEGRADED";

    }
    else if (score < 80) {

        status =
            "STABLE";
    }


    setText(
        "coreStatus",
        status
    );


    const core =
        document.querySelector(
            ".network-core"
        );


    if (!core) {
        return;
    }


    core.classList.remove(
        "core-optimal",
        "core-stable",
        "core-degraded",
        "core-critical"
    );


    core.classList.add(
        `core-${status.toLowerCase()}`
    );
}


/* ============================================================
   COORDINATES
   ============================================================ */

function updateCoordinates(
    dataset
) {

    if (
        userLocation
    ) {

        setText(
            "mapLatitude",
            userLocation.latitude.toFixed(4)
        );


        setText(
            "mapLongitude",
            userLocation.longitude.toFixed(4)
        );


        setText(
            "activeRegion",
            `${userLocation.latitude.toFixed(4)}° N`
        );


        setText(
            "activeLongitude",
            `${userLocation.longitude.toFixed(4)}° E`
        );


        return;
    }


    if (!dataset.length) {
        return;
    }


    const latitude =
        dataset.reduce(
            (sum, point) =>
                sum + point.latitude,
            0
        ) /
        dataset.length;


    const longitude =
        dataset.reduce(
            (sum, point) =>
                sum + point.longitude,
            0
        ) /
        dataset.length;


    setText(
        "mapLatitude",
        latitude.toFixed(4)
    );


    setText(
        "mapLongitude",
        longitude.toFixed(4)
    );
}


/* ============================================================
   TELEMETRY
   ============================================================ */

function updateTelemetry(
    signal,
    download,
    latency,
    stability
) {

    const signalQuality =
        Math.round(
            normalizeSignal(
                signal
            )
        );


    const downloadQuality =
        Math.round(
            normalizeDownload(
                download
            )
        );


    const latencyQuality =
        Math.round(
            normalizeLatency(
                latency
            )
        );


    const bars = [

        [
            "signalBar",
            signalQuality
        ],

        [
            "downloadBar",
            downloadQuality
        ],

        [
            "latencyBar",
            latencyQuality
        ],

        [
            "stabilityBar",
            stability
        ]

    ];


    bars.forEach(
        ([id, value]) => {

            const bar =
                $(id);

            if (bar) {

                bar.style.width =
                    `${value}%`;
            }
        }
    );


    setText(
        "signalQuality",
        `${signalQuality}%`
    );


    setText(
        "downloadQuality",
        `${downloadQuality}%`
    );


    setText(
        "latencyQuality",
        `${latencyQuality}%`
    );


    setText(
        "stabilityQuality",
        `${stability}%`
    );
}


/* ============================================================
   INTELLIGENCE
   ============================================================ */

function updateIntelligence(
    dataset
) {

    if (!dataset.length) {
        return;
    }


    const worst =
        [...dataset].sort(
            (a, b) =>
                a.score -
                b.score
        )[0];


    setText(
        "statusLabel",
        worst.classification.label
    );


    setText(
        "statusDescription",
        `${dataset.filter(
            point =>
                point.score <
                CONFIG.deadZoneThreshold
        ).length} critical measurement points detected across the active analysis region.`
    );


    setText(
        "anomalyTitle",
        worst.diagnosis.title
    );


    setText(
        "anomalySector",
        `NODE ${worst.id}`
    );


    setText(
        "anomalySignal",
        `${worst.signal} dBm`
    );


    setText(
        "anomalyConfidence",
        `${worst.confidence}%`
    );


    setText(
        "diagnosisTitle",
        worst.diagnosis.title
    );


    setText(
        "diagnosisDescription",
        worst.diagnosis.description
    );


    updateRecommendation(
        worst
    );
}


/* ============================================================
   SELECTED INTELLIGENCE
   ============================================================ */

function updateSelectedIntelligence(
    point
) {

    setText(
        "statusLabel",
        point.classification.label
    );


    setText(
        "statusDescription",
        `Node ${point.id} selected for detailed network analysis.`
    );


    setText(
        "anomalyTitle",
        point.diagnosis.title
    );


    setText(
        "anomalySector",
        `NODE ${point.id}`
    );


    setText(
        "anomalySignal",
        `${point.signal} dBm`
    );


    setText(
        "anomalyConfidence",
        `${point.confidence}%`
    );


    setText(
        "diagnosisTitle",
        point.diagnosis.title
    );


    setText(
        "diagnosisDescription",
        point.diagnosis.description
    );


    updateRecommendation(
        point
    );
}


/* ============================================================
   RECOMMENDATION
   ============================================================ */

function updateRecommendation(
    point
) {

    let recommendation =
        "Network conditions within expected operational parameters.";


    if (
        point.score <
        CONFIG.deadZoneThreshold
    ) {

        recommendation =
            "Immediate investigation recommended for this network anomaly.";

    }
    else if (
        point.latency >= 120
    ) {

        recommendation =
            "Investigate routing congestion or upstream network delay.";

    }
    else if (
        point.signal <= -100
    ) {

        recommendation =
            "Investigate coverage gaps, obstruction or access-point placement.";

    }
    else if (
        point.download <= 12
    ) {

        recommendation =
            "Investigate bandwidth saturation or local network congestion.";
    }


    setText(
        "recommendationText",
        recommendation
    );
}


/* ============================================================
   EVENTS
   ============================================================ */

function addEvent(
    type,
    message,
    status = "ANALYSIS"
) {

    const list =
        $("eventList");


    if (!list) {
        return;
    }


    const time =
        new Date().toLocaleTimeString(
            "en-IN",
            {
                hour12:
                    false
            }
        );


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "event-row";


    row.innerHTML = `

        <span class="event-time">
            ${time}
        </span>

        <span class="event-type">
            ${type}
        </span>

        <span class="event-message">
            ${message}
        </span>

        <span class="event-status">
            ${status}
        </span>

    `;


    list.prepend(
        row
    );


    while (
        list.children.length >
        5
    ) {

        list.removeChild(
            list.lastChild
        );
    }
}


/* ============================================================
   RENDER
   ============================================================ */

function renderSystem() {

    const filtered =
        getFilteredData();


    renderMarkers(
        filtered
    );


    const zones =
        deadZones.filter(
            zone => {

                if (
                    currentFilter ===
                    "ALL"
                ) {

                    return true;
                }


                return zone.points.some(
                    point =>
                        point.network.toUpperCase() ===
                        currentFilter
                );
            }
        );


    renderDeadZones(
        zones
    );


    updateDashboard(
        filtered
    );


    updateIntelligence(
        filtered
    );


    updateLocalIntelligence();
}


/* ============================================================
   FILTERS
   ============================================================ */

function initializeFilters() {

    const buttons =
        document.querySelectorAll(
            "[data-network]"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    buttons.forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    button.classList.add(
                        "active"
                    );


                    currentFilter =
                        button.dataset.network
                            .toUpperCase();


                    addEvent(
                        "FILTER",
                        `Network filter switched to ${currentFilter}`,
                        "ACTIVE"
                    );


                    renderSystem();
                }
            );
        }
    );
}


/* ============================================================
   SCAN
   ============================================================ */

function initiateScan() {

    if (
        scanInProgress
    ) {
        return;
    }


    scanInProgress =
        true;


    const button =
        $("scanButton");


    if (button) {

        button.disabled =
            true;

        button.innerHTML =
            "◉ &nbsp; SCANNING...";
    }


    addEvent(
        "SCAN",
        "Spatial network scan initiated",
        "RUNNING"
    );


    setTimeout(
        () => {

            processMeasurements();


            deadZones =
                detectDeadZones(
                    processedMeasurements
                );


            renderSystem();


            addEvent(
                "ANALYSIS",
                "Local network intelligence recalculated",
                "READY"
            );


            addEvent(
                "ANOMALY",
                `${deadZones.length} persistent zones confirmed`,
                "ANALYSIS"
            );


            addEvent(
                "SCAN",
                "Spatial network scan completed",
                `${processedMeasurements.length} PTS`
            );


            if (button) {

                button.disabled =
                    false;

                button.innerHTML =
                    "◉ &nbsp; INITIATE SCAN";
            }


            scanInProgress =
                false;

        },

        900
    );
}


/* ============================================================
   NAVIGATION
   ============================================================ */

function initializeNavigation() {

    const items =
        document.querySelectorAll(
            ".command-item"
        );


    items.forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    items.forEach(
                        nav =>
                            nav.classList.remove(
                                "active"
                            )
                    );


                    item.classList.add(
                        "active"
                    );


                    const target =
                        item.dataset.target;


                    if (
                        target ===
                        "map"
                    ) {

                        networkMap.invalidateSize();
                    }


                    addEvent(
                        "NAV",
                        `Command interface switched to ${target.toUpperCase()}`,
                        "READY"
                    );
                }
            );
        }
    );
}


/* ============================================================
   CLOCK
   ============================================================ */

function initializeClock() {

    const clock =
        $("systemTime");


    if (!clock) {
        return;
    }


    const update =
        () => {

            clock.textContent =
                new Date().toLocaleTimeString(
                    "en-IN",
                    {
                        hour12:
                            false
                    }
                );
        };


    update();


    setInterval(
        update,
        1000
    );
}


/* ============================================================
   INITIALIZE
   ============================================================ */

function initializeSystem() {

    processMeasurements();


    deadZones =
        detectDeadZones(
            processedMeasurements
        );


    initializeMap();


    initializeFilters();


    initializeNavigation();


    initializeClock();


    createLocalIntelligencePanel();


    renderSystem();


    const scanButton =
        $("scanButton");


    if (scanButton) {

        scanButton.addEventListener(
            "click",
            initiateScan
        );
    }


    addEvent(
        "SYSTEM",
        "NEXUS spatial intelligence engine initialized",
        "ONLINE"
    );


    addEvent(
        "DATA",
        `${processedMeasurements.length} network measurements loaded`,
        "READY"
    );


    addEvent(
        "ANALYSIS",
        `${deadZones.length} persistent dead-zone clusters detected`,
        "READY"
    );


    setTimeout(
        () => {

            networkMap.invalidateSize();

        },

        300
    );
}


/* ============================================================
   START
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializeSystem
);