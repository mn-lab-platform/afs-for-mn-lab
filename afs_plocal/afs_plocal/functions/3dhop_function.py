import os
import uuid
import json
import time
import traceback
import requests
from django.conf import settings
from django.core.files.base import ContentFile
from arches.app.functions.base import BaseFunction
from arches.app.models.models import File, TileModel

details = {
    "name": "3D 3DHOP Function",
    "type": "node",
    "description": "Converts uploaded .ply/.obj to .nxz for 3DHOP when toggle is true on the 3DHOP card",
    "defaultconfig": {},
    "classname": "ThreeDHopFunction",
    "component": "views/components/functions/default-function",
}

class ThreeDHopFunction(BaseFunction):
    CONVERTER_URL    = os.environ.get("NX_CONVERTER_URL", "http://nexus_converter:3000/convert")
    TOGGLE_NODEGROUP = "c25dc66e-ab3f-11f0-9fd3-c2b0313cb8b9"  # your 3DHOP card (with the boolean)
    FILES_NODEGROUP  = "7c486328-d380-11e9-b88e-a4d18cec433a"  # Files of Digital Resource card
    SUPPORTED_EXTS   = {".ply", ".obj"}

    # If your boolean lives on a specific node (often same as nodegroup id), put it here:
    TOGGLE_BOOL_NODE = "c25dc66e-ab3f-11f0-9fd3-c2b0313cb8b9"
    
    # Add this line - replace with your actual nexus parameters node ID
    NEXUS_PARAMS_NODE = "fccd3fdc-ab3f-11f0-9fd3-c2b0313cb8b9"  # Replace with actual node ID

    def _resolve_abs(self, rel):
        if not rel:
            return None
        return rel if os.path.isabs(rel) else os.path.join(settings.MEDIA_ROOT, rel)

    def _list_items(self, v):
        return v if isinstance(v, list) else ([v] if v else [])

    def _ext(self, item):
        name = (item.get("name") or "")
        path = (item.get("path") or "")
        return (os.path.splitext(name)[1] or os.path.splitext(path)[1]).lower()

    def _scan_files_tile(self, resource_id):
        """
        Return a list of (tile, nodekey, item) for all supported source files
        on the Files card of this resource.
        """
        results = []
        for t in TileModel.objects.filter(resourceinstance_id=resource_id).exclude(data__isnull=True):
            if str(t.nodegroup_id) != self.FILES_NODEGROUP:
                continue
            for nodekey, nodeval in (t.data or {}).items():
                for it in self._list_items(nodeval):
                    if isinstance(it, dict) and it.get("path") and self._ext(it) in self.SUPPORTED_EXTS:
                        results.append((t, nodekey, it))
        return results

    def _nxz_exists_for_source(self, tile_data, nodekey, source_file_id):
        """
        Check if an NXZ (derived_from = source_file_id) is already present on the node.
        """
        for it in self._list_items((tile_data or {}).get(nodekey)):
            if isinstance(it, dict) and it.get("derived_from") == str(source_file_id):
                return True
        return False

    def _append_nxz_item(self, source_tile, source_nodekey, db_file, bytes_len, derived_from_file_id):
            updated = dict(source_tile.data or {})
            print(f"updatedupdatedupdatedupdatedupdatedupdatedupdatedupdatedupdatedupdatedupdatedupdatednxz: {updated}")
            items = self._list_items(updated.get(source_nodekey))
            new_item = {
                "name": os.path.basename(db_file.path.name),
                "file_id": str(db_file.fileid),
                "path": db_file.path.name,
                "url": f"/files/{db_file.fileid}",
                "accepted": True,
                "status": "uploaded",
                "type": "application/octet-stream",
                "lastModified": int(time.time() * 1000),
                "size": bytes_len,
                "derived_from": str(derived_from_file_id),
                "index": len(items),
                # Add the missing fields to match original file structure
                "title": {"en": {"value": "", "direction": "ltr"}},
                "altText": {"en": {"value": "", "direction": "ltr"}},
                "attribution": {"en": {"value": "", "direction": "ltr"}},
                "description": {"en": {"value": "", "direction": "ltr"}},
                "content": f"blob:http://localhost/{uuid.uuid4()}"
            }
            items.append(new_item)
            updated[source_nodekey] = items
            TileModel.objects.filter(tileid=source_tile.tileid).update(data=updated)

    def post_save(self, *args, **kwargs):
        # Run ONLY when the 3DHOP toggle card is saved
        tile = args[0]
        if str(tile.nodegroup_id) != self.TOGGLE_NODEGROUP:
            print("[3DHOP] skip: not 3DHOP card")
            return

        # Boolean must be true
        enable = tile.data.get(self.TOGGLE_BOOL_NODE, None)
        print(f"[3DHOP] toggle value: {enable}")
        if not enable:
            print("[3DHOP] toggle OFF -> no conversion")
            return
        # Get nexus parameters from tile
        nexus_params = tile.data.get(self.NEXUS_PARAMS_NODE, "")
        print(f"[3DHOP] nexus parameters: {nexus_params}")

        # Find all PLY/OBJ on Files card
        sources = self._scan_files_tile(tile.resourceinstance_id)
        if not sources:
            print("[3DHOP] no source files found on Files card")
            return

        for source_tile, source_nodekey, src in sources:
            src_file_id = src.get("file_id")
            if not src_file_id:
                continue

            # idempotency: skip if nxz already exists for this source
            if self._nxz_exists_for_source(source_tile.data, source_nodekey, src_file_id):
                print(f"[3DHOP] NXZ already exists for source file_id={src_file_id}, skip")
                continue

            rel_in = src.get("path")
            abs_in = self._resolve_abs(rel_in)
            if not abs_in or not os.path.exists(abs_in):
                print(f"[3DHOP] missing input: {rel_in}")
                continue

            # Convert
            try:
                print(f"[3DHOP] converting {abs_in} -> NXZ ...")
                with open(abs_in, "rb") as f:
                    params = {}
                    if nexus_params:
                        params = nexus_params.get("en", {}).get("value", "")
                         # Changed from nexus_params to nexus_values
                    print(f"Sending nexus_values: {params}")
                    resp = requests.post(
                        self.CONVERTER_URL,
                        files={"file": (os.path.basename(abs_in), f)},
                        data={"nexus_values": params},
                        timeout=600,
                    )
                print(f"[3DHOP] converter status={resp.status_code}")
                resp.raise_for_status()
            except Exception:
                print("[3DHOP][ERROR] conversion failed")
                traceback.print_exc()
                continue

            # Save NXZ through File model on the SAME tile+node as the source
            base = os.path.splitext(os.path.basename(abs_in))[0]
            unique_filename = f"{base}_{uuid.uuid4().hex[:8]}.nxz"
            try:
                dbf = File()                      # <-- create first
                dbf.tileid = source_tile.tileid
                print(f"[3DHOP] created File instance for tileid={dbf.tileid}")
                print(f"tile.nodegroup.nodegroupid={tile.nodegroup.nodegroupid}")
                print(f"source_nodekey={source_nodekey}")
                print(f"source_tile.nodegroup.nodegroupid={source_tile.nodegroup.nodegroupid}")
                dbf.nodeid = source_nodekey

                dbf.path.save(unique_filename, ContentFile(resp.content), save=True)
                print(f"source dat= v2222222222222222222a{source_tile.data}")                
                try:
                    dbf.name = unique_filename
                    dbf.save(update_fields=["name"])
                except Exception:
                    pass

                # Append NXZ entry (derived_from links it to the source)
                self._append_nxz_item(
                    source_tile=source_tile,
                    source_nodekey=source_nodekey,
                    db_file=dbf,
                    bytes_len=len(resp.content),
                    derived_from_file_id=src_file_id,
                )
                print(f"source dat= 333333333333333333333333333333333 {source_tile.data}")
                print(f"[3DHOP] ✓ added NXZ for source file_id={src_file_id}")

            except Exception:
                print("[3DHOP][ERROR] failed to save/append NXZ")
                traceback.print_exc()
                continue
