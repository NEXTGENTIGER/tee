from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import uvicorn
import logging
from datetime import timedelta

from . import models, schemas, security
from .database import SessionLocal, engine, get_db
from .database import Base
from .init_admin import init_admin
from .routers import scan

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Création des tables au démarrage
Base.metadata.create_all(bind=engine)

# Initialisation de l'admin
init_admin()

app = FastAPI(title="Security Toolbox API")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Dépendance pour obtenir la session DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

# Inclure les routeurs
app.include_router(scan.router, prefix="/api/v1", tags=["scan"])

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    logger.info(f"Tentative de connexion pour l'utilisateur: {form_data.username}")
    user = security.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        logger.warning(f"Échec de l'authentification pour l'utilisateur: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    logger.info(f"Connexion réussie pour l'utilisateur: {form_data.username}")
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/")
async def root():
    return {"message": "Security Toolbox API is running"}

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(security.get_current_active_user)):
    return current_user

@app.get("/users/me/reports/", response_model=List[schemas.Report])
async def read_user_reports(current_user: models.User = Depends(security.get_current_active_user), db: Session = Depends(get_db)):
    return db.query(models.Report).filter(models.Report.owner_id == current_user.id).all()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 