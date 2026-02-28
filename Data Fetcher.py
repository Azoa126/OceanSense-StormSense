import xarray as xr

def fetch_sst():
    url = "https://www.ncei.noaa.gov/thredds/dodsC/OisstBase/NetCDF/202401/oisst-avhrr-v02r01.20240101.nc"
    ds = xr.open_dataset(url)
    return ds["sst"].values


def fetch_chlorophyll():
    url = "https://oceandata.sci.gsfc.nasa.gov/opendap/MODISA/L3SMI/2023/001/A2023001.L3m_DAY_CHL_chlor_a_4km.nc"
    ds = xr.open_dataset(url)
    return ds["chlor_a"].values


def fetch_depth_mock(shape):
    import numpy as np
    return np.random.uniform(-4000, -50, shape)
