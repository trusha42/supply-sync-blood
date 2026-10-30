import logging
from typing import Annotated, Callable, Literal

from fastapi import APIRouter, Depends, HTTPException
from langchain_core.messages import AIMessage, ToolMessage
from pydantic import BaseModel, Field

from app.ai.agent import get_agent
from app.ai.context import AgentContext


logger = logging.getLogger(__name__)


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=6000)


class ChatInput(BaseModel):
    message: str = Field(min_length=1, max_length=2000)

    history: list[HistoryMessage] = Field(
        default_factory=list,
        max_length=12,
    )


class ChatOutput(BaseModel):
    reply: str
    tools_used: list[str]


def create_agent_router(
    auth_dependency: Callable,
) -> APIRouter:
    router = APIRouter(
        prefix="/api/agent",
        tags=["BloodBridge Agent"],
    )

    @router.post("/chat", response_model=ChatOutput)
    def chat(
        payload: ChatInput,
        user: Annotated[dict, Depends(auth_dependency)],
    ):
        messages = [
            {
                "role": item.role,
                "content": item.content,
            }
            for item in payload.history
        ]

        messages.append(
            {
                "role": "user",
                "content": payload.message,
            }
        )

        try:
            result = get_agent().invoke(
                {"messages": messages},
                context=AgentContext(user_id=user["id"]),
                config={"recursion_limit": 12},
            )

            final_message = result["messages"][-1]

            if not isinstance(final_message, AIMessage):
                raise RuntimeError("Agent did not finish with an answer.")

            content = final_message.content

            if isinstance(content, str):
                reply = content
            else:
                reply = "\n".join(
                    block["text"]
                    for block in content
                    if isinstance(block, dict)
                    and block.get("type") == "text"
                    and isinstance(block.get("text"), str)
                )

            if not reply.strip():
                raise RuntimeError("Agent returned an empty answer.")

            tools_used = list(
                dict.fromkeys(
                    message.name
                    for message in result["messages"]
                    if isinstance(message, ToolMessage)
                    and message.name
                )
            )

            return ChatOutput(
                reply=reply,
                tools_used=tools_used,
            )

        except Exception as error:
            # Avoid logging prompts, credentials, or database contents.
            logger.error(
                "Agent execution failed (%s).",
                type(error).__name__,
            )

            raise HTTPException(
                status_code=502,
                detail=(
                    "The AI assistant could not complete the request. "
                    "Please try again."
                ),
            ) from None

    return router