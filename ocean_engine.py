# --------------------------------------------
# Ocean-Sense PFZ Engine (Copernicus Integrated)
# --------------------------------------------

import numpy as np
import xarray as xr
from datetime import datetime, timedelta

from config import (
    REGION,
    COPERNICUS,
    RESOLUTION,
    WEIGHTS,
    PFZ,
    DEPTH
)

# Optional (install later)
# import copernicusmarine


# --------------------------------------------
# FETCH DATA (SIMULATED → replace with API)
# --------------------------------------------
def fetch_satellite_data():
    """
    TEMP: Simulated data
    Replace with Copernicus API in production
    """

    lat = np.arange(
        REGION["bounds"]["lat_min"],
        REGION["bounds"]["lat_max"],
        RESOLUTION["grid"][RESOLUTION["mode"]]
    )

    lon = np.arange(
        REGION["bounds"]["lon_min"],
        REGION["bounds"]["lon_max"],
        RESOLUTION["grid"][RESOLUTION["mode"]]
    )

    # Simulated environmental fields
    sst = 20 + 5 * np.random.rand(len(lat), len(lon))
    chl = np.random.rand(len(lat), len(lon)) * 2
    uo = np.random.randn(len(lat), len(lon)) * 0.5
    vo = np.random.randn(len(lat), len(lon)) * 0.5

    return lat, lon, sst, chl, uo, vo


# --------------------------------------------
# SST FRONT DETECTION
# --------------------------------------------
def compute_sst_gradient(sst):
    """
    Detect thermal fronts using gradient magnitude
    """
    grad_y, grad_x = np.gradient(sst)
    gradient = np.sqrt(grad_x**2 + grad_y**2)

    # Normalize
    gradient = gradient / (np.max(gradient) + 1e-6)
    return gradient


# --------------------------------------------
# CURRENT CONVERGENCE
# --------------------------------------------
def compute_current_convergence(uo, vo):
    """
    Convergence = -divergence (favorable for fish aggregation)
    """
    du_dx = np.gradient(uo, axis=1)
    dv_dy = np.gradient(vo, axis=0)

    divergence = du_dx + dv_dy
    convergence = -divergence

    # Normalize
    convergence = (convergence - np.min(convergence)) / (
        np.max(convergence) - np.min(convergence) + 1e-6
    )

    return convergence


# --------------------------------------------
# CHL NORMALIZATION
# --------------------------------------------
def normalize_chlorophyll(chl):
    return (chl - np.min(chl)) / (np.max(chl) - np.min(chl) + 1e-6)


# --------------------------------------------
# PFZ MODEL
# --------------------------------------------
def compute_pfz_score(chl, sst_front, currents):
    """
    Weighted PFZ suitability model
    """

    score = (
        WEIGHTS["chlorophyll"] * chl +
        WEIGHTS["sst_front"] * sst_front +
        WEIGHTS["currents"] * currents
    )

    return score


# --------------------------------------------
# EXTRACT PFZ ZONES
# --------------------------------------------
def extract_pfz(lat, lon, pfz_score):
    """
    Convert PFZ grid → list of hotspots
    """

    threshold = PFZ["threshold"]

    zones = []

    for i in range(len(lat)):
        for j in range(len(lon)):
            if pfz_score[i, j] >= threshold:
                zones.append({
                    "lat": float(lat[i]),
                    "lon": float(lon[j]),
                    "score": float(pfz_score[i, j])
                })

    return zones


# --------------------------------------------
# MAIN FUNCTION (API CALL)
# --------------------------------------------
def compute_suitability():
    """
    Main PFZ pipeline
    """

    # 1. Fetch data
    lat, lon, sst, chl, uo, vo = fetch_satellite_data()

    # 2. Compute features
    sst_front = compute_sst_gradient(sst)
    currents = compute_current_convergence(uo, vo)
    chl_norm = normalize_chlorophyll(chl)

    # 3. PFZ Score
    pfz_score = compute_pfz_score(chl_norm, sst_front, currents)

    # 4. Extract zones
    pfz_zones = extract_pfz(lat, lon, pfz_score)

    return pfz_zones
