from fastapi import FastAPI, File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import cv2
from cv2 import dnn_superres
import os

app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory="static", html=True), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- WAKE UP THE EDSR BRAIN ---
print("Loading EDSR Model... Please wait.")
sr = dnn_superres.DnnSuperResImpl_create()
path = "EDSR_x2.pb"
sr.readModel(path)
sr.setModel("edsr", 2)
print("EDSR Model Loaded Successfully!")

@app.post("/api/process")
async def upload_image(file: UploadFile = File(...)):
    try:
        original_filename = file.filename
        original_path = os.path.join(UPLOAD_DIR, original_filename)
        
        image_bytes = await file.read()
        with open(original_path, "wb") as f:
            f.write(image_bytes)

        # 1. READ IMAGE
        img = cv2.imread(original_path)

        # 2. THE MAGIC: EDSR DRAWS THE NEW PIXELS
        print("EDSR is redrawing the image...")
        result = sr.upsample(img)

        # 3. SAVE HIGH-RES IMAGE
        output_filename = f"sr_{original_filename}"
        output_path = os.path.join(UPLOAD_DIR, output_filename)
        cv2.imwrite(output_path, result)

        return JSONResponse(content={
            "status": "success",
            "original_image_url": f"/uploads/{original_filename}",
            "super_res_image_url": f"/uploads/{output_filename}"
        })

    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.get("/")
def read_root():
    return {"message": "Server is running! Open your browser to: http://127.0.0.1:8000/static/index.html"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)