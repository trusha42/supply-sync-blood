from typing import Literal

from langchain.tools import ToolRuntime, tool
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.ai.context import AgentContext
from app.database import SessionLocal


BloodGroup = Literal[
    "A+", "A-", "B+", "B-",
    "AB+", "AB-", "O+", "O-",
]

BloodComponent = Literal[
    "whole_blood",
    "red_cells",
    "platelets",
    "plasma",
    "cryoprecipitate",
]


class InventorySearchInput(BaseModel):
    city: str = Field(
        min_length=1,
        max_length=100,
        description="The city to search, for example Nashik.",
    )

    blood_group: BloodGroup

    component: BloodComponent

    quantity: int = Field(
        ge=1,
        le=100,
        description="Requested quantity in the application's component units.",
    )


@tool(args_schema=InventorySearchInput)
def search_inventory(
    city: str,
    blood_group: str,
    component: str,
    quantity: int,
) -> dict:
    """Search exact blood-group/component inventory listings in a city.

    Searches verified organizations and unexpired available inventory.
    Does not assess clinical compatibility, reserve stock, or guarantee supply.
    """

    with SessionLocal() as db:
        rows = db.execute(
            text("""
                SELECT
                    i.id AS inventory_id,
                    o.id AS organization_id,
                    o.name AS organization_name,
                    o.city,
                    i.blood_group,
                    i.component,
                    i.quantity_on_hand - i.quantity_reserved
                        AS available_quantity,
                    i.updated_at,
                    i.expires_at
                FROM blood_inventory AS i
                JOIN organizations AS o
                  ON o.id = i.organization_id
                WHERE o.verification_status = 'verified'
                  AND LOWER(o.city) = LOWER(:city)
                  AND i.blood_group = :blood_group
                  AND i.component = :component
                  AND i.stock_status = 'available'
                  AND i.expires_at > CURRENT_TIMESTAMP
                  AND (
                      i.quantity_on_hand - i.quantity_reserved
                  ) >= :quantity
                ORDER BY i.updated_at DESC, i.expires_at ASC
                LIMIT 10
            """),
            {
                "city": city.strip(),
                "blood_group": blood_group,
                "component": component,
                "quantity": quantity,
            },
        ).mappings().all()

    listings = []

    for row in rows:
        item = dict(row)
        item["updated_at"] = item["updated_at"].isoformat()
        item["expires_at"] = item["expires_at"].isoformat()
        listings.append(item)

    return {
        "listings": listings,
        "count": len(listings),
        "search_basis": (
            "Exact city, blood group, and component. "
            "Each returned inventory row can cover the requested quantity."
        ),
        "limitations": (
            "These are database listings, not confirmed reservations. "
            "No clinical compatibility assessment has been performed. "
            "Check the stock-update timestamp and confirm with the facility."
        ),
    }


@tool
def get_my_requests(
    runtime: ToolRuntime[AgentContext],
) -> dict:
    """List the latest blood requests created by the signed-in user."""

    with SessionLocal() as db:
        rows = db.execute(
            text("""
                SELECT
                    id,
                    blood_group,
                    component,
                    quantity_requested,
                    hospital_name,
                    city,
                    required_by,
                    status,
                    created_at
                FROM blood_requests
                WHERE created_by = :user_id
                ORDER BY created_at DESC
                LIMIT 10
            """),
            {"user_id": runtime.context.user_id},
        ).mappings().all()

    requests = []

    for row in rows:
        item = dict(row)
        item["required_by"] = item["required_by"].isoformat()
        item["created_at"] = item["created_at"].isoformat()
        requests.append(item)

    return {"requests": requests, "count": len(requests)}