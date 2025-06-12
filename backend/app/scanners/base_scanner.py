from abc import ABC, abstractmethod
import json
from datetime import datetime
from typing import Dict, Any

class BaseScanner(ABC):
    def __init__(self, target: str, options: Dict[str, Any] = None):
        self.target = target
        self.options = options or {}
        self.results = {
            "scanner": self.__class__.__name__,
            "target": target,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "pending",
            "results": {}
        }

    @abstractmethod
    async def scan(self) -> Dict[str, Any]:
        """Execute the scan and return results"""
        pass

    def to_json(self) -> str:
        """Convert results to JSON string"""
        return json.dumps(self.results, indent=2)

    def save_results(self, filename: str) -> None:
        """Save results to a JSON file"""
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)

    def update_status(self, status: str) -> None:
        """Update scan status"""
        self.results["status"] = status

    def add_error(self, error: str) -> None:
        """Add error to results"""
        if "errors" not in self.results:
            self.results["errors"] = []
        self.results["errors"].append({
            "message": error,
            "timestamp": datetime.utcnow().isoformat()
        }) 