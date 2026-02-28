# --------------------------------------------
# REGION CONFIGURATION
# --------------------------------------------
REGION = {
    "name": "Indian Ocean",
    "bounds": {
        "lat_min": -30,
        "lat_max": 30,
        "lon_min": 30,
        "lon_max": 110
    }
}

# --------------------------------------------
# TEMPORAL CONFIG (AUTO = latest available)
# --------------------------------------------
TIME_CONFIG = {
    "mode": "latest",  # "latest" or "custom"
    "start_date": None,
    "end_date": None
}

# --------------------------------------------
# DEPTH CONFIG
# --------------------------------------------
DEPTH = {
    "surface_level": 0  # meters (important for SST/currents)
}

# --------------------------------------------
# COPERNICUS DATASETS
# --------------------------------------------
COPERNICUS = {
    "base_url": "https://my.cmems-du.eu/motu-web/Motu",
    
    "datasets": {
        "sst": {
            "id": "cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m",
            "variable": "thetao"
        },
        "currents": {
            "id": "cmems_mod_glo_phy-cur_anfc_0.083deg_P1D-m",
            "variables": ["uo", "vo"]
        },
        "chlorophyll": {
            "id": "cmems_obs-oc_glo_bgc-plankton_my_l4-gapfree-multi-4km_P1D",
            "variable": "chl"
        }
    }
}

# --------------------------------------------
# RESOLUTION CONFIG
# --------------------------------------------
RESOLUTION = {
    "mode": "medium",  # "medium" or "high"
    
    "grid": {
        "medium": 0.25,
        "high": 0.083
    }
}

# --------------------------------------------
# MODEL WEIGHTS (SCIENTIFIC TUNING)
# --------------------------------------------
WEIGHTS = {
    "chlorophyll": 0.35,
    "sst_front": 0.25,
    "currents": 0.2,
    "bathymetry": 0.1,
    "upwelling": 0.1
}

# --------------------------------------------
# PFZ DETECTION THRESHOLD
# --------------------------------------------
PFZ = {
    "threshold": 0.65
}

# --------------------------------------------
# AUTH (SET VIA ENV VARIABLES)
# --------------------------------------------
AUTH = {
    "username": None,
    "password": None
}
