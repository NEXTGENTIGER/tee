import asyncio
import json
from typing import Dict, Any
import subprocess
import os
from datetime import datetime
from .base_scanner import BaseScanner

class NetworkAnalyzer(BaseScanner):
    def __init__(self, target: str, options: Dict[str, Any] = None):
        super().__init__(target, options)
        self.interface = options.get('interface', 'eth0')
        self.duration = options.get('duration', 60)  # en secondes
        self.pcap_file = options.get('pcap_file', f'/tmp/capture_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pcap')

    async def scan(self) -> Dict[str, Any]:
        try:
            self.update_status("running")
            
            # Commande pour capturer le trafic
            capture_cmd = [
                'tshark',
                '-i', self.interface,
                '-w', self.pcap_file,
                '-a', f'duration:{self.duration}'
            ]
            
            # Exécuter la capture
            capture_process = await asyncio.create_subprocess_exec(
                *capture_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            await capture_process.communicate()
            
            if not os.path.exists(self.pcap_file):
                self.add_error("Failed to create capture file")
                self.update_status("failed")
                return self.results

            # Analyser le fichier de capture
            analysis_cmd = [
                'tshark',
                '-r', self.pcap_file,
                '-T', 'json',
                '-Y', f'ip.addr == {self.target}'
            ]
            
            analysis_process = await asyncio.create_subprocess_exec(
                *analysis_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await analysis_process.communicate()
            
            if analysis_process.returncode != 0:
                self.add_error(f"Analysis error: {stderr.decode()}")
                self.update_status("failed")
                return self.results

            try:
                # Parser les résultats
                packets = json.loads(stdout)
                
                # Formater les résultats
                analysis_results = {
                    "summary": {
                        "total_packets": len(packets),
                        "protocols": {},
                        "ports": {
                            "source": {},
                            "destination": {}
                        }
                    },
                    "packets": []
                }

                for packet in packets:
                    try:
                        packet_data = packet.get("_source", {}).get("layers", {})
                        
                        # Extraire les informations du paquet
                        packet_info = {
                            "timestamp": packet_data.get("frame", {}).get("frame.time", ""),
                            "protocol": packet_data.get("ip", {}).get("ip.proto", ""),
                            "source": {
                                "ip": packet_data.get("ip", {}).get("ip.src", ""),
                                "port": packet_data.get("tcp", {}).get("tcp.srcport", "") or 
                                       packet_data.get("udp", {}).get("udp.srcport", "")
                            },
                            "destination": {
                                "ip": packet_data.get("ip", {}).get("ip.dst", ""),
                                "port": packet_data.get("tcp", {}).get("tcp.dstport", "") or 
                                       packet_data.get("udp", {}).get("udp.dstport", "")
                            },
                            "length": packet_data.get("frame", {}).get("frame.len", "")
                        }

                        # Mettre à jour les statistiques
                        protocol = packet_info["protocol"]
                        if protocol:
                            analysis_results["summary"]["protocols"][protocol] = \
                                analysis_results["summary"]["protocols"].get(protocol, 0) + 1

                        src_port = packet_info["source"]["port"]
                        if src_port:
                            analysis_results["summary"]["ports"]["source"][src_port] = \
                                analysis_results["summary"]["ports"]["source"].get(src_port, 0) + 1

                        dst_port = packet_info["destination"]["port"]
                        if dst_port:
                            analysis_results["summary"]["ports"]["destination"][dst_port] = \
                                analysis_results["summary"]["ports"]["destination"].get(dst_port, 0) + 1

                        analysis_results["packets"].append(packet_info)

                    except Exception as e:
                        self.add_error(f"Error processing packet: {str(e)}")
                        continue

                self.results["results"] = analysis_results
                self.update_status("completed")

                # Nettoyer le fichier de capture
                if os.path.exists(self.pcap_file):
                    os.remove(self.pcap_file)

            except Exception as e:
                self.add_error(f"Error parsing capture results: {str(e)}")
                self.update_status("failed")

        except Exception as e:
            self.add_error(f"Analysis error: {str(e)}")
            self.update_status("failed")

        return self.results 