from arches.app.functions.base import BaseFunction
from django.conf import settings
from django.core.files.base import ContentFile
from arches.app.models.models import File
from arches.app.models.models import TileModel
import pprint
import os
import zipfile
import json
import uuid

details = {
    'name': 'RTI Function',
    'type': 'node',
    'description': 'Performs necessary operations on RTI upload',
    'defaultconfig': {},
    'classname': 'RtiFunction',
    'component': 'views/components/functions/rti_function'
}

class RtiFunction(BaseFunction):
    def get(self, *args, **kwargs):
        raise NotImplementedError

    def save(self, *args, **kwargs):
        raise NotImplementedError

    # occurrs after Tile.save
    def post_save(self, *args, **kwargs):
        if args:
            tile = args[0]
        else:
            print("No tile argument provided to post_save.")
            return

        print("=== RTI FUNCTION POST SAVE ===")
        print(f"Called with tile data: {tile.data}")

        nodegroup_id_str = str(tile.nodegroup.nodegroupid)
        original_file_list = tile.data.get(nodegroup_id_str, [])

        already_processed = any(
            'rti_metadata' in f 
            for f in original_file_list 
            if isinstance(f, dict)
        )
        
        if already_processed:
            print("RTI data already present, skipping processing.")
            return

        new_file_list = []
        zip_processed = False
        zip_file_path_to_delete = None

        has_zip = any(
            f.get('name', '').lower().endswith('.zip') and 'path' in f
            for f in original_file_list
        )
        if not has_zip:
            return

        for file_data in original_file_list:
            file_path = file_data.get('path')
            file_name = file_data.get('name', '')

            if file_path and file_name.lower().endswith('.zip'):
                zip_processed = True
                full_path = os.path.join(settings.MEDIA_ROOT, file_path)
                print(f"Zip file found at: {full_path}")

                group_code = os.path.splitext(os.path.basename(full_path))[0]
                print(f"Group code: {group_code}")

                if os.path.exists(full_path):
                    try:
                        with zipfile.ZipFile(full_path, 'r') as f:
                            if not self.zipfile_is_rti(f.namelist()):
                                new_file_list.append(file_data)
                                continue
                            
                            metadata = self.extract_metadata_from_zip(f)
                            if not metadata:
                                new_file_list.append(file_data)
                                continue

                            for member_name in f.namelist():
                                if member_name.lower().endswith(('.jpg', '.jpeg', '.png')):
                                    unique_filename = os.path.basename(f"{uuid.uuid4()}_{member_name}")
                                    image_content = f.read(member_name)

                                    db_file = File()
                                    db_file.tileid = tile.tileid 
                                    db_file.nodeid = tile.nodegroup.nodegroupid
                                    db_file.path.save(unique_filename, ContentFile(image_content), save=True)

                                    ext = os.path.splitext(member_name)[1].lower()
                                    if ext == ".png":
                                        mime_type = "image/png"
                                    else:
                                        mime_type = "image/jpeg"

                                    new_image_data = {
                                        "name": unique_filename,
                                        "file_id": str(db_file.fileid),
                                        "path": db_file.path.name,
                                        "url": f"/files/{db_file.fileid}",
                                        "accepted": True,
                                        "status": "uploaded",
                                        "type": mime_type,
                                        "group_code": group_code,
                                        "rti_metadata": metadata
                                    }

                                    new_file_list.append(new_image_data)
                                    print(f"Extracted and saved: {unique_filename}")
                        
                        # Store path for later deletion
                        zip_file_path_to_delete = full_path

                    except Exception as e:
                        print(f"Error processing zip file {full_path}: {e}")
                        import traceback
                        traceback.print_exc()
                        new_file_list.append(file_data)
                        
            else:
                new_file_list.append(file_data)

        if zip_processed and new_file_list:

            tile.data[nodegroup_id_str] = new_file_list
            TileModel.objects.filter(tileid=tile.tileid).update(data=tile.data)
            
            print("Updated tile data with extracted images.")
            print(f"New file count: {len(new_file_list)}")
            
            if zip_file_path_to_delete and os.path.exists(zip_file_path_to_delete):
                try:
                    os.remove(zip_file_path_to_delete)
                    print(f"Removed original zip file: {zip_file_path_to_delete}")
                except Exception as e:
                    print(f"Warning: Could not delete ZIP file: {e}")

    def zipfile_is_rti(self, zipfile_namelist: list):
        image_list = []
        metadata_list = []
        for name in zipfile_namelist:
            name_lower = name.lower()
            if name_lower.endswith(('.jpg', '.jpeg', '.png')):
                image_list.append(name)
            elif name_lower.endswith('.json'):
                metadata_list.append(name)
        return len(image_list) == 3 and len(metadata_list) == 1

    def retrieve_metadata_from_manifest_file(self, manifest_json_file: zipfile.ZipExtFile):
        try:
            content = manifest_json_file.read()
            if not content:
                return {}
            manifest_dict = json.loads(content.decode('utf-8'))
            return manifest_dict if self.manifest_is_valid_rti(manifest_dict) else {}
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            print(f"Error decoding JSON from manifest: {e}")
            return {}

    def manifest_is_valid_rti(self, manifest_dict: dict):
        required_keys = {"width", "height", "format", "type", "colorspace", "lights", "nplanes", "quality", "materials"}
        return required_keys.issubset(manifest_dict.keys())
    
    def extract_metadata_from_zip(self, zip_file):
        for name in zip_file.namelist():
            if name.lower().endswith('.json'):
                with zip_file.open(name) as json_file:
                    manifest_dict = self.retrieve_metadata_from_manifest_file(json_file)
                    if manifest_dict:
                        bias = manifest_dict.get('materials', [{}])[0].get('bias', [])
                        scale = manifest_dict.get('materials', [{}])[0].get('scale', [])
                        return {
                            'height': manifest_dict.get('height'),
                            'width': manifest_dict.get('width'),
                            'bias': [float(x) for x in bias],
                            'scale': [float(x) for x in scale]
                        }
        return None

    def delete(self, *args, **kwargs):
        print("=== DELETE METHOD ===")
        print("Args:", args)
        print("Kwargs:", kwargs)
        if args:
            tile = args[0]
        else:
            print("No tile argument provided to post_save.")
            return
        
        nodegroup_id_str = str(tile.nodegroup.nodegroupid)
        tile_file_list = tile.data.get(nodegroup_id_str, [])
        
        for file_data in tile_file_list:
            if isinstance(file_data, dict) and 'rti_metadata' in file_data:
                file_id = file_data.get('file_id')
                if file_id:
                    try:
                        db_file = File.objects.get(fileid=file_id)
                        if db_file.path:
                            db_file.path.delete(save=False)
                        db_file.delete()
                        print(f"Deleted RTI file: {file_data.get('name')}")
                    except File.DoesNotExist:
                        print(f"File {file_id} already deleted")
                    except Exception as e:
                        print(f"Error deleting file {file_id}: {e}")

    def on_import(self, *args, **kwargs):
        print("=== ON_IMPORT METHOD ===")
        print("Args:", args)
        print("Kwargs:", kwargs)
        raise NotImplementedError

    def after_function_save(self, *args, **kwargs):
        print("=== AFTER_FUNCTION_SAVE METHOD ===")
        print("Args:", args)
        print("Kwargs:", kwargs)
        print("Available attributes on self:", [attr for attr in dir(self) if not attr.startswith('_')])
        
        if hasattr(self, 'config'):
            print("Function config:")
            pprint.pprint(self.config)
        
        if args:
            function_x_graph = args[0]
            print("FunctionXGraph object:", function_x_graph)
            print("FunctionXGraph attributes:", [attr for attr in dir(function_x_graph) if not attr.startswith('_')])
            if hasattr(function_x_graph, 'config'):
                print("FunctionXGraph config:")
                pprint.pprint(function_x_graph.config)
            if hasattr(function_x_graph, 'graph'):
                print("Associated graph:", function_x_graph.graph)
                print("Graph name:", function_x_graph.graph.name if function_x_graph.graph else "None")