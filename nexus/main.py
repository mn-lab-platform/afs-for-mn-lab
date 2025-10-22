import os
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Nexus Converter", description="File conversion service using Nexus")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = Path("/app/temp")
NEXUS_PATH = Path("/app/nexus")

@app.post("/convert")
async def convert_file(file: UploadFile = File(...), nexus_values: Optional[str] = Form(None)):
    """
    Convert uploaded file to NXS format and then compress to NxZ
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    base_name = Path(file.filename).stem if file.filename else "upload"
    original_extension = Path(file.filename).suffix if file.filename else ""
    
    input_file = TEMP_DIR / f"{base_name}{original_extension}"
    nxs_file = TEMP_DIR / f"{base_name}.nxs"
    nxz_file = TEMP_DIR / f"{base_name}.nxz"
    
    try:
        # Save uploaded file
        with open(input_file, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        print(f"Saved input file: {input_file} ({len(content)} bytes)")
        
        # Convert to NXS - Pass the nexus_values parameter
        await convert_to_nxs(input_file, nxs_file, nexus_values)
        
        # Convert NXS to nxz
        await convert_to_nxz(nxs_file, nxz_file)
        
        # Return the nxz file
        return FileResponse(
            path=nxz_file,
            filename=f"{base_name}.nxz",
            media_type="application/octet-stream"
        )
    
    except Exception as e:
        error_msg = f"File conversion failed: {str(e)}"
        print(f"ERROR: {error_msg}")
        # Clean up files on error
        cleanup_files([input_file, nxs_file, nxz_file])
        raise HTTPException(status_code=500, detail=error_msg)
    
    finally:
        # Clean up input file
        cleanup_files([input_file])

def parse_nexus_values(values_string: Optional[str]) -> list[str]:
    """
    Parse comma-separated values into nexus command line arguments.
    Expected format: "value1,value2,value3,value4,value5,value6,value7,value8,value9,value10,value11,value12,value13,value14"
    
    Values in order:
    0: node_faces (or empty for default)
    1: top_node_faces (or empty for default) 
    2: decimation (IGNORED - not supported in this nxsbuild version)
    3: scaling (or empty for default)
    4: orig_textures (1/0 or empty)
    5: adaptive (or empty for default)
    6: vertex_quantization (or empty for default)
    7: texture_quality (or empty for default)
    8: point_cloud (1/0 or empty)
    9: normals (1/0 or empty)
    10: no_normals (1/0 or empty)
    11: colors (1/0 or empty)
    12: no_colors (1/0 or empty)
    13: no_textures (1/0 or empty)

    Example: "8000,2048,edgelen,0.3,1,0.5,85,1,1,0,1,0,0"
    """
    if not values_string:
        return []
    
    values = [v.strip() for v in values_string.split(",")]
    args = []
    
    # Pad with empty strings if not enough values provided
    while len(values) < 14:
        values.append("")
    print(f"Parsed nexus values: {values}")
    
    # Process each value according to its position - skip empty values
    if values[0]:  # node_faces
        args.extend(["-f", values[0]])
    
    if values[1]:  # top_node_faces
        args.extend(["-t", values[1]])
    
    # Skip values[2] - decimation method is NOT supported in this nxsbuild version
    
    if values[3]:  # scaling
        args.extend(["-s", values[3]])
    
    if values[4] == "1":  # orig_textures
        args.append("-O")
    
    if values[5]:  # adaptive
        args.extend(["-a", values[5]])
    
    if values[6]:  # vertex_quantization
        args.extend(["-v", values[6]])
    
    if values[7]:  # texture_quality
        args.extend(["-q", values[7]])
    
    if values[8] == "1":  # point_cloud
        args.append("-p")
    
    if values[9] == "1":  # normals
        args.append("-N")
    
    if values[10] == "1":  # no_normals
        args.append("-n")
    
    if values[11] == "1":  # colors
        args.append("-C")
    
    if values[12] == "1":  # no_colors
        args.append("-c")
    
    if values[13] == "1":  # no_textures
        args.append("-u")
    
    print(f"Generated nexus arguments: {args}")
    return args

async def convert_to_nxs(input_file: Path, output_file: Path, nexus_values: Optional[str] = None):
    """Convert input file to NXS format using Nexus with optional parameters"""
    try:
        # Base command
        cmd = ["/app/usr/bin/nxsbuild", str(input_file)]
        
        # Parse and add custom parameters
        custom_args = parse_nexus_values(nexus_values)
        cmd.extend(custom_args)
        
        # Add output file LAST
        cmd.extend(["-o", str(output_file)])
        
        print(f"Running nexus command: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        print(f"Nexus stdout: {result.stdout}")
        print(f"Nexus stderr: {result.stderr}")
    except subprocess.CalledProcessError as e:
        print(f"Nexus conversion failed with return code {e.returncode}")
        print(f"Nexus stdout: {e.stdout}")
        print(f"Nexus stderr: {e.stderr}")
        raise Exception(f"Nexus conversion failed: {e.stderr}")

async def convert_to_nxz(nxs_file: Path, nxz_file: Path):
    """Compress NXS file to nxz format"""
    try:
        result = subprocess.run(
            ["/app/usr/bin/nxsedit", str(nxs_file), "-z"],
            capture_output=True,
            text=True,
            check=True
        )
    except subprocess.CalledProcessError as e:
        raise Exception(f"Nexus compression failed: {e.stderr}")

def cleanup_files(files: list[Path]):
    """Clean up temporary files"""
    for file_path in files:
        try:
            if file_path.exists():
                file_path.unlink()
        except Exception as e:
            print(f"Warning: Could not delete {file_path}: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)