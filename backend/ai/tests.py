from django.test import TestCase
from unittest.mock import Mock, patch
from langchain_core.messages import HumanMessage, AIMessage
from api.models import Entity, EntityType

from .llm.agent import create_graph, AgentState, planner_node, executor_node, validator_node
from .llm.tools import create_note, update_note, list_notes, get_note, find_notes_for_topic, summarize, search_web


class LangGraphWorkflowTests(TestCase):
    """Test the new LangGraph workflow implementation"""

    def setUp(self):
        """Set up test data"""
        self.provider_config = {
            "model": "gpt-3.5-turbo",
            "model_provider": "openai",
            "api_key": "test-key",
            "base_url": None,
            "timeout": 30
        }

        # Create test notes
        self.test_note = Entity.objects.create(
            title="Test Note",
            content="This is a test note about Python programming.",
            type=EntityType.NOTE
        )

    def test_agent_state_structure(self):
        """Test that AgentState has the correct structure"""
        state = {
            "messages": [HumanMessage(content="Test message")],
            "plan": None,
            "execution_results": None,
            "validation_feedback": None,
            "iteration_count": 0
        }

        # Verify all required fields are present
        self.assertIn("messages", state)
        self.assertIn("plan", state)
        self.assertIn("execution_results", state)
        self.assertIn("validation_feedback", state)
        self.assertIn("iteration_count", state)

    @patch('ai.llm.agent.init_chat_model')
    def test_create_graph(self, mock_init_chat_model):
        """Test that the graph is created successfully"""
        # Mock the LLM
        mock_llm = Mock()
        mock_init_chat_model.return_value = mock_llm

        # Create the graph
        graph = create_graph(self.provider_config)

        # Verify graph was created
        self.assertIsNotNone(graph)
        mock_init_chat_model.assert_called_once()

    def test_tools_are_available(self):
        """Test that all required tools are available"""
        from .llm.tools import all_tools, all_tools_by_name

        expected_tools = [
            'create_note', 'update_note', 'list_notes', 'get_note',
            'find_notes_for_topic', 'summarize', 'search_web'
        ]

        for tool_name in expected_tools:
            self.assertIn(tool_name, all_tools_by_name)

    def test_create_note_tool(self):
        """Test the create_note tool"""
        result = create_note.invoke({"title": "Test Tool Note", "content": "Test content"})

        self.assertIn("Created note with ID:", result)
        self.assertIn("Test Tool Note", result)

        # Verify note was actually created
        note = Entity.objects.filter(title="Test Tool Note").first()
        self.assertIsNotNone(note)
        self.assertEqual(note.content, "Test content")

    def test_list_notes_tool(self):
        """Test the list_notes tool"""
        result = list_notes.invoke({})

        self.assertIn("Available notes:", result)
        self.assertIn(self.test_note.title, result)

    def test_get_note_tool(self):
        """Test the get_note tool"""
        result = get_note.invoke({"id": str(self.test_note.id)})

        self.assertIn(f"Note ID: {self.test_note.id}", result)
        self.assertIn(self.test_note.title, result)
        self.assertIn(self.test_note.content, result)

    def test_find_notes_for_topic_tool(self):
        """Test the find_notes_for_topic tool"""
        result = find_notes_for_topic.invoke({"topic": "Python"})

        self.assertIn("Notes related to 'Python':", result)
        self.assertIn(self.test_note.title, result)

    def test_summarize_tool(self):
        """Test the summarize tool"""
        long_text = "This is a very long text. " * 50
        result = summarize.invoke({"text": long_text, "max_length": 100})

        self.assertLessEqual(len(result), 120)  # Allow some buffer for ellipsis
        self.assertIn("This is a very long text", result)

    @patch('ai.llm.tools.requests.get')
    def test_search_web_tool(self, mock_get):
        """Test the search_web tool"""
        # Mock the search response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = '''
        <html>
            <body>
                <a class="result__a" href="https://example.com">Test Result</a>
            </body>
        </html>
        '''
        mock_get.return_value = mock_response

        result = search_web.invoke({"query": "test query"})

        self.assertIsInstance(result, str)
        mock_get.assert_called()


class WorkflowNodeTests(TestCase):
    """Test individual workflow nodes"""

    def setUp(self):
        """Set up test data"""
        self.mock_llm = Mock()
        self.mock_config = Mock()

        self.test_state = {
            "messages": [HumanMessage(content="Create a note about AI")],
            "plan": None,
            "execution_results": None,
            "validation_feedback": None,
            "iteration_count": 0
        }

    def test_planner_node_creates_plan(self):
        """Test that planner node creates a plan"""
        # Mock LLM response
        mock_response = AIMessage(content="Plan: 1. Create note about AI 2. Add relevant content")
        self.mock_llm.invoke.return_value = mock_response

        result = planner_node(self.test_state, self.mock_config, self.mock_llm)

        self.assertIn("plan", result)
        self.assertIsNotNone(result["plan"])
        self.assertIn("messages", result)

    def test_validator_node_provides_feedback(self):
        """Test that validator node provides appropriate feedback"""
        # Set up state with execution results
        state_with_results = self.test_state.copy()
        state_with_results["execution_results"] = "Created note successfully"
        state_with_results["plan"] = "Create a note about AI"

        # Mock LLM response for approval
        mock_response = AIMessage(content="APPROVED: The task was completed successfully")
        self.mock_llm.invoke.return_value = mock_response

        result = validator_node(state_with_results, self.mock_config, self.mock_llm)

        self.assertIn("validation_feedback", result)
        self.assertIn("messages", result)
