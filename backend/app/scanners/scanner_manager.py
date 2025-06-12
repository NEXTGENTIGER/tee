import asyncio
from typing import Dict, Any, List
import json
from datetime import datetime
import os

from .network_scanner import NetworkScanner
from .vulnerability_scanner import VulnerabilityScanner
from .network_analyzer import NetworkAnalyzer

class ScannerManager:
    def __init__(self, target: str, options: Dict[str, Any] = None):
        self.target = target
        self.options = options or {}
        self.scanners = []
        self.results = {
            "target": target,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "pending",
            "results": {}
        }

    def add_scanner(self, scanner_type: str, options: Dict[str, Any] = None) -> None:
        """Ajoute un scanner à la liste des scanners à exécuter"""
        scanner_options = {**self.options, **(options or {})}
        
        if scanner_type == "network":
            self.scanners.append(NetworkScanner(self.target, scanner_options))
        elif scanner_type == "vulnerability":
            self.scanners.append(VulnerabilityScanner(self.target, scanner_options))
        elif scanner_type == "network_analysis":
            self.scanners.append(NetworkAnalyzer(self.target, scanner_options))
        else:
            raise ValueError(f"Unknown scanner type: {scanner_type}")

    async def run_all(self) -> Dict[str, Any]:
        """Exécute tous les scanners en parallèle"""
        try:
            self.results["status"] = "running"
            
            # Exécuter tous les scanners en parallèle
            tasks = [scanner.scan() for scanner in self.scanners]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Traiter les résultats
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    self.results["results"][self.scanners[i].__class__.__name__] = {
                        "status": "failed",
                        "error": str(result)
                    }
                else:
                    self.results["results"][self.scanners[i].__class__.__name__] = result
            
            self.results["status"] = "completed"
            
        except Exception as e:
            self.results["status"] = "failed"
            self.results["error"] = str(e)
        
        return self.results

    def save_results(self, filename: str) -> None:
        """Sauvegarde les résultats dans un fichier JSON"""
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)

    def to_json(self) -> str:
        """Convertit les résultats en chaîne JSON"""
        return json.dumps(self.results, indent=2)

    @staticmethod
    def create_default_scan(target: str) -> 'ScannerManager':
        """Crée un scan par défaut avec tous les scanners"""
        manager = ScannerManager(target)
        
        # Ajouter le scanner réseau
        manager.add_scanner("network", {
            "scan_type": "full",
            "ports": "1-10000"
        })
        
        # Ajouter le scanner de vulnérabilités
        manager.add_scanner("vulnerability", {
            "scan_type": "full"
        })
        
        # Ajouter l'analyseur réseau
        manager.add_scanner("network_analysis", {
            "duration": 300  # 5 minutes
        })
        
        return manager 