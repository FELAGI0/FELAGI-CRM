from fastapi import APIRouter

from app.api.v1 import health
from app.modules.clients.router import router as clients_router
from app.modules.deals.router import router as deals_router
from app.modules.tasks.router import router as tasks_router
from app.modules.users.router import auth_router, users_admin_router, users_router

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(users_admin_router)
api_router.include_router(clients_router)
api_router.include_router(deals_router)
api_router.include_router(tasks_router)
