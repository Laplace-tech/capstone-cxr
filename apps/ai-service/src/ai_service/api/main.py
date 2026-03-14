from fastapi import FastAPI

app = FastAPI(title="capstone-cxr ai-service", version="0.1.0")


@app.get("/")
async def root():
    return {"message": "capstone-cxr ai-service is running"}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-service"}


@app.get("/version")
async def version():
    return {
        "service": "ai-service",
        "version": "0.1.0",
        "model_version": "not-loaded-yet"
    }