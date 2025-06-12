from app.models import User
from app.database import SessionLocal, Base, engine
from passlib.context import CryptContext
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    # Crée les tables si besoin
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    db = SessionLocal()
    hashed_password = pwd_context.hash("admin")

    if not db.query(User).filter_by(username="admin").first():
        admin = User(
            username="admin",
            email="admin@example.com",
            hashed_password=hashed_password,
            is_active=True,
            role="admin"
        )
        db.add(admin)
        db.commit()
        logger.info("Admin user created successfully!")
    else:
        logger.info("Admin user already exists.")

except Exception as e:
    logger.error(f"Error creating admin user: {str(e)}")
    raise
finally:
    db.close() 