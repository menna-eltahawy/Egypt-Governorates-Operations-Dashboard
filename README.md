# Egypt Governorates Operations Dashboard

An interactive Web GIS application designed to visualize population distribution across Egypt's governorates and handle lightweight operational issue reporting workflows. Built strictly using Vanilla JavaScript, ArcGIS Maps SDK for JavaScript v5, and the Calcite Design System.

## Features

### Part 1: Governorates Visualization
* **Data-Driven Symbology:** Utilizes `ClassBreaksRenderer` to dynamically classify and style Egypt's governorates based on population metrics.
* **Smart Popups:** Configured customized popup templates displaying Governorate Name, Total Population, and Area (KM²).
* **On-the-fly Analytics:** Integrates Arcade expressions inside the popup to dynamically compute and format Population Density.

### Part 2: Custom Operational Reporting System
* **Dynamic Geometry Creation:** Allows users to log incidents directly onto the map as spatial point features (Violating Buildings or Street Issues) without relying on default Editor widgets.
* **Symbology Differentiation:** Implements `UniqueValueRenderer` to visually differentiate distinct incident types using custom colors and markers.
* **Database Synchronization:** Seamlessly executes transaction workflows utilizing `applyEdits` to write client-generated graphics directly to a Hosted Feature Layer database.

### Part 3: Advanced Filtering Workflows
* **Client-Side Optimization:** Leverages `FeatureFilter` on the layer view to achieve zero-latency, real-time spatial and attribute filtering based on selected dropdown options.

### Bonus Features Implemented
* **ArcGIS Search Widget:** Custom-tailored to query specific attribute fields within the Governorates layer.
* **Analytical Dashboard Counters:** Monitors and updates the cumulative total of reported incidents globally, as well as the subset of features residing within the user's active screen viewport (`view.extent`) via `reactiveUtils`.
* **Out-of-the-box GIS Controls:** Integrated native `LayerList`, `Legend`, and `BasemapToggle` web components.

## Tech Stack
* Vanilla JavaScript (ES6+ Module Architecture)
* ArcGIS Maps SDK for JavaScript v5
* Esri Calcite Design System
* HTML5 & CSS3

## Setup Instructions
1. Clone the repository.
2. Create a `config.js` file in the root directory.
3. Add your ArcGIS Developer API Key and layer URLs:

```javascript
export const API_KEY = "YOUR_API_KEY";
export const GOV_URL = "YOUR_GOVERNORATES_FEATURE_LAYER_URL";
export const ISSUES_URL = "YOUR_ISSUES_FEATURE_LAYER_URL";

