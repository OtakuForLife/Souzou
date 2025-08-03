from langchain_core.tools import tool
import requests
from bs4 import BeautifulSoup
from readability import Document
from api.models import Entity, EntityType
import logging

logger = logging.getLogger(__name__)

@tool
def list_notes() -> str:
    """List all Entities of type Note"""
    notes = Entity.objects.filter(type=EntityType.NOTE).values('id', 'title', 'content')
    notes_list = list(notes)
    if not notes_list:
        return "No notes found."

    result = "Available notes:\n"
    for note in notes_list:
        result += f"- ID: {note['id']}, Title: {note['title']}\n"
    return result

@tool
def get_note(id: str) -> str:
    """Get id, title, and content of an Entity of type Note by its ID"""
    try:
        note = Entity.objects.get(id=id, type=EntityType.NOTE)
        return f"Note ID: {note.id}\nTitle: {note.title}\nContent: {note.content}"
    except Entity.DoesNotExist:
        return f"Note with ID {id} not found."

@tool
def create_note(title: str, content: str) -> str:
    """Create a new Entity of type Note based on title and content"""
    note = Entity.objects.create(title=title, content=content, type=EntityType.NOTE)
    return f"Created note with ID: {note.id}, Title: {note.title}"

@tool
def update_note(id: str, title: str, content: str) -> str:
    """Update an existing Entity of type Note with title and content"""
    try:
        note = Entity.objects.get(id=id, type=EntityType.NOTE)
        note.title = title or note.title  # Use existing title if not provided
        note.content = content or note.content  # Use existing content if not provided
        note.save()
        return f"Updated note with ID: {note.id}, Title: {note.title}"
    except Entity.DoesNotExist:
        return f"Note with ID {id} not found."

@tool
def find_notes_for_topic(topic: str) -> str:
    """Find notes related to a specific topic by searching titles and content"""
    try:
        # Search for notes that contain the topic in title or content
        notes = Entity.objects.filter(
            type=EntityType.NOTE
        ).filter(
            title__icontains=topic
        ) | Entity.objects.filter(
            type=EntityType.NOTE
        ).filter(
            content__icontains=topic
        )

        notes_list = list(notes.values('id', 'title', 'content')[:10])  # Limit to 10 results

        if not notes_list:
            return f"No notes found related to topic: {topic}"

        result = f"Notes related to '{topic}':\n"
        for note in notes_list:
            # Truncate content for readability
            content_preview = note['content'][:200] + "..." if len(note['content']) > 200 else note['content']
            result += f"- ID: {note['id']}, Title: {note['title']}\n  Content: {content_preview}\n\n"

        return result
    except Exception as e:
        logger.error(f"Error in find_notes_for_topic: {e}")
        return f"Error searching for notes: {str(e)}"

@tool
def summarize(text: str, max_length: int = 500) -> str:
    """Summarize the given text to a specified maximum length"""
    try:
        # Simple extractive summarization - take first sentences up to max_length
        sentences = text.split('. ')
        summary = ""

        for sentence in sentences:
            if len(summary + sentence + '. ') <= max_length:
                summary += sentence + '. '
            else:
                break

        if not summary:
            # If no complete sentences fit, truncate the first sentence
            summary = text[:max_length] + "..." if len(text) > max_length else text

        return summary.strip()
    except Exception as e:
        logger.error(f"Error in summarize: {e}")
        return f"Error summarizing text: {str(e)}"

@tool
def search_web(query: str) -> str:
    """
    Searches the web and and extracts the most relevant information from the first 3 links.
    """
    logger.info(f"search_web called with query: '{query}'")
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        search_url = f"https://html.duckduckgo.com/html/?q={query}"
        logger.info(f"Making search request to: {search_url}")

        res = requests.get(search_url, headers=headers)
        logger.info(f"Search request status: {res.status_code}")

        soup = BeautifulSoup(res.text, "html.parser")
        raw_links = [
            a['href'] for a in soup.find_all('a', class_='result__a', href=True)[:3]
        ]

        # Fix malformed URLs from DuckDuckGo
        result_links = []
        for link in raw_links:
            if link.startswith('//'):
                link = 'https:' + link
            elif not link.startswith('http'):
                link = 'https://' + link
            result_links.append(link)

        logger.info(f"Found {len(result_links)} result links: {result_links}")

        all_texts = []
        for i, url in enumerate(result_links):
            try:
                logger.info(f"Fetching content from link {i+1}: {url}")
                r = requests.get(url, headers=headers, timeout=7)
                logger.info(f"Link {i+1} status: {r.status_code}")

                doc = Document(r.text)
                html = doc.summary()
                clean_text = BeautifulSoup(html, "html.parser").get_text()
                all_texts.append(clean_text[:3000])  # Max. Text pro Seite
                logger.info(f"Link {i+1} content extracted: {len(clean_text)} chars")
            except Exception as e:
                logger.error(f"Error fetching {url}: {e}")
                all_texts.append(f"[Fehler beim Abrufen von {url}: {e}]")

        result = "\n\n---\n\n".join(all_texts)
        logger.info(f"search_web returning result of {len(result)} characters")
        return result
    except Exception as e:
        logger.error(f"Error in search_web: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise


# Export all tools for use in agent
all_tools = [search_web, list_notes, get_note, create_note, update_note, find_notes_for_topic, summarize]
all_tools_by_name = {tool.name: tool for tool in all_tools}