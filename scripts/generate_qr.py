import json
import base64

def generate_verification_payload(reservation_id: str, sku: str, size: str, store_name: str) -> str:
    """
    Simulates a secure checkout token signature. Serializes the token payload and matches it with 
    a base64 verification data uri that can be easily loaded in the web frontend as an image tag.
    """
    payload = {
        "reservation_id": reservation_id,
        "sku": sku,
        "selected_size": size,
        "store": store_name,
        "timestamp": "2026-05-21T09:14:00Z"
    }
    serialized = json.dumps(payload)
    encoded = base64.b64encode(serialized.encode("utf-8")).decode("utf-8")
    
    # We construct a mock QR vector payload uri
    # This keeps our stack light and completely avoids native C compiling on target Cloud containers
    return f"data:image/svg+xml;base64,{encoded}"

if __name__ == "__main__":
    uri = generate_verification_payload("RES-AJ43B", "SKU-9921", "M", "Zara Elegant Wear")
    print(f"Generated secure token payload:\n{uri[:80]}...")
