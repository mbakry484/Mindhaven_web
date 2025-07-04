from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import JournalEntry
import json


@csrf_exempt
def get_journal_entries(request, user_id):
    try:
        entries = JournalEntry.objects.filter(user=user_id)
        entries_data = [
            {
                "id": entry.id,
                "title": entry.title,
                "content": entry.content,
                "date": entry.date.isoformat(),
                "updated_at": entry.updated_at.isoformat(),
            }
            for entry in entries
        ]
        return JsonResponse({"entries": entries_data})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def add_journal_entry(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            entry = JournalEntry.objects.create(
                user=data["user_id"],
                title=data.get("title", "Untitled Entry"),
                content=data["content"],
            )
            return JsonResponse(
                {
                    "id": entry.id,
                    "title": entry.title,
                    "content": entry.content,
                    "date": entry.date.isoformat(),
                    "updated_at": entry.updated_at.isoformat(),
                }
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def update_journal_entry(request, entry_id):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            entry = JournalEntry.objects.get(id=entry_id)
            entry.title = data.get("title", entry.title)
            entry.content = data.get("content", entry.content)
            entry.save()
            return JsonResponse(
                {
                    "id": entry.id,
                    "title": entry.title,
                    "content": entry.content,
                    "date": entry.date.isoformat(),
                    "updated_at": entry.updated_at.isoformat(),
                }
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def delete_journal_entry(request, entry_id):
    if request.method == "DELETE":
        try:
            entry = JournalEntry.objects.get(id=entry_id)
            entry.delete()
            return JsonResponse({"message": "Entry deleted successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)
