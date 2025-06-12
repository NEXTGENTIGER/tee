from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import json
from datetime import datetime
import os

from .. import models, schemas, security
from ..database import get_db
from ..scanners.scanner_manager import ScannerManager

router = APIRouter()

# Stockage temporaire des résultats de scan
active_scans = {}

@router.post("/scan/", response_model=schemas.ScanJob)
async def create_scan(
    scan_request: schemas.ScanJobCreate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Crée une nouvelle tâche de scan"""
    try:
        # Créer la tâche de scan dans la base de données
        scan_job = models.ScanJob(
            scan_type=scan_request.scan_type,
            target=scan_request.target,
            parameters=scan_request.parameters,
            status="pending",
            owner_id=current_user.id
        )
        db.add(scan_job)
        db.commit()
        db.refresh(scan_job)

        # Créer le gestionnaire de scan
        manager = ScannerManager(scan_request.target, scan_request.parameters)
        
        # Ajouter les scanners selon le type de scan
        if scan_request.scan_type == "full":
            manager.add_scanner("network", {"scan_type": "full"})
            manager.add_scanner("vulnerability", {"scan_type": "full"})
            manager.add_scanner("network_analysis", {"duration": 300})
        elif scan_request.scan_type == "network":
            manager.add_scanner("network", {"scan_type": "full"})
        elif scan_request.scan_type == "vulnerability":
            manager.add_scanner("vulnerability", {"scan_type": "full"})
        elif scan_request.scan_type == "network_analysis":
            manager.add_scanner("network_analysis", {"duration": 300})
        else:
            raise HTTPException(status_code=400, detail="Invalid scan type")

        # Stocker le gestionnaire pour référence future
        active_scans[scan_job.id] = manager

        # Lancer le scan en arrière-plan
        background_tasks.add_task(run_scan, scan_job.id, manager, db)

        return scan_job

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scan/{scan_id}", response_model=schemas.ScanJob)
async def get_scan(
    scan_id: int,
    current_user: models.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Récupère les informations d'une tâche de scan"""
    scan_job = db.query(models.ScanJob).filter(
        models.ScanJob.id == scan_id,
        models.ScanJob.owner_id == current_user.id
    ).first()
    
    if not scan_job:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    return scan_job

@router.get("/scan/{scan_id}/results")
async def get_scan_results(
    scan_id: int,
    current_user: models.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Récupère les résultats d'une tâche de scan"""
    scan_job = db.query(models.ScanJob).filter(
        models.ScanJob.id == scan_id,
        models.ScanJob.owner_id == current_user.id
    ).first()
    
    if not scan_job:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    if scan_job.status != "completed":
        return {"status": scan_job.status}
    
    # Récupérer les résultats du scan
    if scan_job.id in active_scans:
        return active_scans[scan_job.id].results
    else:
        raise HTTPException(status_code=404, detail="Scan results not found")

@router.get("/scans/", response_model=List[schemas.ScanJob])
async def list_scans(
    current_user: models.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Liste toutes les tâches de scan de l'utilisateur"""
    return db.query(models.ScanJob).filter(
        models.ScanJob.owner_id == current_user.id
    ).all()

async def run_scan(scan_id: int, manager: ScannerManager, db: Session):
    """Exécute un scan en arrière-plan"""
    try:
        # Mettre à jour le statut
        scan_job = db.query(models.ScanJob).filter(models.ScanJob.id == scan_id).first()
        scan_job.status = "running"
        db.commit()

        # Exécuter le scan
        results = await manager.run_all()

        # Créer un rapport
        report = models.Report(
            title=f"Scan Report - {scan_job.target}",
            description=f"Scan type: {scan_job.scan_type}",
            scan_type=scan_job.scan_type,
            target=scan_job.target,
            results=results,
            owner_id=scan_job.owner_id
        )
        db.add(report)
        db.commit()

        # Mettre à jour la tâche de scan
        scan_job.status = "completed"
        scan_job.completed_at = datetime.utcnow()
        scan_job.report_id = report.id
        db.commit()

    except Exception as e:
        # En cas d'erreur, mettre à jour le statut
        scan_job = db.query(models.ScanJob).filter(models.ScanJob.id == scan_id).first()
        scan_job.status = "failed"
        db.commit()
        print(f"Scan error: {str(e)}") 