from django.http import JsonResponse
from django.views import View
import iiif_prezi3 as prezi
from pydantic import BaseModel
from typing import List
from arches.app.models.models import TileModel 

class RtiManifestGeneratorInput(BaseModel):
    """
    urls are expected WITHOUT trailing forward slash (/)
    """
    manifest_base_url: str
    iiif_server_base_url: str
    group_code: str
    bias: List[float]  
    scale: List[float]
    height: int
    width: int
    images: List[dict]
    type: str
    image_mime_type: str = "image/jpeg"  # Add this field with default value

class RtiManifestView(View):
    def get(self, request, tile_id: str):
        try:
            tile = TileModel.objects.get(tileid=tile_id)
            if not tile:
                return JsonResponse({"error": "Tile not found"}, status=404)
            
            data = tile.data

            rti_data = self._extract_rti_data(data)
            print(rti_data['images'])
            if not rti_data:
                return JsonResponse({"error": "No RTI data found in tile"}, status=404)
            
            input_data = RtiManifestGeneratorInput(
                manifest_base_url=request.build_absolute_uri('/')[:-1],
                iiif_server_base_url="http://localhost:8183/iiif/3",
                bias=rti_data['bias'],
                scale=rti_data['scale'],
                height=rti_data['height'],
                width=rti_data['width'],
                group_code=rti_data['group_code'],
                images=rti_data['images'],
                type=rti_data['type']
            )
            manifest = self._generate_rti_manifest(input_data).dict(exclude_none=True)

            response = JsonResponse(manifest) 
            response["Access-Control-Allow-Origin"] = "*"
            return response

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
        
    def _extract_rti_data(self, tile_data):
        file_list = []
        rti_metadata = None
        group_code = None
        file_type = None
        
        for _, node_value in tile_data.items():
            if node_value and isinstance(node_value, list):
                for file_obj in node_value:
                    if isinstance(file_obj, dict) and 'rti_metadata' in file_obj:
                        if rti_metadata is None:
                            rti_metadata = file_obj['rti_metadata']
                            group_code = file_obj.get('group_code')
                            file_type = file_obj.get("type")
                        
                        if file_obj.get('group_code') == group_code:
                            file_list.append({
                                "name": file_obj.get("name"),
                            })
        
        if rti_metadata and file_list:
            return {
                'group_code': group_code,
                'bias': rti_metadata.get('bias'),
                'scale': rti_metadata.get('scale'),
                'height': rti_metadata.get('height'),
                'width': rti_metadata.get('width'),
                'images': file_list,
                'type': file_type
            }
        return None

    def _generate_rti_manifest(self, input_data: RtiManifestGeneratorInput) -> prezi.Manifest:
        def get_image_name_based_on_plane_number(plane_number:int):
            for image in input_data.images:
                name_lower = image['name'].lower()
                if plane_number == 0 and ('plane_0' in name_lower):
                    return image['name']  # Return just the name string
                elif plane_number == 1 and ('plane_1' in name_lower):
                    return image['name']  # Return just the name string
                elif plane_number == 2 and ('plane_2' in name_lower):
                    return image['name']  # Return just the name string
            return None
        
        manifest = prezi.Manifest(
            id=f"{input_data.manifest_base_url}/{input_data.group_code}/manifest",
            label={ "en": [ f"Visualization of {input_data.group_code}" ] },
            metadata=[
                prezi.KeyValueString(
                    label=prezi.LngString(__root__={
                        "en": [ "PTM Bias Coefficients" ] 
                    }),
                    value=prezi.LngString(__root__={
                        "none": [",".join(str(x) for x in input_data.bias)]
                    })
                ),
                prezi.KeyValueString(
                    label=prezi.LngString(__root__={
                        "en": [ "PTM Scale Coefficients" ] 
                    }),
                    value=prezi.LngString(__root__={
                        "none": [",".join(str(x) for x in input_data.scale)]
                    })
                )
            ],
            items=[
                prezi.Canvas(
                    id=f"{input_data.manifest_base_url}/{input_data.group_code}/canvas/observe",
                    height=input_data.height,
                    width=input_data.width,
                    label={ "en": [ f"RTI obverse visualization of {input_data.group_code}" ] },
                    items=[
                        prezi.AnnotationPage(
                            id=f"{input_data.manifest_base_url}/{input_data.group_code}/annopage/observe",
                            items=[
                                prezi.Annotation(
                                    id=f"{input_data.manifest_base_url}/{input_data.group_code}/annopage/observe/0",
                                    target=f"{input_data.manifest_base_url}/{input_data.group_code}/canvas/observe",
                                    motivation="painting",
                                    body=prezi.AnnotationBody(
                                        id=f"{input_data.iiif_server_base_url}/{get_image_name_based_on_plane_number(0)}/full/max/0/default.jpg",
                                        type="Image",
                                        label={ "en": [ "Plane 0 (Chromaticity)" ] },
                                        format=prezi.Format(__root__=input_data.image_mime_type),
                                        service=prezi.ServiceV3(
                                            id=f"{input_data.iiif_server_base_url}/{get_image_name_based_on_plane_number(0)}",
                                            type="ImageService3",
                                            profile="level1"
                                        )
                                    )
                                ),
                                prezi.Annotation(
                                    id=f"{input_data.manifest_base_url}/{input_data.group_code}/annopage/observe/1",
                                    target=f"{input_data.manifest_base_url}/{input_data.group_code}/canvas/observe",
                                    motivation="painting",
                                    body=prezi.AnnotationBody(
                                        id=f"{input_data.iiif_server_base_url}/{get_image_name_based_on_plane_number(1)}/full/max/0/default.jpg",
                                        type="Image",
                                        label={ "en": [ "Plane 1 (Linear Coefficients)" ] },
                                        format=prezi.Format(__root__=input_data.image_mime_type),
                                        service=prezi.ServiceV3(
                                            id=f"{input_data.iiif_server_base_url}/{get_image_name_based_on_plane_number(1)}",
                                            type="ImageService3",
                                            profile="level1"
                                        )
                                    )
                                ),
                                prezi.Annotation(
                                    id=f"{input_data.manifest_base_url}/{input_data.group_code}/annopage/observe/2",
                                    target=f"{input_data.manifest_base_url}/{input_data.group_code}/canvas/observe",
                                    motivation="painting",
                                    body=prezi.AnnotationBody(
                                        id=f"{input_data.iiif_server_base_url}/{get_image_name_based_on_plane_number(2)}/full/max/0/default.jpg",
                                        type="Image",
                                        label={ "en": [ "Plane 2 (Quadratic Coefficients)" ] },
                                        format=prezi.Format(__root__=input_data.image_mime_type),
                                        service=prezi.ServiceV3(
                                            id=f"{input_data.iiif_server_base_url}/{get_image_name_based_on_plane_number(2)}",
                                            type="ImageService3",
                                            profile="level1"
                                        )
                                    )
                                )
                            ]
                        )
                    ]
                )
            ]
        )
        return manifest
