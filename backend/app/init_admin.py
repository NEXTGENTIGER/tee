from sqlalchemy.orm import Session
from . import models, security
from .database import SessionLocal, engine
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_admin():
    try:
        # Création des tables
        models.Base.metadata.create_all(bind=engine)
        
        # Création de la session
        db = SessionLocal()
        
        # Vérification si l'admin existe déjà
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if admin:
            logger.info("L'utilisateur admin existe déjà")
            return
        
        # Création de l'admin
        hashed_password = security.get_password_hash("admin")
        admin = models.User(
            username="admin",
            email="admin@example.com",
            hashed_password=hashed_password,
            is_active=True,
            role="admin"
        )
        
        db.add(admin)
        db.commit()
        logger.info("Utilisateur admin créé avec succès")
        
    except Exception as e:
        logger.error(f"Erreur lors de la création de l'admin: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_admin() 