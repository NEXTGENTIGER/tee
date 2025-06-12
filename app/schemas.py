from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    role: str

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ReportBase(BaseModel):
    title: str
    description: Optional[str] = None
    scan_type: str
    target: str

class ReportCreate(ReportBase):
    pass

class Report(ReportBase):
    id: int
    results: Dict[str, Any]
    created_at: datetime
    owner_id: int

    class Config:
        orm_mode = True

class ScanJobBase(BaseModel):
    scan_type: str
    target: str
    parameters: Dict[str, Any]

class ScanJobCreate(ScanJobBase):
    pass

class ScanJob(ScanJobBase):
    id: int
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    owner_id: int
    report_id: Optional[int]

    class Config:
        orm_mode = True 