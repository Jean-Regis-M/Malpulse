import logging
import json
import sys
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "filename": record.filename,
            "line_no": record.lineno,
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Inject custom logger variables for Cloud Trace
        if hasattr(record, "trace_id"):
            log_data["logging.googleapis.com/trace"] = record.trace_id
            
        return json.dumps(log_data)

def setup_logger():
    logger = logging.getLogger("mallpulse")
    logger.setLevel(logging.INFO)
    
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    
    logger.addHandler(handler)
    return logger

logger = setup_logger()
