const esriConfig = await $arcgis.import("@arcgis/core/config.js");
const FeatureLayer = await $arcgis.import("@arcgis/core/layers/FeatureLayer.js");
const GraphicsLayer = await $arcgis.import("@arcgis/core/layers/GraphicsLayer.js");
const Graphic = await $arcgis.import("@arcgis/core/Graphic.js");
const ClassBreaksRenderer = await $arcgis.import("@arcgis/core/renderers/ClassBreaksRenderer.js");
const UniqueValueRenderer = await $arcgis.import("@arcgis/core/renderers/UniqueValueRenderer.js");
const FeatureFilter = await $arcgis.import("@arcgis/core/layers/support/FeatureFilter.js");
const reactiveUtils = await $arcgis.import("@arcgis/core/core/reactiveUtils.js");

import { API_KEY, GOV_URL, ISSUES_URL } from "./config.js";


esriConfig.apiKey = API_KEY;

// DOM Elements
const output = document.getElementById("output");
const incidentTypeSelect = document.getElementById("incidentType");
const descriptionInput = document.getElementById("incidentDescription");
const startReportingBtn = document.getElementById("startReportingBtn");
const issueFilter = document.getElementById("issueFilter");
const totalIssuesCount = document.getElementById("totalIssuesCount");
const visibleIssuesCount = document.getElementById("visibleIssuesCount");

let reportingMode = false;

// Initialize Map View
const viewElement = document.querySelector("arcgis-map");
await viewElement.componentOnReady();
const map = viewElement.map;
const mapView = viewElement.view;

// ---------------------------------------------------------
// PART 1: Governorates Visualization (Class Breaks Renderer)
// ---------------------------------------------------------
const govRenderer = new ClassBreaksRenderer({
    field: "Population",
    classBreakInfos: [
        {
            minValue: 0,
            maxValue: 1000000,
            symbol: { type: "simple-fill", color: "#9ebcda", outline: { color: "#737373" } },
            label: "Under 1 Million"
        },
        {
            minValue: 1000001,
            maxValue: 3000000,
            symbol: { type: "simple-fill", color: "#8c96c6", outline: { color: "#737373" } },
            label: "1M - 3M"
        },
        {
            minValue: 3000001,
            maxValue: 6000000,
            symbol: { type: "simple-fill", color: "#8856a7", outline: { color: "#737373" } },
            label: "3M - 6M"
        },
        {
            minValue: 6000001,
            maxValue: 20000000,
            symbol: { type: "simple-fill", color: "#810f7c", outline: { color: "#737373" } },
            label: "Over 6 Million"
        }
    ]
});

const governoratesLayer = new FeatureLayer({
    url: GOV_URL,
    title: "Egypt Governorates",
    outFields: ["*"],
    renderer: govRenderer,
    popupTemplate: {
        title: "{Name_Ar} ({Name_En})",
        content: `
            <b>Population:</b> {Population}<br>
            <b>Area:</b> {Area_KM2} KM²<br>
            <b>Population Density:</b> {expression/density}
        `,
        expressionInfos: [{
            name: "density",
            title: "Density",
            expression: "Round($feature.Population / $feature.Area_KM2, 2) + ' People/KM²'"
        }]
    }
});

// ---------------------------------------------------------
// PART 2: Operational Issues Layer & Symbology
// ---------------------------------------------------------
const issuesRenderer = new UniqueValueRenderer({
    field: "IssueType",
    uniqueValueInfos: [
        {
            value: "Violating Building",
            symbol: { type: "simple-marker", color: "#D62828", size: 12, outline: { color: "white" } },
            label: "Violating Building"
        },
        {
            value: "Street Issue",
            symbol: { type: "simple-marker", color: "#F4A261", size: 12, outline: { color: "white" } },
            label: "Street Issue"
        }
    ]
});

const operationalIssuesLayer = new FeatureLayer({
    url: ISSUES_URL, 
    title: "Reported Issues",
    outFields: ["*"],
    renderer: issuesRenderer,
    popupTemplate: {
        title: "{IssueType}",
        content: `
            <b>Description:</b> {Description}<br>
            <b>Reported At:</b> {ReportedAt}
        `
    }
});

const tempIncidentsLayer = new GraphicsLayer({ title: "Draft Incidents", listMode: "hide" });

map.addMany([governoratesLayer, operationalIssuesLayer, tempIncidentsLayer]);

// ---------------------------------------------------------
// BONUS: Setup Search Widget to search for Governorates
// ---------------------------------------------------------
const searchWidget = document.getElementById("searchWidget");
await searchWidget.componentOnReady();
searchWidget.sources = [{
    layer: governoratesLayer,
    searchFields: ["Name_Ar", "Name_En"],
    displayField: "Name_Ar",
    exactMatch: false,
    outFields: ["*"],
    name: "Governorates Search",
    placeholder: "ابحث عن محافظة..."
}];

// ---------------------------------------------------------
// PART 2: Reporting System Logic (No Editor Widget)
// ---------------------------------------------------------
mapView.on("click", (event) => {
    if (!reportingMode) return;

    const issueType = incidentTypeSelect.value;
    const description = descriptionInput.value || "No description provided.";
    const color = issueType === "Violating Building" ? "#D62828" : "#F4A261";

    const incidentGraphic = new Graphic({
        geometry: event.mapPoint,
        symbol: {
            type: "simple-marker",
            color: color,
            size: 14,
            outline: { color: "white", width: 1.5 }
        },
        attributes: {
            "IssueType": issueType,
            "Description": description,
            "ReportedAt": new Date().toLocaleString()
        }
    });

    tempIncidentsLayer.add(incidentGraphic);
    output.innerHTML = `Draft placed. Click 'Save' to submit.`;
});

startReportingBtn.addEventListener("click", async () => {
    if (reportingMode && tempIncidentsLayer.graphics.length > 0) {
        try {
            // Apply edits to the actual feature layer
            const featuresToSave = tempIncidentsLayer.graphics.toArray();
            const result = await operationalIssuesLayer.applyEdits({
                addFeatures: featuresToSave
            });

            if (result.addFeatureResults.length > 0 && !result.addFeatureResults[0].error) {
                tempIncidentsLayer.removeAll();
                descriptionInput.value = "";
                output.innerHTML = "Issue reported successfully!";
            } else {
                output.innerHTML = "Failed to report issue.";
            }
        } catch (error) {
            console.error("ApplyEdits Error:", error);
            output.innerHTML = "Error saving feature. (Did you add a valid ISSUES_URL?)";
        }
    }

    reportingMode = !reportingMode;
    startReportingBtn.innerText = reportingMode ? "Save Incident" : "Start Reporting Mode";
    startReportingBtn.appearance = reportingMode ? "solid" : "outline";
    if (reportingMode) output.innerHTML = "Click map to place incident.";
});

// ---------------------------------------------------------
// PART 3: Filtering System
// ---------------------------------------------------------
const issuesLayerView = await mapView.whenLayerView(operationalIssuesLayer);

issueFilter.addEventListener("calciteSelectChange", (event) => {
    const selectedType = event.target.value;
    
    // Client-side filtering
    issuesLayerView.filter = new FeatureFilter({
        where: selectedType === "All" ? "1=1" : `IssueType = '${selectedType}'`
    });
});

// ---------------------------------------------------------
// BONUS: Dashboard Counts (Total & Extent)
// ---------------------------------------------------------
async function updateDashboardCounts() {
    // Total Count
    const totalQuery = operationalIssuesLayer.createQuery();
    totalQuery.where = "1=1";
    const totalCount = await operationalIssuesLayer.queryFeatureCount(totalQuery);
    totalIssuesCount.innerHTML = totalCount;

    // Visible Extent Count
    const extentQuery = operationalIssuesLayer.createQuery();
    extentQuery.geometry = mapView.extent;
    extentQuery.spatialRelationship = "intersects";
    const extentCount = await operationalIssuesLayer.queryFeatureCount(extentQuery);
    visibleIssuesCount.innerHTML = extentCount;
}

reactiveUtils.watch(
    () => mapView.stationary,
    async (isStationary) => {
        if (isStationary && !operationalIssuesLayer.loadError) {
            updateDashboardCounts();
        }
    }
);

operationalIssuesLayer.on("edits", () => {
    updateDashboardCounts();
});
