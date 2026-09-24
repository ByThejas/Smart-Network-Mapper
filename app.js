/* =========================================================
   NĀDI CORE // SPATIAL NETWORK INTELLIGENCE
   Complete application controller
   Includes:
   - Leaflet network map
   - Network filters
   - Telemetry
   - Local intelligence
   - Dead-zone detection
   - Scan engine
   - System event stream
   - GPS location
   - MAP LOCATE ME control
   ========================================================= */

(() => {
    "use strict";

    const DATA = Array.isArray(window.networkData)
        ? window.networkData
        : [];

    const $ = (id) => document.getElementById(id);

    const state = {
        map: null,
        markers: [],
        userMarker: null,
        accuracyCircle: null,

        activeNetwork: "all",
        userLocation: null,
        activePoint: null,
        filteredData: [],

        events: [],

        scanning: false,
        scanTimer: null,

        locateButton: null
    };

    const COLORS = {
        cyan: "#00e5ff",
        excellent: "#00f0a0",
        good: "#00e5ff",
        weak: "#ffb62e",
        dead: "#ff4055",
        neutral: "#6b8790"
    };

    const clamp = (value, min, max) =>
        Math.min(max, Math.max(min, value));

    const average = (values) =>
        values.length
            ? values.reduce((sum, value) => sum + value, 0) / values.length
            : 0;

    function setText(id, value) {
        const element = $(id);

        if (element) {
            element.textContent = value;
        }
    }

    /* =====================================================
       DISTANCE
       ===================================================== */

    function distanceKm(
        lat1,
        lon1,
        lat2,
        lon2
    ) {
        const earthRadius = 6371;

        const dLat =
            (lat2 - lat1) *
            Math.PI /
            180;

        const dLon =
            (lon2 - lon1) *
            Math.PI /
            180;

        const p1 =
            lat1 *
            Math.PI /
            180;

        const p2 =
            lat2 *
            Math.PI /
            180;

        const value =
            Math.sin(dLat / 2) ** 2 +
            Math.sin(dLon / 2) ** 2 *
            Math.cos(p1) *
            Math.cos(p2);

        return (
            earthRadius *
            2 *
            Math.atan2(
                Math.sqrt(value),
                Math.sqrt(1 - value)
            )
        );
    }

    function formatDistance(km) {
        if (km < 1) {
            return `${Math.round(km * 1000)} m`;
        }

        return `${km.toFixed(1)} km`;
    }

    /* =====================================================
       QUALITY ENGINE
       ===================================================== */

    function signalScore(signal) {
        if (!Number.isFinite(signal)) {
            return 0;
        }

        return clamp(
            ((signal + 115) / 65) * 100,
            0,
            100
        );
    }

    function downloadScore(download) {
        if (!Number.isFinite(download)) {
            return 0;
        }

        return clamp(
            download,
            0,
            100
        );
    }

    function latencyScore(latency) {
        if (!Number.isFinite(latency)) {
            return 0;
        }

        if (latency <= 20) return 100;
        if (latency <= 40) return 92;
        if (latency <= 60) return 80;
        if (latency <= 90) return 65;
        if (latency <= 130) return 45;

        return 25;
    }

    function pointScore(point) {
        return Math.round(
            signalScore(
                Number(point.signal)
            ) * 0.50 +

            downloadScore(
                Number(point.download)
            ) * 0.30 +

            latencyScore(
                Number(point.latency)
            ) * 0.20
        );
    }

    function classify(score) {
        if (score >= 85) return "excellent";
        if (score >= 65) return "good";
        if (score >= 40) return "weak";

        return "dead";
    }

    function qualityLabel(score) {
        if (score >= 85) return "EXCELLENT";
        if (score >= 65) return "GOOD";
        if (score >= 40) return "WEAK";

        return "DEAD ZONE";
    }

    /* =====================================================
       ENRICH DATA
       ===================================================== */

    const enrichedData = DATA
        .map(point => {
            const score =
                pointScore(point);

            return {
                ...point,
                score,
                quality: classify(score)
            };
        })
        .filter(point =>
            Number.isFinite(
                Number(point.latitude)
            ) &&
            Number.isFinite(
                Number(point.longitude)
            )
        );

    state.filteredData = [
        ...enrichedData
    ];

    /* =====================================================
       DATASET CENTER
       ===================================================== */

    function getDatasetCenter() {
        if (!enrichedData.length) {
            return [
                12.9716,
                77.5946
            ];
        }

        return [
            average(
                enrichedData.map(
                    point =>
                        Number(point.latitude)
                )
            ),

            average(
                enrichedData.map(
                    point =>
                        Number(point.longitude)
                )
            )
        ];
    }

    /* =====================================================
       NEARBY POINTS
       ===================================================== */

    function getNearbyPoints(
        latitude,
        longitude,
        radius = 1.25
    ) {
        return state.filteredData
            .map(point => ({
                point,

                distance:
                    distanceKm(
                        latitude,
                        longitude,
                        Number(point.latitude),
                        Number(point.longitude)
                    )
            }))

            .filter(item =>
                item.distance <= radius
            )

            .sort(
                (a, b) =>
                    a.distance -
                    b.distance
            );
    }

    /* =====================================================
       MAP
       ===================================================== */

    function initializeMap() {
        const mapElement =
            $("networkMap");

        if (
            !mapElement ||
            typeof L === "undefined"
        ) {
            return;
        }

        state.map =
            L.map(
                mapElement,
                {
                    zoomControl: true,
                    attributionControl: true,
                    preferCanvas: true
                }
            );

        state.map.setView(
            getDatasetCenter(),
            14
        );

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,

                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(
            state.map
        );

        renderMarkers();

        setTimeout(() => {
            if (state.map) {
                state.map.invalidateSize();
            }
        }, 250);

        addEvent(
            "SYSTEM",
            `${enrichedData.length} spatial measurements indexed`,
            "ONLINE",
            "info"
        );
    }

    /* =====================================================
       MARKER COLORS
       ===================================================== */

    function markerColor(
        quality
    ) {
        return (
            COLORS[quality] ||
            COLORS.neutral
        );
    }

    /* =====================================================
       CLEAR MAP MARKERS
       ===================================================== */

    function clearMarkers() {
        state.markers.forEach(
            marker => {
                if (
                    state.map &&
                    state.map.hasLayer(marker)
                ) {
                    state.map.removeLayer(
                        marker
                    );
                }
            }
        );

        state.markers = [];
    }

    /* =====================================================
       POPUP
       ===================================================== */

    function buildPopup(point) {
        return `
            <div class="nadi-popup">

                <div class="nadi-popup-title">
                    NODE ${String(point.id).padStart(2, "0")}
                </div>

                <div class="nadi-popup-status">
                    ${qualityLabel(point.score)}
                </div>

                <div class="nadi-popup-grid">

                    <span>SIGNAL</span>
                    <strong>
                        ${point.signal} dBm
                    </strong>

                    <span>DOWNLOAD</span>
                    <strong>
                        ${Number(point.download).toFixed(1)} Mbps
                    </strong>

                    <span>LATENCY</span>
                    <strong>
                        ${point.latency} ms
                    </strong>

                    <span>NETWORK</span>
                    <strong>
                        ${point.network || "UNKNOWN"}
                    </strong>

                    <span>SCORE</span>
                    <strong>
                        ${point.score}/100
                    </strong>

                </div>

            </div>
        `;
    }

    /* =====================================================
       RENDER NETWORK MARKERS
       ===================================================== */

    function renderMarkers() {
        if (!state.map) {
            return;
        }

        clearMarkers();

        state.filteredData.forEach(
            point => {

                const marker =
                    L.circleMarker(
                        [
                            Number(point.latitude),
                            Number(point.longitude)
                        ],
                        {
                            radius:
                                point.quality === "dead"
                                    ? 7
                                    : point.quality === "weak"
                                        ? 6
                                        : 5,

                            color: "#dffaff",

                            weight: 1,

                            fillColor:
                                markerColor(
                                    point.quality
                                ),

                            fillOpacity: 0.86,

                            opacity: 0.95
                        }
                    );

                marker.bindPopup(
                    buildPopup(point),
                    {
                        closeButton: false,

                        className:
                            "nadi-popup-shell"
                    }
                );

                marker.on(
                    "click",
                    () => {

                        state.activePoint =
                            point;

                        updateLocalIntelligence(
                            Number(point.latitude),
                            Number(point.longitude)
                        );

                        addEvent(
                            "NODE",
                            `Node ${point.id} selected from spatial grid`,
                            `${point.score} PTS`,
                            point.quality === "dead"
                                ? "critical"
                                : "info"
                        );
                    }
                );

                marker.addTo(
                    state.map
                );

                state.markers.push(
                    marker
                );
            }
        );

        renderDeadZones();
    }

    /* =====================================================
       DEAD ZONE CLUSTERS
       ===================================================== */

    function buildDeadZoneClusters(
        points
    ) {
        const deadPoints =
            points.filter(
                point =>
                    point.quality === "dead"
            );

        const clusters = [];
        const used = new Set();

        deadPoints.forEach(
            (point, index) => {

                if (
                    used.has(index)
                ) {
                    return;
                }

                const cluster = [
                    point
                ];

                used.add(index);

                deadPoints.forEach(
                    (
                        candidate,
                        candidateIndex
                    ) => {

                        if (
                            used.has(
                                candidateIndex
                            )
                        ) {
                            return;
                        }

                        const distance =
                            distanceKm(
                                Number(point.latitude),
                                Number(point.longitude),
                                Number(candidate.latitude),
                                Number(candidate.longitude)
                            );

                        if (
                            distance <= 0.35
                        ) {
                            cluster.push(
                                candidate
                            );

                            used.add(
                                candidateIndex
                            );
                        }
                    }
                );

                clusters.push(
                    cluster
                );
            }
        );

        return clusters;
    }

    /* =====================================================
       RENDER DEAD ZONES
       ===================================================== */

    function renderDeadZones() {
        if (!state.map) {
            return;
        }

        const clusters =
            buildDeadZoneClusters(
                state.filteredData
            );

        clusters.forEach(
            cluster => {

                if (!cluster.length) {
                    return;
                }

                const latitude =
                    average(
                        cluster.map(
                            point =>
                                Number(
                                    point.latitude
                                )
                        )
                    );

                const longitude =
                    average(
                        cluster.map(
                            point =>
                                Number(
                                    point.longitude
                                )
                        )
                    );

                const circle =
                    L.circle(
                        [
                            latitude,
                            longitude
                        ],
                        {
                            radius:
                                Math.max(
                                    70,
                                    cluster.length * 45
                                ),

                            color:
                                COLORS.dead,

                            weight: 1.5,

                            dashArray:
                                "7 7",

                            fillColor:
                                COLORS.dead,

                            fillOpacity:
                                0.045,

                            opacity:
                                0.75,

                            interactive:
                                false
                        }
                    ).addTo(
                        state.map
                    );

                state.markers.push(
                    circle
                );
            }
        );

        setText(
            "deadZoneCount",
            String(
                clusters.length
            ).padStart(2, "0")
        );
    }

    /* =====================================================
       GLOBAL SCORE
       ===================================================== */

    function calculateGlobalScore(
        points = state.filteredData
    ) {
        if (!points.length) {
            return 0;
        }

        return Math.round(
            average(
                points.map(
                    point =>
                        point.score
                )
            )
        );
    }

    function updateGlobalMetrics() {
        const score =
            calculateGlobalScore();

        setText(
            "networkScore",
            score
        );

        setText(
            "coreStatus",
            qualityLabel(score)
        );

        setText(
            "measurementCount",
            state.filteredData.length
        );

        setText(
            "deadZoneCount",
            String(
                buildDeadZoneClusters(
                    state.filteredData
                ).length
            ).padStart(2, "0")
        );
    }

    /* =====================================================
       NETWORK FILTERS
       ===================================================== */

    function setNetworkFilter(
        network
    ) {
        state.activeNetwork =
            network;

        document
            .querySelectorAll(
                ".network-filters button"
            )
            .forEach(
                button => {

                    button.classList.toggle(
                        "active",

                        String(
                            button.dataset.network
                        ).toLowerCase() ===
                        String(network).toLowerCase()
                    );
                }
            );

        state.filteredData =
            network === "all"
                ? [...enrichedData]
                : enrichedData.filter(
                    point =>
                        String(
                            point.network
                        ).toLowerCase() ===
                        String(network).toLowerCase()
                );

        renderMarkers();

        updateGlobalMetrics();

        if (
            state.userLocation
        ) {
            updateLocalIntelligence(
                state.userLocation.lat,
                state.userLocation.lon
            );
        }

        addEvent(
            "FILTER",
            `Network source switched to ${
                network === "all"
                    ? "ALL NETWORKS"
                    : network
            }`,
            "UPDATED",
            "info"
        );
    }

    /* =====================================================
       LOCAL INTELLIGENCE
       ===================================================== */

    function calculateLocalProfile(
        latitude,
        longitude
    ) {
        const nearby =
            getNearbyPoints(
                latitude,
                longitude
            );

        let selected;

        if (
            nearby.length >= 3
        ) {
            selected =
                nearby.slice(
                    0,
                    12
                );
        } else {
            selected =
                state.filteredData
                    .map(point => ({
                        point,

                        distance:
                            distanceKm(
                                latitude,
                                longitude,
                                Number(point.latitude),
                                Number(point.longitude)
                            )
                    }))
                    .sort(
                        (a, b) =>
                            a.distance -
                            b.distance
                    )
                    .slice(
                        0,
                        5
                    );
        }

        if (!selected.length) {
            return null;
        }

        const weights =
            selected.map(
                item =>
                    1 /
                    Math.max(
                        item.distance,
                        0.05
                    )
            );

        const totalWeight =
            weights.reduce(
                (sum, value) =>
                    sum + value,
                0
            );

        const score =
            Math.round(
                selected.reduce(
                    (
                        sum,
                        item,
                        index
                    ) =>
                        sum +
                        item.point.score *
                        weights[index],
                    0
                ) /
                totalWeight
            );

        const points =
            selected.map(
                item =>
                    item.point
            );

        return {
            score: clamp(
                score,
                0,
                100
            ),

            points,

            nearbyCount:
                nearby.length,

            nearest:
                selected[0],

            signal:
                Math.round(
                    average(
                        points.map(
                            point =>
                                Number(
                                    point.signal
                                )
                        )
                    )
                ),

            latency:
                Math.round(
                    average(
                        points.map(
                            point =>
                                Number(
                                    point.latency
                                )
                        )
                    )
                ),

            download:
                average(
                    points.map(
                        point =>
                            Number(
                                point.download
                            )
                    )
                )
        };
    }

    function updateLocalIntelligence(
        latitude,
        longitude
    ) {
        const profile =
            calculateLocalProfile(
                latitude,
                longitude
            );

        if (!profile) {
            return;
        }

        setText(
            "localScore",
            profile.score
        );

        setText(
            "localCondition",
            qualityLabel(
                profile.score
            )
        );

        setText(
            "localSignal",
            `${profile.signal} dBm`
        );

        setText(
            "localLatency",
            `${profile.latency} ms`
        );

        setText(
            "localNodes",
            profile.nearbyCount
        );

        if (
            profile.nearest
        ) {
            const point =
                profile.nearest.point;

            setText(
                "localAnomaly",

                point.quality === "dead"
                    ? `DZ-${String(point.id).padStart(2, "0")}`
                    : `NODE ${point.id}`
            );

            setText(
                "localDistance",
                formatDistance(
                    profile.nearest.distance
                )
            );
        }

        setText(
            "activeRegion",
            `${latitude.toFixed(4)}° N`
        );

        setText(
            "activeLongitude",
            `${longitude.toFixed(4)}° E`
        );

        setText(
            "mapLatitude",
            latitude.toFixed(4)
        );

        setText(
            "mapLongitude",
            longitude.toFixed(4)
        );

        const stability =
            clamp(
                Math.round(
                    profile.score *
                    0.72 +

                    latencyScore(
                        profile.latency
                    ) *
                    0.28
                ),
                0,
                100
            );

        setText(
            "signalValue",
            profile.signal
        );

        setText(
            "downloadValue",
            profile.download.toFixed(1)
        );

        setText(
            "latencyValue",
            profile.latency
        );

        setText(
            "stabilityValue",
            stability
        );

        updateTelemetryQuality(
            profile.signal,
            profile.download,
            profile.latency,
            stability
        );

        updateDiagnosis(
            profile
        );
    }

    /* =====================================================
       DIAGNOSIS
       ===================================================== */

    function updateDiagnosis(
        profile
    ) {
        const score =
            profile.score;

        let title;
        let description;
        let recommendation;

        if (score < 40) {

            title =
                "SEVERE CONNECTIVITY DEGRADATION";

            description =
                "Multiple network indicators are significantly degraded in the active spatial sector.";

            recommendation =
                "Immediate investigation recommended for this network anomaly.";

        } else if (score < 65) {

            title =
                "MODERATE CONNECTIVITY DEGRADATION";

            description =
                "Local measurements indicate reduced signal quality or elevated response time.";

            recommendation =
                "Monitor this sector for persistent coverage degradation.";

        } else if (score < 85) {

            title =
                "STABLE CONNECTIVITY";

            description =
                "Local connectivity is stable with minor performance variation.";

            recommendation =
                "Continue monitoring the surrounding network sector.";

        } else {

            title =
                "HIGH QUALITY CONNECTIVITY";

            description =
                "Local measurements indicate strong signal, responsive latency and healthy throughput.";

            recommendation =
                "No immediate intervention required.";
        }

        setText(
            "statusLabel",
            qualityLabel(score)
        );

        setText(
            "statusDescription",
            `Local network intelligence score ${score}/100.`
        );

        setText(
            "anomalyTitle",
            title
        );

        setText(
            "diagnosisTitle",
            title
        );

        setText(
            "diagnosisDescription",
            description
        );

        setText(
            "recommendationText",
            recommendation
        );

        if (
            profile.nearest
        ) {
            const point =
                profile.nearest.point;

            setText(
                "anomalySector",
                `NODE ${point.id}`
            );

            setText(
                "anomalySignal",
                `${point.signal} dBm`
            );

            const confidence =
                clamp(
                    Math.round(
                        62 +
                        Math.abs(
                            Number(point.signal) +
                            80
                        ) *
                        0.55 +

                        (
                            point.quality === "dead"
                                ? 18
                                : 0
                        )
                    ),
                    60,
                    98
                );

            setText(
                "anomalyConfidence",
                `${confidence}%`
            );
        }
    }

    /* =====================================================
       TELEMETRY
       ===================================================== */

    function setBar(
        id,
        value
    ) {
        const element =
            $(id);

        if (element) {
            element.style.width =
                `${clamp(
                    value,
                    0,
                    100
                )}%`;
        }
    }

    function updateTelemetryQuality(
        signal,
        download,
        latency,
        stability
    ) {
        const signalQuality =
            Math.round(
                signalScore(signal)
            );

        const downloadQuality =
            Math.round(
                downloadScore(download)
            );

        const latencyQuality =
            Math.round(
                latencyScore(latency)
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

        setBar(
            "signalBar",
            signalQuality
        );

        setBar(
            "downloadBar",
            downloadQuality
        );

        setBar(
            "latencyBar",
            latencyQuality
        );

        setBar(
            "stabilityBar",
            stability
        );
    }

    function startTelemetryPulse() {
        setInterval(
            () => {

                if (
                    state.scanning ||
                    !state.activePoint
                ) {
                    return;
                }

                const point =
                    state.activePoint;

                const signal =
                    Number(
                        point.signal
                    ) +
                    (
                        Math.random() -
                        0.5
                    ) *
                    2;

                const latency =
                    Math.max(
                        5,

                        Number(
                            point.latency
                        ) +

                        (
                            Math.random() -
                            0.5
                        ) *
                        5
                    );

                const download =
                    Math.max(
                        0,

                        Number(
                            point.download
                        ) +

                        (
                            Math.random() -
                            0.5
                        ) *
                        2
                    );

                const stability =
                    clamp(
                        Math.round(
                            signalScore(
                                signal
                            ) *
                            0.45 +

                            downloadScore(
                                download
                            ) *
                            0.25 +

                            latencyScore(
                                latency
                            ) *
                            0.30
                        ),
                        0,
                        100
                    );

                setText(
                    "signalValue",
                    Math.round(
                        signal
                    )
                );

                setText(
                    "downloadValue",
                    download.toFixed(1)
                );

                setText(
                    "latencyValue",
                    Math.round(
                        latency
                    )
                );

                setText(
                    "stabilityValue",
                    stability
                );

                updateTelemetryQuality(
                    signal,
                    download,
                    latency,
                    stability
                );

            },
            3500
        );
    }

    /* =====================================================
       USER LOCATION
       ===================================================== */

    function showUserLocation(
        latitude,
        longitude,
        accuracy = 30,
        source = "GPS"
    ) {
        if (!state.map) {
            return;
        }

        if (
            state.userMarker
        ) {
            state.map.removeLayer(
                state.userMarker
            );
        }

        if (
            state.accuracyCircle
        ) {
            state.map.removeLayer(
                state.accuracyCircle
            );
        }

        const icon =
            L.divIcon({
                className:
                    "nadi-user-location",

                html: `
                    <div class="nadi-user-pulse">
                        <span></span>
                    </div>
                `,

                iconSize: [
                    24,
                    24
                ],

                iconAnchor: [
                    12,
                    12
                ]
            });

        state.userMarker =
            L.marker(
                [
                    latitude,
                    longitude
                ],
                {
                    icon,

                    zIndexOffset:
                        1000
                }
            ).addTo(
                state.map
            );

        state.userMarker.bindTooltip(
            "ACTIVE USER LOCATION",
            {
                direction: "top",
                offset: [
                    0,
                    -10
                ]
            }
        );

        state.accuracyCircle =
            L.circle(
                [
                    latitude,
                    longitude
                ],
                {
                    radius:
                        Math.max(
                            Number(
                                accuracy
                            ) || 30,
                            25
                        ),

                    color:
                        COLORS.cyan,

                    weight: 1,

                    opacity: 0.35,

                    fillColor:
                        COLORS.cyan,

                    fillOpacity:
                        0.025,

                    interactive:
                        false
                }
            ).addTo(
                state.map
            );

        state.userLocation = {
            lat: latitude,
            lon: longitude,
            accuracy
        };

        updateLocalIntelligence(
            latitude,
            longitude
        );

        if (
            source === "GPS"
        ) {
            addEvent(
                "GPS",
                "Active user location acquired",
                "LOCKED",
                "success"
            );
        }
    }

    /* =====================================================
       LOCATE ME BUTTON
       ===================================================== */

    function setLocateButtonState(
        mode
    ) {
        const button =
            state.locateButton;

        if (!button) {
            return;
        }

        const label =
            button.querySelector(
                ".locate-label"
            );

        button.classList.toggle(
            "locating",
            mode === "locating"
        );

        if (label) {

            if (
                mode === "locating"
            ) {
                label.textContent =
                    "LOCATING...";

            } else if (
                mode === "locked"
            ) {
                label.textContent =
                    "LOCATION LOCKED";

            } else {
                label.textContent =
                    "LOCATE ME";
            }
        }

        button.disabled =
            mode === "locating";
    }

    function requestUserLocation(
        manual = false
    ) {
        if (
            !navigator.geolocation
        ) {

            addEvent(
                "GPS",
                "Browser location services unavailable",
                "FALLBACK",
                "warning"
            );

            if (!manual) {
                useDatasetLocation();
            } else {
                setLocateButtonState(
                    "ready"
                );
            }

            return;
        }

        setLocateButtonState(
            "locating"
        );

        addEvent(
            "GPS",

            manual
                ? "Manual location request initiated"
                : "Acquiring active user location",

            "SEARCHING",
            "info"
        );

        navigator.geolocation.getCurrentPosition(
            position => {

                const {
                    latitude,
                    longitude,
                    accuracy
                } =
                    position.coords;

                showUserLocation(
                    latitude,
                    longitude,
                    accuracy,
                    "GPS"
                );

                state.map.flyTo(
                    [
                        latitude,
                        longitude
                    ],
                    16,
                    {
                        duration:
                            1.2
                    }
                );

                setLocateButtonState(
                    "locked"
                );

                setTimeout(
                    () => {

                        if (
                            state.locateButton
                        ) {
                            setLocateButtonState(
                                "ready"
                            );
                        }

                    },
                    2400
                );
            },

            error => {

                let reason =
                    "Location could not be acquired";

                if (
                    error &&
                    error.code === 1
                ) {
                    reason =
                        "Location permission denied";
                }

                if (
                    error &&
                    error.code === 2
                ) {
                    reason =
                        "Location unavailable";
                }

                if (
                    error &&
                    error.code === 3
                ) {
                    reason =
                        "Location request timed out";
                }

                addEvent(
                    "GPS",
                    `${reason}; using analysis dataset`,
                    "FALLBACK",
                    "warning"
                );

                setLocateButtonState(
                    "ready"
                );

                if (!manual) {
                    useDatasetLocation();
                }
            },

            {
                enableHighAccuracy:
                    true,

                timeout:
                    12000,

                maximumAge:
                    30000
            }
        );
    }

    /* =====================================================
       DATASET FALLBACK LOCATION
       ===================================================== */

    function useDatasetLocation() {
        const center =
            getDatasetCenter();

        showUserLocation(
            center[0],
            center[1],
            100,
            "DATASET"
        );

        if (state.map) {
            state.map.setView(
                center,
                14,
                {
                    animate:
                        true
                }
            );
        }
    }

    /* =====================================================
       INITIALIZE LOCATE ME BUTTON
       ===================================================== */

    function initializeLocateMeButton() {
        const mapElement =
            $("networkMap");

        if (
            !mapElement ||
            state.locateButton
        ) {
            return;
        }

        mapElement.style.position =
            "relative";

        const button =
            document.createElement(
                "button"
            );

        button.id =
            "locateMeButton";

        button.type =
            "button";

        button.className =
            "nadi-locate-control";

        button.innerHTML = `
            <span class="nadi-locate-icon">
                <span></span>
            </span>

            <span class="locate-label">
                LOCATE ME
            </span>
        `;

        button.addEventListener(
            "click",
            () => {
                requestUserLocation(
                    true
                );
            }
        );

        mapElement.appendChild(
            button
        );

        state.locateButton =
            button;
    }

    /* =====================================================
       SCAN ENGINE
       ===================================================== */

    function runScan() {
        if (
            state.scanning
        ) {
            return;
        }

        state.scanning =
            true;

        const button =
            $("scanButton");

        if (button) {

            button.disabled =
                true;

            button.classList.add(
                "scanning"
            );

            button.innerHTML = `
                <span class="scan-button-icon">
                    ◉
                </span>
                SCANNING...
            `;
        }

        const phases = [
            [
                "SCAN",
                "Spatial network scan initiated",
                "RUNNING"
            ],

            [
                "DATA",
                `${state.filteredData.length} network measurements acquired`,
                "READY"
            ],

            [
                "ANALYSIS",
                `${buildDeadZoneClusters(state.filteredData).length} persistent dead-zone clusters detected`,
                "ANALYSIS"
            ],

            [
                "SYSTEM",
                "Local network intelligence recalculated",
                "UPDATED"
            ],

            [
                "SCAN",
                "Spatial network scan completed",
                `${calculateGlobalScore()} PTS`
            ]
        ];

        let index = 0;

        const executePhase =
            () => {

                if (
                    index >=
                    phases.length
                ) {
                    finishScan();
                    return;
                }

                const [
                    type,
                    message,
                    status
                ] =
                    phases[index];

                addEvent(
                    type,
                    message,
                    status,

                    type ===
                    "ANALYSIS"
                        ? "warning"
                        : "info"
                );

                if (
                    index === 0
                ) {
                    animateMapScan();
                }

                index++;

                state.scanTimer =
                    setTimeout(
                        executePhase,
                        650
                    );
            };

        executePhase();
    }

    function finishScan() {
        state.scanning =
            false;

        const button =
            $("scanButton");

        if (button) {

            button.disabled =
                false;

            button.classList.remove(
                "scanning"
            );

            button.innerHTML = `
                <span class="scan-button-icon">
                    ◉
                </span>
                INITIATE SCAN
            `;
        }

        renderMarkers();

        updateGlobalMetrics();

        if (
            state.userLocation
        ) {
            updateLocalIntelligence(
                state.userLocation.lat,
                state.userLocation.lon
            );
        }

        addEvent(
            "SYSTEM",
            "Spatial intelligence engine synchronized",
            "ONLINE",
            "success"
        );
    }

    function animateMapScan() {
        if (!state.map) {
            return;
        }

        const center =
            state.userLocation
                ? [
                    state.userLocation.lat,
                    state.userLocation.lon
                ]
                : getDatasetCenter();

        const scanCircle =
            L.circle(
                center,
                {
                    radius: 50,

                    color:
                        COLORS.cyan,

                    weight: 2,

                    opacity: 0.85,

                    fillOpacity: 0,

                    interactive:
                        false
                }
            ).addTo(
                state.map
            );

        let radius = 50;

        const interval =
            setInterval(
                () => {

                    radius += 80;

                    scanCircle.setRadius(
                        radius
                    );

                    if (
                        radius >=
                        1300
                    ) {
                        clearInterval(
                            interval
                        );

                        state.map.removeLayer(
                            scanCircle
                        );
                    }

                },
                90
            );
    }

    /* =====================================================
       EVENT STREAM
       ===================================================== */

    function addEvent(
        type,
        message,
        status,
        severity = "info"
    ) {
        state.events.unshift({
            timestamp:
                new Date().toLocaleTimeString(
                    "en-GB",
                    {
                        hour12:
                            false
                    }
                ),

            type,

            message,

            status,

            severity
        });

        state.events =
            state.events.slice(
                0,
                7
            );

        renderEvents();
    }

    function renderEvents() {
        const container =
            $("eventList");

        if (!container) {
            return;
        }

        container.innerHTML =
            state.events
                .map(
                    event => `
                        <div class="event-item ${event.severity}">

                            <div class="event-time">
                                ${event.timestamp}
                            </div>

                            <div class="event-dot"></div>

                            <div class="event-message">

                                <strong>
                                    ${event.type}
                                </strong>

                                <span>
                                    ${event.message}
                                </span>

                                <strong>
                                    ${event.status}
                                </strong>

                            </div>

                        </div>
                    `
                )
                .join("");
    }

    function seedEvents() {
        state.events = [];

        addEvent(
            "SYSTEM",
            "NĀDI spatial intelligence engine initialized",
            "ONLINE",
            "success"
        );

        addEvent(
            "DATA",
            `${enrichedData.length} network measurements loaded`,
            "READY",
            "info"
        );

        addEvent(
            "ANALYSIS",
            `${buildDeadZoneClusters(enrichedData).length} persistent dead-zone clusters detected`,
            "READY",
            "warning"
        );

        addEvent(
            "GPS",
            "Location services initialized",
            "READY",
            "success"
        );
    }

    /* =====================================================
       COMMAND RAIL
       ===================================================== */

    function scrollToSection(
        target
    ) {
        const workspace =
            document.querySelector(
                ".command-workspace"
            );

        const element =
            typeof target === "string"
                ? $(target)
                : target;

        if (
            !workspace ||
            !element
        ) {
            return;
        }

        workspace.scrollTo({
            top:
                element.offsetTop -
                15,

            behavior:
                "smooth"
        });
    }

    function focusDeadZones() {
        const deadPoints =
            state.filteredData.filter(
                point =>
                    point.quality ===
                    "dead"
            );

        if (
            !deadPoints.length ||
            !state.map
        ) {

            addEvent(
                "ANALYSIS",
                "No dead-zone measurements in active filter",
                "CLEAR",
                "success"
            );

            return;
        }

        const bounds =
            L.latLngBounds(
                deadPoints.map(
                    point => [
                        Number(
                            point.latitude
                        ),

                        Number(
                            point.longitude
                        )
                    ]
                )
            );

        state.map.fitBounds(
            bounds,
            {
                padding: [
                    40,
                    40
                ],

                maxZoom:
                    16,

                animate:
                    true
            }
        );

        addEvent(
            "ANALYSIS",
            `${deadPoints.length} dead-zone measurements isolated`,
            "FOCUSED",
            "warning"
        );
    }

    function initializeCommandRail() {
        document
            .querySelectorAll(
                ".command-item"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            document
                                .querySelectorAll(
                                    ".command-item"
                                )
                                .forEach(
                                    item =>
                                        item.classList.remove(
                                            "active"
                                        )
                                );

                            button.classList.add(
                                "active"
                            );

                            const target =
                                button.dataset
                                    .target;

                            if (
                                target ===
                                "map"
                            ) {
                                scrollToSection(
                                    "networkMap"
                                );
                            }

                            if (
                                target ===
                                "telemetry"
                            ) {
                                scrollToSection(
                                    document.querySelector(
                                        ".telemetry-section"
                                    )
                                );
                            }

                            if (
                                target ===
                                "events"
                            ) {
                                scrollToSection(
                                    document.querySelector(
                                        ".event-section"
                                    )
                                );
                            }

                            if (
                                target ===
                                "dead-zones"
                            ) {
                                focusDeadZones();
                            }

                            addEvent(
                                "NAV",
                                `Command interface switched to ${target.toUpperCase()}`,
                                "READY",
                                "info"
                            );
                        }
                    );
                }
            );
    }

    /* =====================================================
       FILTER INITIALIZATION
       ===================================================== */

    function initializeFilters() {
        document
            .querySelectorAll(
                ".network-filters button"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            setNetworkFilter(
                                button.dataset
                                    .network ||
                                "all"
                            );
                        }
                    );
                }
            );
    }

    /* =====================================================
       SYSTEM CLOCK
       ===================================================== */

    function startClock() {
        const updateClock =
            () => {

                setText(
                    "systemTime",

                    new Date().toLocaleTimeString(
                        "en-GB",
                        {
                            hour12:
                                false
                        }
                    )
                );
            };

        updateClock();

        setInterval(
            updateClock,
            1000
        );
    }

    /* =====================================================
       INITIAL LOCAL STATE
       ===================================================== */

    function initializeLocalState() {
        const center =
            getDatasetCenter();

        updateLocalIntelligence(
            center[0],
            center[1]
        );

        updateGlobalMetrics();
    }

    /* =====================================================
       INITIALIZATION
       ===================================================== */

    function initialize() {
        if (
            !DATA.length
        ) {

            console.warn(
                "NĀDI: networkData is unavailable."
            );

            return;
        }

        startClock();

        initializeMap();

        initializeLocateMeButton();

        initializeFilters();

        initializeCommandRail();

        seedEvents();

        initializeLocalState();

        startTelemetryPulse();

        const scanButton =
            $("scanButton");

        if (scanButton) {

            scanButton.addEventListener(
                "click",
                runScan
            );
        }

        /*
         * Automatically request GPS after
         * the dashboard has rendered.
         *
         * If permission is denied,
         * the dataset center is used.
         */

        setTimeout(
            () => {
                requestUserLocation(
                    false
                );
            },
            500
        );
    }

    /* =====================================================
       BOOT
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();
    }

})();