
import json
from typing import TypedDict, Optional, Annotated, Sequence
from langgraph.graph import StateGraph, START, END
from langchain.chat_models import init_chat_model
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, SystemMessage, HumanMessage, BaseMessage, ToolMessage
from langgraph.graph.message import add_messages
from langchain_core.runnables import RunnableConfig

from .tools import all_tools, all_tools_by_name
import logging

logger = logging.getLogger(__name__)


class AgentState(TypedDict):
    """The state of the agent."""
    # add_messages is a reducer
    # See https://langchain-ai.github.io/langgraph/concepts/low_level/#reducers
    messages: Annotated[Sequence[BaseMessage], add_messages]
    # Track the current plan and execution status
    plan: Optional[str]
    execution_results: Optional[str]
    validation_feedback: Optional[str]
    iteration_count: int

# Node implementations for the new workflow

def planner_node(state: AgentState, config: RunnableConfig, llm: BaseChatModel):
    """
    Planner node: Analyzes user input and creates a plan for execution
    """
    logger.info("Planner node called")

    # Get the latest user message
    user_message = None
    for msg in reversed(state["messages"]):
        if isinstance(msg, HumanMessage):
            user_message = msg.content
            break

    if not user_message:
        return {
            "plan": "No user input found",
            "messages": [AIMessage(content="No user input to plan for.")]
        }

    # Check if we have validation feedback to incorporate
    feedback_context = ""
    if state.get("validation_feedback"):
        feedback_context = f"\n\nPrevious validation feedback: {state['validation_feedback']}"
        feedback_context += f"\nPrevious plan: {state.get('plan', 'None')}"
        feedback_context += "\nPlease revise the plan based on this feedback."

    system_prompt = SystemMessage(
        content=f"""You are a planning agent. Your job is to analyze the user's request and create a detailed plan for execution.

Available tools:
- search_web: Search the internet for information
- create_note: Create a new note with title and content
- update_note: Update an existing note
- list_notes: List all available notes
- get_note: Get a specific note by ID
- find_notes_for_topic: Find notes related to a specific topic
- summarize: Summarize text to a specified length

Create a step-by-step plan that specifies:
1. What tools to use
2. In what order
3. What information to gather or create
4. How to structure the final output

User request: {user_message}{feedback_context}

Respond with a clear, actionable plan."""
    )

    response = llm.invoke([system_prompt] + state["messages"], config)

    return {
        "plan": response.content,
        "messages": [response],
        "validation_feedback": None  # Clear previous feedback
    }


def executor_node(state: AgentState, config: RunnableConfig, llm: BaseChatModel):
    """
    Executor node: Executes the plan by calling appropriate tools
    """
    logger.info("Executor node called")

    if not state.get("plan"):
        return {
            "execution_results": "No plan available for execution",
            "messages": [AIMessage(content="No plan available for execution.")]
        }

    system_prompt = SystemMessage(
        content=f"""You are an execution agent. Your job is to execute the following plan by calling the appropriate tools.

Plan to execute: {state['plan']}

Available tools:
- search_web: Search the internet for information
- create_note: Create a new note with title and content
- update_note: Update an existing note
- list_notes: List all available notes
- get_note: Get a specific note by ID
- find_notes_for_topic: Find notes related to a specific topic
- summarize: Summarize text to a specified length

Execute the plan step by step. Call the necessary tools to gather information, create or update notes, and prepare results for validation.
Be thorough and methodical in your execution."""
    )

    # Bind tools to the LLM for this execution
    llm_with_tools = llm.bind_tools(all_tools)
    response = llm_with_tools.invoke([system_prompt] + state["messages"], config)

    # Process any tool calls
    messages = [response]
    if response.tool_calls:
        for tool_call in response.tool_calls:
            try:
                tool_result = all_tools_by_name[tool_call["name"]].invoke(tool_call["args"])
                messages.append(
                    ToolMessage(
                        content=json.dumps(tool_result) if not isinstance(tool_result, str) else tool_result,
                        name=tool_call["name"],
                        tool_call_id=tool_call["id"],
                    )
                )
            except Exception as e:
                logger.error(f"Error executing tool {tool_call['name']}: {e}")
                messages.append(
                    ToolMessage(
                        content=f"Error executing {tool_call['name']}: {str(e)}",
                        name=tool_call["name"],
                        tool_call_id=tool_call["id"],
                    )
                )

    # Compile execution results
    execution_summary = f"Executed plan with {len(response.tool_calls) if response.tool_calls else 0} tool calls"

    return {
        "execution_results": execution_summary,
        "messages": messages
    }


def validator_node(state: AgentState, config: RunnableConfig, llm: BaseChatModel):
    """
    Validator node: Validates the execution results and provides feedback
    """
    logger.info("Validator node called")

    if not state.get("execution_results"):
        return {
            "validation_feedback": "No execution results to validate",
            "messages": [AIMessage(content="No execution results available for validation.")]
        }

    # Get the original user request
    user_message = None
    for msg in reversed(state["messages"]):
        if isinstance(msg, HumanMessage):
            user_message = msg.content
            break

    system_prompt = SystemMessage(
        content=f"""You are a validation agent. Your job is to review the execution results and determine if they adequately address the user's request.

Original user request: {user_message}
Plan that was executed: {state.get('plan', 'No plan available')}
Execution results: {state.get('execution_results', 'No results available')}

Review the execution and determine:
1. Was the user's request fully addressed?
2. Are the results complete and accurate?
3. Is any additional work needed?

If the results are satisfactory, respond with "APPROVED" and provide a summary.
If improvements are needed, respond with "NEEDS_REVISION" and provide specific feedback on what needs to be improved or what additional steps should be taken."""
    )

    response = llm.invoke([system_prompt] + state["messages"], config)

    # Determine if validation passed
    validation_passed = "APPROVED" in response.content.upper()

    return {
        "validation_feedback": response.content if not validation_passed else None,
        "messages": [response]
    }


def should_continue_or_end(state: AgentState):
    """
    Conditional edge function to determine next step after validation
    """
    # Check iteration count to prevent infinite loops
    iteration_count = state.get("iteration_count", 0)
    if iteration_count >= 3:  # Max 3 iterations
        logger.warning("Maximum iterations reached, ending workflow")
        return "end"

    # Check if validation feedback exists (means needs revision)
    if state.get("validation_feedback"):
        return "planner"  # Go back to planner for revision
    else:
        return "end"  # Validation passed, end workflow


def create_graph(provider_config: dict = None):
    """Create a complete graph with dynamic provider"""
    try:
        llm: BaseChatModel = init_chat_model(
                model=provider_config.get("model"),
                model_provider=provider_config.get("model_provider"),
                base_url=provider_config.get("base_url"),
                api_key=provider_config.get("api_key"),
                timeout=provider_config.get("timeout", 30)
            )
    except Exception as e:
        logger.error(f"Error creating LLM: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise

    # Create node functions with LLM bound
    def planner_node_with_llm(state: AgentState, config: RunnableConfig):
        # Increment iteration count
        iteration_count = state.get("iteration_count", 0) + 1
        result = planner_node(state, config, llm)
        result["iteration_count"] = iteration_count
        return result

    def executor_node_with_llm(state: AgentState, config: RunnableConfig):
        return executor_node(state, config, llm)

    def validator_node_with_llm(state: AgentState, config: RunnableConfig):
        return validator_node(state, config, llm)

    # Build the graph
    builder = StateGraph(AgentState)

    # Add nodes
    builder.add_node("planner", planner_node_with_llm)
    builder.add_node("executor", executor_node_with_llm)
    builder.add_node("validator", validator_node_with_llm)

    # Add edges
    builder.add_edge(START, "planner")
    builder.add_edge("planner", "executor")
    builder.add_edge("executor", "validator")

    # Add conditional edge from validator
    builder.add_conditional_edges(
        "validator",
        should_continue_or_end,
        {
            "planner": "planner",  # Go back to planner if needs revision
            "end": END  # End if validation passed or max iterations reached
        }
    )

    # Compile the graph
    compiled_graph = builder.compile()
    return compiled_graph


def get_llm_graph(provider_config: dict = None):
    """Get LLM graph with dynamic configuration"""
    return create_graph(provider_config)
