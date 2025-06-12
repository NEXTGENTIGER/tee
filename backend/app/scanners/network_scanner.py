import asyncio
import json
from typing import Dict, Any
import subprocess
from .base_scanner import BaseScanner

class NetworkScanner(BaseScanner):
    def __init__(self, target: str, options: Dict[str, Any] = None):
        super().__init__(target, options)
        self.scan_type = options.get('scan_type', 'quick')
        self.ports = options.get('ports', '1-1000')
        self.scripts = options.get('scripts', [])

    async def scan(self) -> Dict[str, Any]:
        try:
            self.update_status("running")
            
            # Définir les options nmap selon le type de scan
            nmap_options = {
                'quick': '-sV -T4',
                'full': '-sV -sC -T4',
                'vulnerability': '-sV -sC --script vuln -T4',
                'custom': '-sV -sC -T4'
            }.get(self.scan_type, '-sV -T4')

            # Construire la commande nmap
            cmd = ['nmap', nmap_options, '-p', self.ports, '-oX', '-', self.target]
            
            # Exécuter nmap
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                self.add_error(f"Nmap error: {stderr.decode()}")
                self.update_status("failed")
                return self.results

            # Parser les résultats XML de nmap
            try:
                from xml.etree import ElementTree
                root = ElementTree.fromstring(stdout)
                
                # Extraire les informations importantes
                scan_results = {
                    "hosts": [],
                    "summary": {
                        "total_hosts": 0,
                        "up_hosts": 0,
                        "open_ports": 0
                    }
                }

                for host in root.findall(".//host"):
                    host_data = {
                        "ip": host.find("address").get("addr"),
                        "status": host.find("status").get("state"),
                        "ports": []
                    }

                    for port in host.findall(".//port"):
                        port_data = {
                            "number": port.get("portid"),
                            "protocol": port.get("protocol"),
                            "state": port.find("state").get("state"),
                            "service": {
                                "name": port.find("service").get("name"),
                                "product": port.find("service").get("product"),
                                "version": port.find("service").get("version")
                            }
                        }
                        host_data["ports"].append(port_data)
                        if port_data["state"] == "open":
                            scan_results["summary"]["open_ports"] += 1

                    scan_results["hosts"].append(host_data)
                    scan_results["summary"]["total_hosts"] += 1
                    if host_data["status"] == "up":
                        scan_results["summary"]["up_hosts"] += 1

                self.results["results"] = scan_results
                self.update_status("completed")

            except Exception as e:
                self.add_error(f"Error parsing nmap results: {str(e)}")
                self.update_status("failed")

        except Exception as e:
            self.add_error(f"Scan error: {str(e)}")
            self.update_status("failed")

        return self.results 