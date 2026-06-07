from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
import os

from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI(title="Personal Finance Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app)

MONGO_URL = os.getenv("MONGO_URL", "mongodb://db:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client["financedb"]

# ── helpers ──────────────────────────────────────────────
def fix_id(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

CATEGORIES = [
    "Food", "Transport", "Housing", "Entertainment",
    "Healthcare", "Shopping", "Education", "Salary",
    "Freelance", "Investment", "Other"
]

# ── models ───────────────────────────────────────────────
class Transaction(BaseModel):
    title: str
    amount: float
    type: str          # "income" or "expense"
    category: str
    date: str          # ISO date string
    note: Optional[str] = ""

class Budget(BaseModel):
    category: str
    limit: float
    month: str         # format: "2024-06"

# ── transactions ─────────────────────────────────────────
@app.get("/transactions")
async def get_transactions(type: Optional[str] = None, category: Optional[str] = None):
    query = {}
    if type:
        query["type"] = type
    if category:
        query["category"] = category
    cursor = db.transactions.find(query).sort("date", -1)
    return [fix_id(doc) async for doc in cursor]

@app.post("/transactions")
async def create_transaction(t: Transaction):
    result = await db.transactions.insert_one(t.dict())
    doc = await db.transactions.find_one({"_id": result.inserted_id})
    return fix_id(doc)

@app.delete("/transactions/{tid}")
async def delete_transaction(tid: str):
    result = await db.transactions.delete_one({"_id": ObjectId(tid)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"status": "deleted"}

# ── summary (for dashboard) ───────────────────────────────
@app.get("/summary")
async def get_summary():
    pipeline = [
        {"$group": {
            "_id": "$type",
            "total": {"$sum": "$amount"}
        }}
    ]
    results = {}
    async for doc in db.transactions.aggregate(pipeline):
        results[doc["_id"]] = doc["total"]

    income = results.get("income", 0)
    expense = results.get("expense", 0)

    # spending by category
    cat_pipeline = [
        {"$match": {"type": "expense"}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}}
    ]
    by_category = {}
    async for doc in db.transactions.aggregate(cat_pipeline):
        by_category[doc["_id"]] = doc["total"]

    # last 6 months trend
    trend_pipeline = [
        {"$match": {"type": "expense"}},
        {"$group": {
            "_id": {"$substr": ["$date", 0, 7]},
            "total": {"$sum": "$amount"}
        }},
        {"$sort": {"_id": 1}},
        {"$limit": 6}
    ]
    trend = []
    async for doc in db.transactions.aggregate(trend_pipeline):
        trend.append({"month": doc["_id"], "total": doc["total"]})

    return {
        "income": income,
        "expense": expense,
        "savings": income - expense,
        "by_category": by_category,
        "trend": trend
    }

# ── budgets ──────────────────────────────────────────────
@app.get("/budgets")
async def get_budgets(month: Optional[str] = None):
    query = {}
    if month:
        query["month"] = month
    cursor = db.budgets.find(query)
    budgets = [fix_id(doc) async for doc in cursor]

    # attach spent amount for each budget
    for b in budgets:
        month_start = b["month"] + "-01"
        month_end   = b["month"] + "-31"
        pipeline = [
            {"$match": {
                "type": "expense",
                "category": b["category"],
                "date": {"$gte": month_start, "$lte": month_end}
            }},
            {"$group": {"_id": None, "spent": {"$sum": "$amount"}}}
        ]
        spent = 0
        async for doc in db.transactions.aggregate(pipeline):
            spent = doc["spent"]
        b["spent"] = spent

    return budgets

@app.post("/budgets")
async def create_budget(b: Budget):
    # upsert — one budget per category per month
    await db.budgets.update_one(
        {"category": b.category, "month": b.month},
        {"$set": b.dict()},
        upsert=True
    )
    doc = await db.budgets.find_one({"category": b.category, "month": b.month})
    return fix_id(doc)

@app.delete("/budgets/{bid}")
async def delete_budget(bid: str):
    await db.budgets.delete_one({"_id": ObjectId(bid)})
    return {"status": "deleted"}

@app.get("/categories")
async def get_categories():
    return CATEGORIES

@app.get("/health")
async def health():
    return {"status": "ok"}