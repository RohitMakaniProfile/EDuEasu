import os
import chromadb
from sentence_transformers import SentenceTransformer
from groq import Groq
from app.config import settings

# Persistent ChromaDB
os.makedirs("./vector_db", exist_ok=True)
chroma_client = chromadb.PersistentClient(path="./vector_db")

# Lightweight embedding model (~80MB)
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Groq LLM client
groq_client = Groq(api_key=settings.GROQ_API_KEY)


def get_or_create_collection(course_id: str):
    name = f"course_{course_id}"
    try:
        return chroma_client.get_collection(name)
    except Exception:
        return chroma_client.create_collection(name)


def chunk_text(text: str, chunk_size: int = 400, overlap: int = 60) -> list:
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    return chunks if chunks else [text]


def add_document_to_course(
    course_id: str, text: str, doc_id: str, metadata: dict = {}
):
    """Embed and store a document in the course vector store."""
    if not text.strip():
        return

    collection = get_or_create_collection(course_id)
    chunks = chunk_text(text)
    if not chunks:
        return

    embeddings = embedder.encode(chunks).tolist()
    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {**metadata, "chunk_index": i, "doc_id": doc_id}
        for i in range(len(chunks))
    ]

    # Remove old version of this doc if re-uploading
    try:
        existing = collection.get(where={"doc_id": doc_id})
        if existing["ids"]:
            collection.delete(ids=existing["ids"])
    except Exception:
        pass

    collection.add(embeddings=embeddings, documents=chunks, ids=ids, metadatas=metadatas)
    print(f"✅ Indexed {len(chunks)} chunks for doc {doc_id} in course {course_id}")


def search_course(course_id: str, query: str, n_results: int = 5) -> list:
    """Retrieve top-k relevant chunks from a course vector store."""
    try:
        collection = get_or_create_collection(course_id)
        count = collection.count()
        if count == 0:
            return []
        query_emb = embedder.encode([query]).tolist()
        results = collection.query(
            query_embeddings=query_emb, n_results=min(n_results, count)
        )
        return results["documents"][0] if results["documents"] else []
    except Exception as e:
        print(f"RAG search error: {e}")
        return []


async def chat_with_course(
    course_id: str, query: str, chat_history: list = []
) -> str:
    """RAG-powered tutoring chat scoped to a single course."""
    chunks = search_course(course_id, query)

    if chunks:
        context = "\n\n".join(chunks)
        ctx_block = f"Relevant course material:\n{context}"
    else:
        ctx_block = (
            "No specific course material found for this query. "
            "Answer using general knowledge and note this."
        )

    system_prompt = f"""You are an intelligent tutoring assistant for this course.
Help students understand course content clearly and encouragingly.
Use bullet points and structure where helpful.

{ctx_block}

Guidelines:
- Base answers on course materials when available
- If the answer is not in the materials, say so but still help
- Be concise yet thorough
- Use examples to clarify complex topics"""

    messages = [{"role": "system", "content": system_prompt}]
    for msg in chat_history[-8:]:
        messages.append(msg)
    messages.append({"role": "user", "content": query})

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Sorry, I encountered an error: {str(e)}. Please try again."


def delete_course_collection(course_id: str):
    try:
        chroma_client.delete_collection(f"course_{course_id}")
        print(f"Deleted vector collection for course {course_id}")
    except Exception:
        pass
