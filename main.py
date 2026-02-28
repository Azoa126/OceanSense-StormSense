from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ocean_engine import compute_suitability

app = FastAPI(title="Ocean-Sense Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {"status": "Ocean Engine Running"}


@app.get("/pfz")
def get_pfz():
    pfz = compute_suitability()
    return {"pfz_zones": pfz}
